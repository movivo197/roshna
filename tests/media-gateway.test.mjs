import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateUpstreamUrl,
  isPrivateOrInternalHost,
  createSignedToken,
  verifySignedToken,
} from '../lib/media/security.ts';
import { rewriteHlsManifest } from '../lib/media/hls-rewrite.ts';
import { generateCanaryManifest } from '../lib/media/health.ts';

describe('Media Gateway Security & SSRF Protection', () => {
  it('blocks localhost, private networks, and link-local cloud metadata', () => {
    assert.equal(isPrivateOrInternalHost('localhost'), true);
    assert.equal(isPrivateOrInternalHost('127.0.0.1'), true);
    assert.equal(isPrivateOrInternalHost('10.0.0.5'), true);
    assert.equal(isPrivateOrInternalHost('192.168.1.100'), true);
    assert.equal(isPrivateOrInternalHost('172.20.0.1'), true);
    assert.equal(isPrivateOrInternalHost('169.254.169.254'), true);
    assert.equal(isPrivateOrInternalHost('::1'), true);

    // Public host should pass internal check
    assert.equal(isPrivateOrInternalHost('persiana.live'), false);
    assert.equal(isPrivateOrInternalHost('wns.live'), false);
  });

  it('rejects unsupported protocols and non-allowlisted hosts', () => {
    assert.equal(validateUpstreamUrl('file:///etc/passwd').ok, false);
    assert.equal(validateUpstreamUrl('gopher://localhost:70').ok, false);
    assert.equal(validateUpstreamUrl('http://127.0.0.1/hls').ok, false);

    // Allowlist check
    const allowed = ['persiana.live', 'wns.live'];
    const resAllowed = validateUpstreamUrl('https://cinehls.persiana.live/stream.m3u8', allowed);
    assert.equal(resAllowed.ok, true);

    const resForbidden = validateUpstreamUrl('https://malicious.example.com/stream.m3u8', allowed);
    assert.equal(resForbidden.ok, false);
  });

  it('generates and verifies HMAC-SHA256 tokens with channel and expiry checks', () => {
    const target = 'https://cinehls.persiana.live/hls/segment1.ts';
    const token = createSignedToken(target, 'cinema', 3600);
    assert.ok(typeof token === 'string' && token.includes('.'));

    const verified = verifySignedToken(token, 'cinema');
    assert.equal(verified.valid, true);
    assert.equal(verified.url, target);

    // Channel mismatch rejection
    const wrongChannel = verifySignedToken(token, 'sport');
    assert.equal(wrongChannel.valid, false);

    // Tampered token rejection
    const tampered = token.slice(0, -4) + 'abcd';
    const badSig = verifySignedToken(tampered, 'cinema');
    assert.equal(badSig.valid, false);

    // Expired token rejection
    const expiredToken = createSignedToken(target, 'cinema', -10);
    const expCheck = verifySignedToken(expiredToken, 'cinema');
    assert.equal(expCheck.valid, false);
    assert.equal(expCheck.error, 'Token expired');
  });
});

describe('HLS Manifest Rewriter & Canary Health', () => {
  it('rewrites relative and absolute segment URIs, EXT-X-KEY and EXT-X-MAP into signed same-origin endpoints', () => {
    const upstreamUrl = 'https://cinehls.persiana.live/hls/live.m3u8';
    const sampleManifest = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:6
#EXT-X-KEY:METHOD=AES-128,URI="https://cdn.example/key.bin",IV=0x1234
#EXT-X-MAP:URI="init.mp4"
#EXTINF:6.0,
segment1.ts
#EXTINF:6.0,
https://cdn.example/segment2.ts
`;

    const rewritten = rewriteHlsManifest(sampleManifest, upstreamUrl, 'cinema');
    assert.equal(rewritten.ok, true);
    assert.ok(rewritten.content);

    // Check segment 1 (relative resolved against upstreamUrl)
    assert.ok(rewritten.content.includes('/api/media/hls/cinema/r?t='));
    // Check EXT-X-KEY rewritten
    assert.ok(rewritten.content.includes('#EXT-X-KEY:METHOD=AES-128,URI="/api/media/hls/cinema/r?t='));
    // Check EXT-X-MAP rewritten
    assert.ok(rewritten.content.includes('#EXT-X-MAP:URI="/api/media/hls/cinema/r?t='));

    // Verify token embedded inside rewritten line actually points to resolved URL
    const lines = rewritten.content.split('\n');
    const seg1Line = lines.find(l => l.startsWith('/api/media/hls/cinema/r?t='));
    assert.ok(seg1Line);
    const token = seg1Line.split('?t=')[1];
    const verified = verifySignedToken(token, 'cinema');
    assert.equal(verified.valid, true);
    assert.equal(verified.url, 'https://cinehls.persiana.live/hls/segment1.ts');
  });

  it('rejects malformed manifests missing #EXTM3U', () => {
    const badManifest = `<html><body>Not a playlist</body></html>`;
    const res = rewriteHlsManifest(badManifest, 'https://example.com/playlist', 'ch1');
    assert.equal(res.ok, false);
  });

  it('generates valid Canary HLS manifest for offline diagnostic loops', () => {
    const canary = generateCanaryManifest();
    assert.ok(canary.startsWith('#EXTM3U'));
    assert.ok(canary.includes('#EXT-X-TARGETDURATION:4'));
    assert.ok(canary.includes('/api/media/hls/_canary/r?t=canary_segment_1'));
  });
});

import { NextRequest } from 'next/server';
import { TV_CHANNELS } from '@/lib/media/registry';
import { validateUpstreamUrl } from '@/lib/media/security';
import { rewriteHlsManifest } from '@/lib/media/hls-rewrite';
import {
  getBestTvSource,
  recordSourceFailure,
  recordSourceSuccess,
  generateCanaryManifest,
} from '@/lib/media/health';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await context.params;

  // 1. Canary Stream Handler
  if (channelId === '_canary') {
    const canary = generateCanaryManifest();
    return new Response(canary, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Accel-Buffering': 'no',
      },
    });
  }

  // 2. Validate Channel in Registry
  const channel = TV_CHANNELS[channelId];
  if (!channel) {
    return new Response(JSON.stringify({ error: 'Channel not found in media registry' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 3. Resolve Best Upstream Source
  const source = getBestTvSource(channelId);
  if (!source) {
    return new Response(JSON.stringify({ error: 'No available sources configured for this channel' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 4. SSRF Validation
  const validation = validateUpstreamUrl(source.manifestUrl, source.allowedHosts);
  if (!validation.ok) {
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 5. Fetch Upstream Manifest
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const upstream = await fetch(source.manifestUrl, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 RoshanaMediaGateway/2.0',
        Accept: 'application/vnd.apple.mpegurl, application/x-mpegurl, */*',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!upstream.ok) {
      recordSourceFailure(source.id, `HTTP ${upstream.status}`);
      return new Response(JSON.stringify({ error: `Upstream source returned HTTP ${upstream.status}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const manifestText = await upstream.text();
    if (manifestText.length > 2_000_000) {
      return new Response(JSON.stringify({ error: 'Manifest exceeds allowable size' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 6. Rewrite Manifest to same-origin signed URLs
    const rewritten = rewriteHlsManifest(manifestText, source.manifestUrl, channelId);
    if (!rewritten.ok) {
      recordSourceFailure(source.id, rewritten.error || 'Rewrite failed');
      return new Response(JSON.stringify({ error: rewritten.error }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    recordSourceSuccess(source.id, Date.now() - start);

    return new Response(rewritten.content, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Accel-Buffering': 'no',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown upstream error';
    recordSourceFailure(source.id, message);

    return new Response(JSON.stringify({ error: 'Failed to contact live stream server', detail: message }), {
      status: 504,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

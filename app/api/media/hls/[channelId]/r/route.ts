import { NextRequest } from 'next/server';
import { verifySignedToken, validateUpstreamUrl } from '@/lib/media/security';
import { TV_CHANNELS } from '@/lib/media/registry';
import { rewriteHlsManifest } from '@/lib/media/hls-rewrite';
import { SILENT_AAC_FRAME } from '@/lib/media/health';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await context.params;
  const token = request.nextUrl.searchParams.get('t');

  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing token' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 1. Canary Segment Mock Handling
  if (token.startsWith('canary_segment_')) {
    return new Response(SILENT_AAC_FRAME, {
      status: 200,
      headers: {
        'Content-Type': 'audio/aac',
        'Content-Length': String(SILENT_AAC_FRAME.length),
        'Cache-Control': 'no-store',
        'X-Accel-Buffering': 'no',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // 2. Verify Signed HMAC Token
  const tokenCheck = verifySignedToken(token, channelId);
  if (!tokenCheck.valid || !tokenCheck.url) {
    return new Response(JSON.stringify({ error: tokenCheck.error || 'Invalid or expired token' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const targetUrl = tokenCheck.url;

  // 3. Resolve Allowed Hosts for this Channel
  const channel = TV_CHANNELS[channelId];
  const allowedHosts = channel
    ? Array.from(new Set(channel.sources.flatMap(s => s.allowedHosts)))
    : [];

  // 4. SSRF Validation
  const validation = validateUpstreamUrl(targetUrl, allowedHosts);
  if (!validation.ok) {
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 5. Fetch Upstream Segment / Sub-playlist
  const range = request.headers.get('range');
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000);

    const upstream = await fetch(targetUrl, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 RoshanaMediaGateway/2.0',
        ...(range ? { Range: range } : {}),
        Accept: '*/*',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!upstream.ok && upstream.status !== 206) {
      return new Response(JSON.stringify({ error: `Upstream resource failed: ${upstream.status}` }), {
        status: upstream.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const contentType = upstream.headers.get('content-type') || '';
    const isManifest =
      targetUrl.includes('.m3u8') ||
      contentType.includes('mpegurl') ||
      contentType.includes('application/x-mpegurl');

    // 6. Sub-manifest rewriting if this was a variant playlist
    if (isManifest) {
      const text = await upstream.text();
      const rewritten = rewriteHlsManifest(text, targetUrl, channelId);
      return new Response(rewritten.ok ? rewritten.content : text, {
        status: upstream.status,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'X-Accel-Buffering': 'no',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // 7. Binary Streaming (ts, mp4, aac, key, etc.)
    const responseHeaders: Record<string, string> = {
      'Content-Type': contentType || 'video/mp2t',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
    };

    if (upstream.headers.get('content-range')) {
      responseHeaders['Content-Range'] = upstream.headers.get('content-range')!;
    }
    if (upstream.headers.get('accept-ranges')) {
      responseHeaders['Accept-Ranges'] = upstream.headers.get('accept-ranges')!;
    }
    if (upstream.headers.get('content-length')) {
      responseHeaders['Content-Length'] = upstream.headers.get('content-length')!;
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown upstream error';
    return new Response(JSON.stringify({ error: 'Failed to fetch media segment', detail: message }), {
      status: 504,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

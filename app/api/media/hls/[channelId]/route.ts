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
  request: NextRequest,
  context: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await context.params;

  // 1. Canary Stream Handler
  if (channelId === '_canary') {
    const canary = generateCanaryManifest();
    return new Response(canary, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Accel-Buffering': 'no',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // 2. Validate Channel in Registry
  const channel = TV_CHANNELS[channelId];
  if (!channel || !channel.sources.length) {
    return new Response(JSON.stringify({ error: 'Channel not found in media registry' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 3. Resolve Candidate Sources with Failover Order
  const serverParam = request.nextUrl.searchParams.get('s');
  let orderedSources = [...channel.sources];

  if (serverParam !== null) {
    const requestedIdx = parseInt(serverParam, 10);
    if (!isNaN(requestedIdx) && channel.sources[requestedIdx]) {
      const selected = channel.sources[requestedIdx];
      orderedSources = [selected, ...channel.sources.filter((_, idx) => idx !== requestedIdx)];
    }
  } else {
    // Put healthiest or highest priority first
    const best = getBestTvSource(channelId);
    if (best) {
      orderedSources = [best, ...channel.sources.filter(s => s.id !== best.id)];
    }
  }

  // 4. Sequential Automatic Failover Loop
  let lastError = 'No stream sources available';

  for (const source of orderedSources) {
    // SSRF Validation
    const validation = validateUpstreamUrl(source.manifestUrl, source.allowedHosts);
    if (!validation.ok) {
      recordSourceFailure(source.id, validation.error || 'SSRF rejected');
      lastError = validation.error || 'SSRF rejected';
      continue;
    }

    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6500);

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
        lastError = `HTTP ${upstream.status}`;
        continue;
      }

      const manifestText = await upstream.text();
      if (manifestText.length > 2_000_000 || !manifestText.includes('#EXTM3U')) {
        recordSourceFailure(source.id, 'Invalid manifest format');
        lastError = 'Invalid manifest format';
        continue;
      }

      // Rewrite Manifest to same-origin signed URLs
      const rewritten = rewriteHlsManifest(manifestText, source.manifestUrl, channelId);
      if (!rewritten.ok || !rewritten.content) {
        recordSourceFailure(source.id, rewritten.error || 'Rewrite failed');
        lastError = rewritten.error || 'Rewrite failed';
        continue;
      }

      recordSourceSuccess(source.id, Date.now() - start);

      return new Response(rewritten.content, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'X-Accel-Buffering': 'no',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Timeout connecting to upstream';
      recordSourceFailure(source.id, msg);
      lastError = msg;
    }
  }

  return new Response(
    JSON.stringify({ error: 'All stream server sources failed or timed out', detail: lastError }),
    {
      status: 504,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

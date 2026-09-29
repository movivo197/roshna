import { NextRequest } from 'next/server';
import { RADIO_STATIONS } from '@/lib/media/registry';
import { validateUpstreamUrl } from '@/lib/media/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ stationId: string }> }
) {
  const { stationId } = await context.params;

  const station = RADIO_STATIONS[stationId];
  if (!station || !station.sources.length) {
    return new Response(JSON.stringify({ error: 'Radio station not found in media registry' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const source = station.sources[0];

  // SSRF check
  const validation = validateUpstreamUrl(source.streamUrl, source.allowedHosts);
  if (!validation.ok) {
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const range = request.headers.get('range');
  try {
    const upstream = await fetch(source.streamUrl, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 RoshanaRadioRelay/2.0',
        ...(range ? { Range: range } : {}),
        'Icy-MetaData': '1',
        Accept: 'audio/*, */*',
      },
    });

    if (!upstream.ok && upstream.status !== 206) {
      return new Response(JSON.stringify({ error: `Radio upstream returned ${upstream.status}` }), {
        status: upstream.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const responseHeaders: Record<string, string> = {
      'Content-Type': upstream.headers.get('content-type') || 'audio/mpeg',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
    };

    // Forward Icecast metadata headers if present
    ['icy-name', 'icy-genre', 'icy-br', 'icy-metaint'].forEach(headerName => {
      const val = upstream.headers.get(headerName);
      if (val) responseHeaders[headerName] = val;
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown upstream error';
    return new Response(JSON.stringify({ error: 'Failed to connect to radio stream', detail: message }), {
      status: 504,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

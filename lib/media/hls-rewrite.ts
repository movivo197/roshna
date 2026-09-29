import { createSignedToken } from './security.ts';

/**
 * Rewrites URI inside attribute lists like URI="path/to/resource"
 */
function rewriteAttributeUri(
  line: string,
  attributeName: string,
  upstreamBaseUrl: string,
  channelId: string
): string {
  const regex = new RegExp(`(${attributeName}=")([^"]+)(")`, 'g');
  return line.replace(regex, (_match, prefix, rawUri, suffix) => {
    try {
      const resolved = new URL(rawUri, upstreamBaseUrl).toString();
      const token = createSignedToken(resolved, channelId);
      const proxiedUri = `/api/media/hls/${encodeURIComponent(channelId)}/r?t=${token}`;
      return `${prefix}${proxiedUri}${suffix}`;
    } catch {
      return `${prefix}${rawUri}${suffix}`;
    }
  });
}

/**
 * Rewrites an HLS manifest, resolving all sub-playlists, media segments,
 * keys, and map URIs into same-origin proxy URLs.
 */
export function rewriteHlsManifest(
  manifestContent: string,
  upstreamBaseUrl: string,
  channelId: string
): { ok: boolean; content?: string; error?: string } {
  if (!manifestContent || typeof manifestContent !== 'string') {
    return { ok: false, error: 'Empty manifest' };
  }

  const lines = manifestContent.split(/\r?\n/);
  const firstNonEmpty = lines.find(l => l.trim().length > 0);
  if (!firstNonEmpty || !firstNonEmpty.startsWith('#EXTM3U')) {
    return { ok: false, error: 'Invalid HLS playlist: missing #EXTM3U header' };
  }

  const rewrittenLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      rewrittenLines.push(line);
      continue;
    }

    if (trimmed.startsWith('#')) {
      // Tags with URI attributes that require rewriting
      if (trimmed.startsWith('#EXT-X-KEY:')) {
        line = rewriteAttributeUri(line, 'URI', upstreamBaseUrl, channelId);
      } else if (trimmed.startsWith('#EXT-X-MAP:')) {
        line = rewriteAttributeUri(line, 'URI', upstreamBaseUrl, channelId);
      } else if (trimmed.startsWith('#EXT-X-MEDIA:')) {
        line = rewriteAttributeUri(line, 'URI', upstreamBaseUrl, channelId);
      } else if (trimmed.startsWith('#EXT-X-I-FRAME-STREAM-INF:')) {
        line = rewriteAttributeUri(line, 'URI', upstreamBaseUrl, channelId);
      } else if (trimmed.startsWith('#EXT-X-SESSION-KEY:')) {
        line = rewriteAttributeUri(line, 'URI', upstreamBaseUrl, channelId);
      } else if (trimmed.startsWith('#EXT-X-PRELOAD-HINT:')) {
        line = rewriteAttributeUri(line, 'URI', upstreamBaseUrl, channelId);
      } else if (trimmed.startsWith('#EXT-X-RENDITION-REPORT:')) {
        line = rewriteAttributeUri(line, 'URI', upstreamBaseUrl, channelId);
      }

      rewrittenLines.push(line);
    } else {
      // Normal media segment or sub-variant playlist URI line
      try {
        const resolved = new URL(trimmed, upstreamBaseUrl).toString();
        const token = createSignedToken(resolved, channelId);
        const proxiedUri = `/api/media/hls/${encodeURIComponent(channelId)}/r?t=${token}`;
        rewrittenLines.push(proxiedUri);
      } catch {
        rewrittenLines.push(line);
      }
    }
  }

  return { ok: true, content: rewrittenLines.join('\n') };
}

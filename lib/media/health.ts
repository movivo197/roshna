import { TV_CHANNELS, type TvSource } from './registry.ts';

export interface SourceHealth {
  sourceId: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  consecutiveFailures: number;
  lastOkAt: string | null;
  lastError: string | null;
  checkedAt: string;
}

const healthMap = new Map<string, SourceHealth>();

export function recordSourceSuccess(sourceId: string, latencyMs: number) {
  const current = healthMap.get(sourceId) || {
    sourceId,
    status: 'healthy',
    latencyMs,
    consecutiveFailures: 0,
    lastOkAt: null,
    lastError: null,
    checkedAt: new Date().toISOString(),
  };

  current.status = 'healthy';
  current.latencyMs = latencyMs;
  current.consecutiveFailures = 0;
  current.lastOkAt = new Date().toISOString();
  current.checkedAt = new Date().toISOString();
  healthMap.set(sourceId, current);
}

export function recordSourceFailure(sourceId: string, error: string) {
  const current = healthMap.get(sourceId) || {
    sourceId,
    status: 'healthy',
    latencyMs: 0,
    consecutiveFailures: 0,
    lastOkAt: null,
    lastError: null,
    checkedAt: new Date().toISOString(),
  };

  current.consecutiveFailures += 1;
  current.status = current.consecutiveFailures >= 3 ? 'down' : 'degraded';
  current.lastError = error;
  current.checkedAt = new Date().toISOString();
  healthMap.set(sourceId, current);
}

export function getBestTvSource(channelId: string): TvSource | null {
  const channel = TV_CHANNELS[channelId];
  if (!channel || !channel.sources.length) return null;

  // Filter sources by health
  const sorted = [...channel.sources].sort((a, b) => {
    const healthA = healthMap.get(a.id);
    const healthB = healthMap.get(b.id);

    const failA = healthA?.consecutiveFailures || 0;
    const failB = healthB?.consecutiveFailures || 0;

    // First compare failures (prefer healthy)
    if (failA !== failB) return failA - failB;

    // Then compare priority (lower number = higher priority)
    return a.priority - b.priority;
  });

  return sorted[0] || null;
}

/**
 * Generates an internal valid HLS canary playlist for self-diagnostic tests.
 */
export function generateCanaryManifest(): string {
  const now = Math.floor(Date.now() / 2000);
  const seq = now;

  return `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:4
#EXT-X-MEDIA-SEQUENCE:${seq}
#EXT-X-DISCONTINUITY
#EXTINF:2.0, Canary Signal 1
/api/media/hls/_canary/r?t=canary_segment_1
#EXTINF:2.0, Canary Signal 2
/api/media/hls/_canary/r?t=canary_segment_2
#EXTINF:2.0, Canary Signal 3
/api/media/hls/_canary/r?t=canary_segment_3
`;
}

/**
 * Minimal silent AAC audio segment payload (1 second silent ADTS frame)
 * to verify binary transport and audio decoder.
 */
export const SILENT_AAC_FRAME = Buffer.from([
  0xff, 0xf1, 0x50, 0x80, 0x01, 0x3f, 0xfc, 0xde, 0x02, 0x00, 0x4c, 0x61, 0x76, 0x63, 0x35, 0x38,
]);

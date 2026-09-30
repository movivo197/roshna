import crypto from 'node:crypto';

const SECRET_KEY = process.env.MEDIA_GATEWAY_SECRET || 'roshana-media-sec-gateway-default-key-2026';

/**
 * Checks whether an IP or hostname is private/internal/loopback.
 */
export function isPrivateOrInternalHost(host: string): boolean {
  const normalized = host.toLowerCase().trim();

  if (
    normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized.endsWith('.local') ||
    normalized.endsWith('.internal') ||
    normalized === '169.254.169.254' // cloud metadata service
  ) {
    return true;
  }

  // IPv4 regex checks
  const ipv4Match = normalized.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const octets = ipv4Match.slice(1).map(Number);
    if (octets.some(o => o < 0 || o > 255)) return true;

    // 127.0.0.0/8 (Loopback)
    if (octets[0] === 127) return true;
    // 0.0.0.0/8
    if (octets[0] === 0) return true;
    // 10.0.0.0/8 (Private)
    if (octets[0] === 10) return true;
    // 172.16.0.0/12 (Private)
    if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true;
    // 192.168.0.0/16 (Private)
    if (octets[0] === 192 && octets[1] === 168) return true;
    // 169.254.0.0/16 (Link Local)
    if (octets[0] === 169 && octets[1] === 254) return true;
  }

  // IPv6 checks
  if (
    normalized === '::1' ||
    normalized === '0:0:0:0:0:0:0:1' ||
    normalized.startsWith('fc00:') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80:')
  ) {
    return true;
  }

  return false;
}

export const TRUSTED_MEDIA_DOMAINS = [
  'persiana.live',
  'wns.live',
  'avatv.live',
  '4utv.live',
  'akamaized.net',
  'medya.trt.com.tr',
  'trtworld.com',
  'iranintl.com',
  'radiojavan.com',
  'avang.live',
  'telewebion.ir',
  'telewebion.com',
  'zeno.fm',
];

/**
 * Validates upstream URL against scheme, SSRF checks, and per-source host allowlist.
 */
export function validateUpstreamUrl(
  urlStr: string,
  allowedHosts: string[] = []
): { ok: boolean; error?: string; url?: URL } {
  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    return { ok: false, error: 'Invalid URL format' };
  }

  // Protocol check
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: `Unauthorized protocol: ${parsed.protocol}` };
  }

  const host = parsed.hostname.toLowerCase();

  // Internal/private rejection
  if (isPrivateOrInternalHost(host)) {
    return { ok: false, error: `SSRF rejected: Access to private/internal host ${host} is forbidden` };
  }

  // Allowlist verification with boundary-safe suffix matching
  if (allowedHosts.length > 0) {
    const combinedAllowed = [...allowedHosts, ...TRUSTED_MEDIA_DOMAINS];
    const isAllowed = combinedAllowed.some(allowed => {
      const a = allowed.toLowerCase().trim();
      return host === a || host.endsWith('.' + a);
    });

    if (!isAllowed) {
      return { ok: false, error: `Host ${host} is not in the source allowlist` };
    }
  }

  return { ok: true, url: parsed };
}

/**
 * Creates an HMAC-SHA256 signed token embedding the target upstream URL and expiration.
 */
export function createSignedToken(targetUrl: string, channelId: string, ttlSeconds = 7200): string {
  const payload = JSON.stringify({
    u: targetUrl,
    c: channelId,
    exp: Date.now() + ttlSeconds * 1000,
  });

  const encodedPayload = Buffer.from(payload, 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies HMAC-SHA256 signed token and returns the embedded upstream URL.
 */
export function verifySignedToken(
  token: string,
  expectedChannelId?: string
): { valid: boolean; url?: string; channelId?: string; error?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Missing token' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Malformed token structure' };
  }

  const [encodedPayload, providedSignature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(encodedPayload)
    .digest('base64url');

  // Constant-time comparison
  const sigBuf = Buffer.from(providedSignature, 'utf8');
  const expBuf = Buffer.from(expectedSignature, 'utf8');
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false, error: 'Invalid HMAC signature' };
  }

  try {
    const payloadStr = Buffer.from(encodedPayload, 'base64url').toString('utf8');
    const data = JSON.parse(payloadStr);

    if (typeof data.u !== 'string' || typeof data.exp !== 'number') {
      return { valid: false, error: 'Invalid token payload' };
    }

    if (Date.now() > data.exp) {
      return { valid: false, error: 'Token expired' };
    }

    if (expectedChannelId && data.c && data.c !== expectedChannelId) {
      return { valid: false, error: 'Token channel mismatch' };
    }

    return { valid: true, url: data.u, channelId: data.c };
  } catch {
    return { valid: false, error: 'Failed to decode token' };
  }
}

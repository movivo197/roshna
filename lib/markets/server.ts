import 'server-only';
import { isIP } from 'node:net';
import type { NextRequest } from 'next/server';
import type { DataFeed } from './types';
import { Agent } from 'undici';

const upstreamHosts = new Set(['api.frankfurter.dev', 'api.gdeltproject.org', 'pro-api.coingecko.com', 'api.coingecko.com']);

const dispatcher = new Agent({
  connect: {
    rejectUnauthorized: false,
  },
});

/** Static destinations only; redirects are rejected so upstream cannot redirect into the private network. */
export async function fetchPublicJson(url: URL, headers?: Record<string, string>): Promise<unknown> {
  if (url.protocol !== 'https:' || !upstreamHosts.has(url.hostname) || url.port || url.username || url.password) throw new Error('INVALID_UPSTREAM');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    // @ts-expect-error Node fetch supports undici dispatcher
    const response = await fetch(url, { signal: controller.signal, redirect: 'error', cache: 'no-store', dispatcher, headers: { Accept: 'application/json', 'User-Agent': 'Roshna/2.0 (+https://roshna.moeid.net)', ...headers } });
    if (!response.ok || !response.body) throw new Error('UPSTREAM_UNAVAILABLE');
    if (Number(response.headers.get('content-length') || 0) > 1_000_000) throw new Error('UPSTREAM_TOO_LARGE');
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > 1_000_000) { await reader.cancel(); throw new Error('UPSTREAM_TOO_LARGE'); }
        chunks.push(chunk.value);
      }
    } finally { reader.releaseLock(); }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } finally { clearTimeout(timeout); }
}

type Entry = { value?: unknown; fetchedAt: number; retryAt: number; flight?: Promise<DataFeed<unknown>> };
const cache = new Map<string, Entry>();
/** Coalesces simultaneous requests and retains only successful source observations, never generated values. */
export async function cachedFeed<T>(key: string, ttl: number, maxAge: number, empty: T, load: () => Promise<T>): Promise<DataFeed<T>> {
  const now = Date.now();
  const entry = cache.get(key) || { fetchedAt: 0, retryAt: 0 };
  const envelope = (status: DataFeed<T>['status'], message?: string): DataFeed<T> => ({
    status, fetchedAt: entry.fetchedAt ? new Date(entry.fetchedAt).toISOString() : null,
    checkedAt: new Date().toISOString(), message, data: entry.value === undefined ? empty : entry.value as T,
  });
  if (entry.value !== undefined && now - entry.fetchedAt < ttl) return envelope('fresh');
  if (entry.flight) return entry.flight as Promise<DataFeed<T>>;
  if (now < entry.retryAt) return entry.value !== undefined && now - entry.fetchedAt < maxAge ? envelope('stale', 'ارتباط با منبع برقرار نشد؛ آخرین داده ذخیره‌شده نمایش داده می‌شود.') : { ...envelope('unavailable', 'منبع فعلاً پاسخ نمی‌دهد. کمی بعد دوباره تلاش کنید.'), data: empty, fetchedAt: null };
  if (cache.size >= 48 && !cache.has(key)) {
    const removable = [...cache].find(([, item]) => !item.flight);
    if (removable) cache.delete(removable[0]);
    else return { status: 'unavailable', fetchedAt: null, checkedAt: new Date().toISOString(), data: empty, message: 'سرویس مشغول است؛ کمی بعد تلاش کنید.' };
  }
  cache.set(key, entry);
  const flight = (async (): Promise<DataFeed<T>> => {
    try {
      entry.value = await load();
      entry.fetchedAt = Date.now(); entry.retryAt = 0;
      return envelope('fresh');
    } catch {
      entry.retryAt = Date.now() + 30_000;
      if (entry.value !== undefined && Date.now() - entry.fetchedAt < maxAge) return envelope('stale', 'منبع در دسترس نیست؛ تاریخ داده قبلی را بررسی کنید.');
      return { ...envelope('unavailable', 'دریافت داده از منبع ممکن نشد.'), data: empty, fetchedAt: null };
    } finally { entry.flight = undefined; }
  })();
  entry.flight = flight as Promise<DataFeed<unknown>>;
  return flight;
}

const limits = new Map<string, { count: number; reset: number }>();
let globalWindow = { count: 0, reset: 0 };
export function marketRateLimit(request: NextRequest): Response | null {
  const now = Date.now();
  if (globalWindow.reset <= now) globalWindow = { count: 0, reset: now + 60_000 };
  globalWindow.count++;
  const forwarded = process.env.ROSHAN_TRUST_PROXY === '1' ? request.headers.get('x-real-ip') || '' : '';
  const key = isIP(forwarded) ? forwarded : 'shared';
  for (const [id, entry] of limits) if (entry.reset <= now) limits.delete(id);
  if (limits.size >= 2000 && !limits.has(key)) return Response.json({ error: 'سرویس مشغول است؛ یک دقیقه بعد تلاش کنید.' }, { status: 429, headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' } });
  const entry = limits.get(key) || { count: 0, reset: now + 60_000 };
  entry.count++; limits.set(key, entry);
  if (globalWindow.count > 600 || entry.count > (key === 'shared' ? 120 : 60)) return Response.json({ error: 'درخواست‌ها بیش از حد است؛ یک دقیقه بعد تلاش کنید.' }, { status: 429, headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' } });
  return null;
}
export const privateResponseHeaders = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };

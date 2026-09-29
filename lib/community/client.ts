'use client';

export async function communityRequest<T>(path: string, body?: unknown): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`/api/community/${path}`, { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store', signal: controller.signal, ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) });
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.error || 'سرویس گفتگو در دسترس نیست.');
    return result as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new Error('پاسخ سرور طول کشید. اتصال اینترنت را بررسی و دوباره تلاش کنید.');
    throw error;
  } finally { window.clearTimeout(timeout); }
}

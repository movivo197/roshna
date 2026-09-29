import type { NextRequest } from 'next/server';
import { fetchTelegramChannel } from '@/lib/markets/telegram';
import { marketRateLimit, privateResponseHeaders } from '@/lib/markets/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const limited = marketRateLimit(request);
  if (limited) return limited;

  const channel = request.nextUrl.searchParams.get('channel') || 'tgju_org';

  try {
    const feed = await fetchTelegramChannel(channel);
    return Response.json(feed, {
      headers: {
        ...privateResponseHeaders,
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'دریافت پست‌های کانال تلگرام ممکن نشد.';
    return Response.json({ error: message }, { status: 400, headers: privateResponseHeaders });
  }
}

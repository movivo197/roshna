import type { NextRequest } from 'next/server';
import { getHistory } from '@/lib/markets/providers';
import { marketRateLimit, privateResponseHeaders } from '@/lib/markets/server';
import { quoteIds } from '@/lib/markets/types';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const limited = marketRateLimit(request); if (limited) return limited;
  const asset = request.nextUrl.searchParams.get('asset') || 'fx-usd';
  if (!quoteIds.includes(asset as typeof quoteIds[number])) return Response.json({ error: 'دارایی معتبر نیست.' }, { status: 400, headers: privateResponseHeaders });
  return Response.json(await getHistory(asset), { headers: privateResponseHeaders });
}

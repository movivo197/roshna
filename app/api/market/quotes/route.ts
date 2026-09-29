import type { NextRequest } from 'next/server';
import { getMarketSnapshot } from '@/lib/markets/providers';
import { marketRateLimit, privateResponseHeaders } from '@/lib/markets/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const limited = marketRateLimit(request); if (limited) return limited;
  return Response.json(await getMarketSnapshot(), { headers: privateResponseHeaders });
}

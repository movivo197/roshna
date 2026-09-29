import type { NextRequest } from 'next/server';
import { getNews } from '@/lib/markets/providers';
import { marketRateLimit, privateResponseHeaders } from '@/lib/markets/server';
import { marketCategorySchema } from '@/lib/markets/types';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const limited = marketRateLimit(request); if (limited) return limited;
  const category = marketCategorySchema.safeParse(request.nextUrl.searchParams.get('category') || 'general');
  const language = request.nextUrl.searchParams.get('language') || 'fa';
  if (!category.success || !['fa', 'all'].includes(language)) return Response.json({ error: 'فیلتر خبر معتبر نیست.' }, { status: 400, headers: privateResponseHeaders });
  return Response.json(await getNews(category.data, language as 'fa' | 'all'), { headers: privateResponseHeaders });
}

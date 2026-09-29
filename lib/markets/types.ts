import { z } from 'zod';

export const marketCategorySchema = z.enum(['general', 'technology', 'economy', 'crypto']);
export type NewsCategory = z.infer<typeof marketCategorySchema>;
const timestamp = z.string().datetime({ offset: true });
export const safeLink = z.string().url().max(2048).refine(value => {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
});
export const quoteSchema = z.object({
  id: z.string().max(50), symbol: z.string().max(20), name: z.string().max(100),
  category: z.enum(['crypto', 'fx', 'iran']), price: z.number().finite().positive().nullable(),
  currency: z.string().max(8), unit: z.string().max(80), changePercent: z.number().finite().nullable(),
  changeLabel: z.string().max(60), asOf: timestamp.nullable(), source: z.string().max(100),
  sourceUrl: safeLink, reason: z.string().max(300).optional(),
});
export type MarketQuote = z.infer<typeof quoteSchema>;
export const feedSchema = <T extends z.ZodTypeAny>(data: T) => z.object({
  status: z.enum(['fresh', 'stale', 'unavailable', 'unconfigured']),
  fetchedAt: timestamp.nullable(), checkedAt: timestamp, message: z.string().max(400).optional(), data,
});
export const quoteFeedSchema = feedSchema(z.array(quoteSchema).max(24));
export const marketSnapshotSchema = z.object({ crypto: quoteFeedSchema, fx: quoteFeedSchema, iran: quoteFeedSchema });
export type MarketSnapshot = z.infer<typeof marketSnapshotSchema>;
export const newsItemSchema = z.object({
  id: z.string().max(80), title: z.string().min(1).max(500), url: safeLink,
  publisher: z.string().max(120), seenAt: timestamp, language: z.string().max(40),
});
export const newsFeedSchema = feedSchema(z.array(newsItemSchema).max(40));
export type NewsFeed = z.infer<typeof newsFeedSchema>;
export const historyFeedSchema = feedSchema(z.object({
  asset: z.string().max(50), unit: z.string().max(80), source: z.string().max(100), sourceUrl: safeLink,
  points: z.array(z.object({ at: timestamp, value: z.number().finite().positive() })).max(400),
}));
export type HistoryFeed = z.infer<typeof historyFeedSchema>;
export type DataFeed<T> = { status: 'fresh' | 'stale' | 'unavailable' | 'unconfigured'; fetchedAt: string | null; checkedAt: string; message?: string; data: T };

export const cryptoAssets = [
  { id: 'bitcoin', symbol: 'BTC', name: 'بیت‌کوین' }, { id: 'ethereum', symbol: 'ETH', name: 'اتریوم' },
  { id: 'tether', symbol: 'USDT', name: 'تتر' }, { id: 'solana', symbol: 'SOL', name: 'سولانا' },
  { id: 'ripple', symbol: 'XRP', name: 'ریپل' }, { id: 'binancecoin', symbol: 'BNB', name: 'بی‌ان‌بی' },
] as const;
export const fxAssets = [
  { id: 'fx-usd', symbol: 'USD', name: 'دلار آمریکا' }, { id: 'fx-gbp', symbol: 'GBP', name: 'پوند بریتانیا' },
  { id: 'fx-chf', symbol: 'CHF', name: 'فرانک سوئیس' }, { id: 'fx-jpy', symbol: 'JPY', name: 'ین ژاپن' },
  { id: 'fx-try', symbol: 'TRY', name: 'لیر ترکیه' }, { id: 'fx-cny', symbol: 'CNY', name: 'یوان چین' },
] as const;
export const iranAssets = [
  { id: 'iran-usd', symbol: 'USD/IRT', name: 'دلار بازار ایران', unit: 'تومان برای یک دلار' },
  { id: 'iran-gold18', symbol: 'GOLD18', name: 'طلای ۱۸ عیار', unit: 'تومان برای یک گرم' },
] as const;
export const quoteIds = [...cryptoAssets, ...fxAssets, ...iranAssets].map(item => item.id);

'use client';

import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bookmark,
  Check,
  ChevronLeft,
  Clock3,
  ExternalLink,
  Globe2,
  HelpCircle,
  Info,
  LoaderCircle,
  Newspaper,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  TrendingUp,
  WifiOff,
  X
} from 'lucide-react';
import { z } from 'zod';
import {
  historyFeedSchema,
  marketSnapshotSchema,
  newsFeedSchema,
  quoteIds,
  type HistoryFeed,
  type MarketQuote,
  type MarketSnapshot,
  type NewsCategory,
  type NewsFeed
} from '@/lib/markets/types';
import type { TelegramChannelFeed, TelegramPost } from '@/lib/markets/telegram';
import styles from './market.module.css';

const CACHE_PREFIX = 'roshna-market-v1:';
const WATCH_KEY = 'roshna-market-watchlist-v1';
const CUSTOM_CHANNELS_KEY = 'roshna-custom-tg-channels-v1';

const categories: { id: NewsCategory; label: string }[] = [
  { id: 'general', label: 'روز و جهان' },
  { id: 'technology', label: 'تکنولوژی' },
  { id: 'economy', label: 'اقتصاد' },
  { id: 'crypto', label: 'کریپتو' },
];

const PRESET_CHANNELS: { id: string; name: string; category: string; badge: string }[] = [
  { id: 'tgju_org', name: 'شبکه طلا و ارز (TGJU)', category: 'بازار و طلا', badge: '🪙' },
  { id: 'arzdigital', name: 'ارزدیجیتال', category: 'کریپتو و بلاک‌چین', badge: '⚡' },
  { id: 'zoomit', name: 'زومیت (Zoomit)', category: 'فناوری و هوش مصنوعی', badge: '🚀' },
  { id: 'varzesh3', name: 'ورزش سه', category: 'ورزش و فوتبال', badge: '⚽' },
  { id: 'isna94', name: 'خبرگزاری دانشجویان (ایسنا)', category: 'اخبار رسمی', badge: '📰' },
];

const number = (value: number, digits = 2) =>
  new Intl.NumberFormat('fa-IR', { maximumFractionDigits: digits }).format(value);
const date = (value: string | null, time = true) =>
  value
    ? new Intl.DateTimeFormat('fa-IR', {
        dateStyle: 'medium',
        ...(time ? { timeStyle: 'short' as const } : {}),
      }).format(new Date(value))
    : 'هنوز دریافت نشده';

/** Only validated public data is cached; old data always carries an explicit cached label. */
function usePublicFeed<T>(url: string, schema: z.ZodType<T>) {
  const [state, setState] = useState<{ value: T | null; loading: boolean; cached: boolean; error: string | null }>({
    value: null,
    loading: true,
    cached: false,
    error: null,
  });
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let previous: T | null = null;
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + url);
      if (raw && raw.length < 300_000) {
        const saved = JSON.parse(raw);
        if (
          typeof saved.savedAt === 'number' &&
          saved.savedAt <= Date.now() &&
          Date.now() - saved.savedAt < 7 * 86_400_000
        ) {
          const result = schema.safeParse(saved.value);
          if (result.success) previous = result.data;
        }
      }
    } catch {
      /* Storage may be unavailable */
    }
    setState({ value: previous, loading: true, cached: !!previous, error: null });
    const timeout = window.setTimeout(() => controller.abort(), 18_000);
    void (async () => {
      try {
        const response = await fetch(url, { signal: controller.signal, cache: 'no-store', credentials: 'same-origin' });
        if (!response.ok)
          throw new Error(
            response.status === 429 ? 'درخواست‌ها زیاد است؛ یک دقیقه بعد دوباره تلاش کنید.' : 'ارتباط با سرویس برقرار نشد.'
          );
        const value = schema.parse(await response.json());
        if (!active) return;
        setState({ value, loading: false, cached: false, error: null });
        try {
          localStorage.setItem(CACHE_PREFIX + url, JSON.stringify({ savedAt: Date.now(), value }));
        } catch {
          /* Public cache is optional. */
        }
      } catch (error) {
        if (active)
          setState({
            value: previous,
            loading: false,
            cached: !!previous,
            error:
              error instanceof Error && error.message.startsWith('درخواست')
                ? error.message
                : 'دریافت تازه ممکن نشد. اتصال اینترنت را بررسی کنید.',
          });
      } finally {
        window.clearTimeout(timeout);
      }
    })();
    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [url, schema, revision]);
  return { ...state, refresh };
}

function Chart({ feed }: { feed: HistoryFeed }) {
  const gradient = useId().replace(/:/g, '');
  const points = feed.data.points;
  if (points.length < 2)
    return (
      <div className={styles.empty}>
        <TrendingUp size={30} />
        <strong>تاریخچه در دسترس نیست</strong>
        <p>{feed.message || 'منبع هنوز داده کافی برای رسم نمودار ارائه نکرده است.'}</p>
      </div>
    );
  const min = Math.min(...points.map((point) => point.value));
  const max = Math.max(...points.map((point) => point.value));
  const from = Date.parse(points[0].at);
  const to = Date.parse(points[points.length - 1].at);
  const coords = points.map(
    (point) =>
      `${12 + ((Date.parse(point.at) - from) / (to - from || 1)) * 576},${
        164 - ((point.value - min) / (max - min || 1)) * 140
      }`
  );
  const description = `نمودار ${number(points.length, 0)} مشاهده واقعی از ${date(points[0].at, false)} تا ${date(
    points[points.length - 1].at,
    false
  )}؛ کمینه ${number(min, 5)} و بیشینه ${number(max, 5)} ${feed.data.unit}`;
  return (
    <div className={styles.chart}>
      <div className={styles.chartScale}>
        <span>{number(max, 5)}</span>
        <span>{feed.data.unit}</span>
      </div>
      <svg viewBox="0 0 600 190" role="img" aria-label={description} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity=".24" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[30, 95, 160].map((y) => (
          <line key={y} x1="12" x2="588" y1={y} y2={y} className={styles.gridLine} />
        ))}
        <polygon points={`12,190 ${coords.join(' ')} 588,190`} fill={`url(#${gradient})`} />
        <polyline
          points={coords.join(' ')}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className={styles.chartScale}>
        <span>{date(points[0].at, false)}</span>
        <span>{date(points[points.length - 1].at, false)}</span>
      </div>
      <details className={styles.observations}>
        <summary>مشاهده داده‌های نمودار</summary>
        <div>
          <table>
            <thead>
              <tr>
                <th>زمان مشاهده</th>
                <th>{feed.data.unit}</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point, i) => (
                <tr key={`${point.at}-${i}`}>
                  <td>{date(point.at)}</td>
                  <td>{number(point.value, 6)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function Change({ quote }: { quote: MarketQuote }) {
  if (quote.changePercent === null) return <span className={styles.muted}>—</span>;
  const positive = quote.changePercent >= 0;
  return (
    <span
      className={positive ? styles.positive : styles.negative}
      aria-label={`${quote.changePercent > 0 ? 'افزایش' : quote.changePercent < 0 ? 'کاهش' : 'بدون تغییر'} ${number(
        Math.abs(quote.changePercent)
      )} درصد`}
    >
      {positive ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
      <bdi>{number(Math.abs(quote.changePercent))}٪</bdi>
    </span>
  );
}

export default function MarketHub() {
  const [category, setCategory] = useState<NewsCategory>('general');
  const [language, setLanguage] = useState<'fa' | 'all'>('fa');
  const [query, setQuery] = useState('');
  const [assetFilter, setAssetFilter] = useState<'all' | 'crypto' | 'fx' | 'iran' | 'watch'>('all');
  const [selected, setSelected] = useState('iran-usd');
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [storageError, setStorageError] = useState('');
  const [offline, setOffline] = useState(false);

  // Telegram Feed State
  const [activeTab, setActiveTab] = useState<'markets' | 'telegram' | 'news'>('markets');
  const [selectedChannel, setSelectedChannel] = useState<string>('tgju_org');
  const [customChannels, setCustomChannels] = useState<{ id: string; name: string }[]>([]);
  const [newChannelInput, setNewChannelInput] = useState('');
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [channelFeed, setChannelFeed] = useState<TelegramChannelFeed | null>(null);
  const [channelLoading, setChannelLoading] = useState(false);
  const [channelError, setChannelError] = useState('');

  const market = usePublicFeed<MarketSnapshot>('/api/market/quotes', marketSnapshotSchema);
  const news = usePublicFeed<NewsFeed>(`/api/market/news?category=${category}&language=${language}`, newsFeedSchema);
  const history = usePublicFeed<HistoryFeed>(`/api/market/history?asset=${selected}`, historyFeedSchema);

  useEffect(() => {
    const read = () => {
      try {
        const parsed = JSON.parse(localStorage.getItem(WATCH_KEY) || '[]');
        if (Array.isArray(parsed))
          setWatchlist(
            parsed.filter((item): item is string => typeof item === 'string' && (quoteIds as readonly string[]).includes(item)).slice(0, 24)
          );
      } catch {
        /* Defaults remain available */
      }
      try {
        const custom = JSON.parse(localStorage.getItem(CUSTOM_CHANNELS_KEY) || '[]');
        if (Array.isArray(custom)) setCustomChannels(custom);
      } catch {
        /* Default */
      }
    };
    const sync = (event: StorageEvent) => {
      if (event.key === WATCH_KEY || event.key === CUSTOM_CHANNELS_KEY) read();
    };
    const connection = () => setOffline(!navigator.onLine);
    read();
    connection();
    window.addEventListener('storage', sync);
    window.addEventListener('online', connection);
    window.addEventListener('offline', connection);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('online', connection);
      window.removeEventListener('offline', connection);
    };
  }, []);

  // Fetch Telegram channel posts
  const loadChannel = useCallback(async (channelId: string) => {
    setChannelLoading(true);
    setChannelError('');
    try {
      const res = await fetch(`/api/market/telegram?channel=${encodeURIComponent(channelId)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'دریافت مطالب کانال ممکن نشد.');
      }
      const data: TelegramChannelFeed = await res.json();
      setChannelFeed(data);
    } catch (err) {
      setChannelError(err instanceof Error ? err.message : 'خطا در بارگذاری کانال');
    } finally {
      setChannelLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'telegram') {
      void loadChannel(selectedChannel);
    }
  }, [activeTab, selectedChannel, loadChannel]);

  const toggleWatch = (id: string) => {
    const next = watchlist.includes(id) ? watchlist.filter((item) => item !== id) : [...watchlist, id];
    setWatchlist(next);
    try {
      localStorage.setItem(WATCH_KEY, JSON.stringify(next));
      setStorageError('');
    } catch {
      setStorageError('ذخیره فهرست روی این دستگاه ممکن نیست؛ انتخاب فعلی فقط تا بستن صفحه می‌ماند.');
    }
  };

  const addCustomChannel = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newChannelInput.trim().replace(/^@/, '').replace(/^https?:\/\/t\.me\//, '').replace(/\/$/, '');
    if (!clean) return;
    if (PRESET_CHANNELS.some((c) => c.id.toLowerCase() === clean.toLowerCase()) || customChannels.some((c) => c.id.toLowerCase() === clean.toLowerCase())) {
      setSelectedChannel(clean);
      setShowAddChannel(false);
      setNewChannelInput('');
      return;
    }
    const next = [...customChannels, { id: clean, name: `@${clean}` }];
    setCustomChannels(next);
    try {
      localStorage.setItem(CUSTOM_CHANNELS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setSelectedChannel(clean);
    setShowAddChannel(false);
    setNewChannelInput('');
  };

  const removeCustomChannel = (channelId: string) => {
    const next = customChannels.filter((c) => c.id !== channelId);
    setCustomChannels(next);
    try {
      localStorage.setItem(CUSTOM_CHANNELS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    if (selectedChannel === channelId) {
      setSelectedChannel('tgju_org');
    }
  };

  const allQuotes = useMemo(
    () => (market.value ? [...market.value.iran.data, ...market.value.crypto.data, ...market.value.fx.data] : []),
    [market.value]
  );
  const normalizedQuery = query.trim().toLocaleLowerCase('fa');
  const quotes = allQuotes.filter(
    (quote) =>
      (assetFilter === 'all' || (assetFilter === 'watch' && watchlist.includes(quote.id)) || assetFilter === quote.category) &&
      `${quote.name} ${quote.symbol}`.toLocaleLowerCase('fa').includes(normalizedQuery)
  );
  const articles = (news.value?.data || []).filter((article) =>
    `${article.title} ${article.publisher}`.toLocaleLowerCase('fa').includes(normalizedQuery)
  );
  const telegramFilteredPosts = (channelFeed?.posts || []).filter((post) =>
    `${post.text} ${post.channelTitle}`.toLocaleLowerCase('fa').includes(normalizedQuery)
  );

  const selectedQuote = allQuotes.find((quote) => quote.id === selected);
  const refreshAll = () => {
    market.refresh();
    news.refresh();
    history.refresh();
    if (activeTab === 'telegram') void loadChannel(selectedChannel);
  };
  const statusLabel = {
    fresh: 'داده زنده دریافت شد',
    stale: 'داده ذخیره‌شده',
    unavailable: 'منبع در دسترس نیست',
    unconfigured: 'نیاز به اتصال منبع',
  };
  const fetching = market.loading || news.loading || history.loading || channelLoading;

  return (
    <section className={styles.root} aria-label="اخبار و بازار">
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>
            <Globe2 size={16} /> پنجره شفاف اطلاعات و بازار
          </span>
          <h2>
            نبض زنده بازارها
            <br />
            <span>و اخبار بدون سانسور.</span>
          </h2>
          <p>قیمت لحظه‌ای دلار آزاد، طلا، سکه، رمزارزها و خبرهای موثق از کانال‌های تلگرامی محبوب شما بدون نیاز به فیلترشکن.</p>
          <div className={styles.heroMeta}>
            <ShieldCheck size={15} /> منبع مستقیم <span>·</span> پوشش لحظه‌ای <span>·</span> افزودن کانال‌های دلخواه
          </div>
        </div>
        <div className={styles.heroAside}>
          <div className={styles.orbit} aria-hidden="true">
            <Globe2 size={82} strokeWidth={0.9} />
            <span />
            <i />
          </div>
          <span>LIVE MARKETS</span>
          <button className={styles.refresh} onClick={refreshAll} disabled={fetching}>
            <RefreshCw size={16} className={fetching ? styles.spin : ''} />
            {fetching ? 'در حال دریافت' : 'بروزرسانی زنده'}
          </button>
        </div>
      </header>

      {/* Navigation Switcher Tabs */}
      <div className="market-main-tabs">
        <button
          type="button"
          className={`market-tab-btn ${activeTab === 'markets' ? 'active' : ''}`}
          onClick={() => setActiveTab('markets')}
        >
          <TrendingUp size={18} />
          <span>نرخ‌های زنده و تحلیل ارزها</span>
        </button>
        <button
          type="button"
          className={`market-tab-btn ${activeTab === 'telegram' ? 'active' : ''}`}
          onClick={() => setActiveTab('telegram')}
        >
          <Send size={18} />
          <span>کانال‌های تلگرام و اخبار زنده</span>
        </button>
        <button
          type="button"
          className={`market-tab-btn ${activeTab === 'news' ? 'active' : ''}`}
          onClick={() => setActiveTab('news')}
        >
          <Newspaper size={18} />
          <span>اخبار رسمی و جهانی (GDELT)</span>
        </button>
      </div>

      {(offline || market.cached || news.cached) && (
        <div className={styles.notice} role="status">
          <WifiOff size={17} />
          <p>
            {offline ? 'آفلاین هستید.' : 'داده‌های کش‌شده نمایش داده می‌شوند.'} قیمت‌ها بر اساس آخرین داده‌های موفق بروزرسانی شده‌اند.
          </p>
        </div>
      )}
      {storageError && (
        <p className={styles.notice} role="status">
          {storageError}
        </p>
      )}

      {/* Quick Overview Summary Cards */}
      <div className={styles.overview}>
        {['iran-usd', 'iran-gold18', 'bitcoin'].map((id) => {
          const quote = allQuotes.find((item) => item.id === id);
          return (
            <button
              key={id}
              className={`${styles.summaryCard} ${selected === id ? styles.summarySelected : ''}`}
              onClick={() => {
                setSelected(id);
                setActiveTab('markets');
              }}
              aria-pressed={selected === id}
            >
              <span>
                {quote?.name || (id === 'iran-usd' ? 'دلار بازار ایران' : id === 'iran-gold18' ? 'طلای ۱۸ عیار' : 'بیت‌کوین')}
                <ChevronLeft size={16} />
              </span>
              <strong>
                {quote?.price ? (
                  number(quote.price, quote.category === 'fx' ? 4 : 0)
                ) : market.loading ? (
                  <span className={styles.skeletonText} />
                ) : (
                  'در حال دریافت'
                )}
              </strong>
              <small>
                {quote?.unit || (id === 'iran-usd' ? 'تومان' : id === 'iran-gold18' ? 'تومان برای یک گرم' : 'دلار آمریکا')}
              </small>
              {quote && <Change quote={quote} />}
            </button>
          );
        })}
      </div>

      <div className={styles.toolbar}>
        <label className={styles.search}>
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            maxLength={100}
            placeholder="جست‌وجو در قیمت‌ها، کانال‌ها و خبرها..."
            aria-label="جست‌وجوی دارایی و خبر"
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="پاک‌کردن جست‌وجو">
              ×
            </button>
          )}
        </label>
        <span>
          <Bookmark size={15} /> {number(watchlist.length, 0)} دارایی در فهرست من
        </span>
      </div>

      {/* TAB 1: MARKETS & QUOTES */}
      {activeTab === 'markets' && (
        <div className={styles.workspace}>
          <section className={styles.panel}>
            <header className={styles.panelHeading}>
              <div>
                <span className={styles.kicker}>MARKET PULSE</span>
                <h3>قیمت لحظه‌ای بازارها</h3>
              </div>
              <TrendingUp size={21} />
            </header>
            <div className={styles.filters} aria-label="فیلتر دارایی‌ها">
              {(
                [
                  { id: 'all', label: 'همه بازارها' },
                  { id: 'iran', label: 'ایران، طلا و دلار' },
                  { id: 'crypto', label: 'ارز دیجیتال' },
                  { id: 'fx', label: 'ارزهای بین‌المللی' },
                  { id: 'watch', label: 'فهرست من' },
                ] as const
              ).map((item) => (
                <button key={item.id} aria-pressed={assetFilter === item.id} onClick={() => setAssetFilter(item.id)}>
                  {item.label}
                </button>
              ))}
            </div>

            {market.error && (
              <div className={styles.inlineError} role="status">
                {market.error}
                <button onClick={market.refresh}>تلاش دوباره</button>
              </div>
            )}

            {market.loading && !market.value ? (
              <div className={styles.skeletons} aria-label="در حال دریافت قیمت‌ها">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} />
                ))}
              </div>
            ) : quotes.length ? (
              <div className={styles.quoteList}>
                {quotes.map((quote) => (
                  <div className={`${styles.quoteRow} ${selected === quote.id ? styles.quoteSelected : ''}`} key={quote.id}>
                    <button
                      className={styles.watch}
                      onClick={() => toggleWatch(quote.id)}
                      aria-pressed={watchlist.includes(quote.id)}
                      aria-label={`${watchlist.includes(quote.id) ? 'حذف' : 'افزودن'} ${quote.name} ${
                        watchlist.includes(quote.id) ? 'از' : 'به'
                      } فهرست من`}
                    >
                      <Bookmark size={17} fill={watchlist.includes(quote.id) ? 'currentColor' : 'none'} />
                    </button>
                    <button className={styles.asset} onClick={() => setSelected(quote.id)} aria-pressed={selected === quote.id}>
                      <span className={styles.symbol} dir="ltr">
                        {quote.symbol.split('/')[0].slice(0, 5)}
                      </span>
                      <span>
                        <strong>{quote.name}</strong>
                        <small>{quote.unit}</small>
                      </span>
                    </button>
                    <div className={styles.price}>
                      <strong>
                        {quote.price === null ? '—' : number(quote.price, quote.category === 'fx' ? 4 : 0)} {quote.currency === 'IRT' ? 'تومان' : ''}
                      </strong>
                      {quote.price === null ? (
                        <small>داده در دسترس نیست</small>
                      ) : (
                        <>
                          <Change quote={quote} />
                          <small>{quote.changeLabel}</small>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.empty}>
                <Bookmark size={25} />
                <strong>{assetFilter === 'watch' ? 'فهرست شما هنوز خالی است' : 'نتیجه‌ای پیدا نشد'}</strong>
                <p>
                  {assetFilter === 'watch'
                    ? 'با نشان کنار هر دارایی، آن را به فهرست خود اضافه کنید.'
                    : 'عبارت جست‌وجو یا فیلتر را تغییر دهید.'}
                </p>
              </div>
            )}
            <p className={styles.footnote}>نرخ‌های طلا و دلار بازار آزاد از منابع تجمیعی و صرافی‌ها دریافت می‌شوند.</p>
          </section>

          <div className={styles.rightColumn}>
            <section className={styles.panel}>
              <header className={styles.panelHeading}>
                <div>
                  <span className={styles.kicker}>REAL OBSERVATIONS</span>
                  <h3>{selectedQuote?.name || 'نمودار روند قیمت'}</h3>
                  <p>
                    {selectedQuote?.asOf
                      ? `آخرین بروزرسانی: ${date(selectedQuote.asOf, selectedQuote.category !== 'fx')}`
                      : 'نمودار فقط با تاریخچه واقعی منبع رسم می‌شود.'}
                  </p>
                </div>
                <span className={styles.smallBadge}>{selected.startsWith('fx-') ? '۳۰ روز' : '۷ روز'}</span>
              </header>

              {history.cached && <p className={styles.footnote}>تاریخچه ذخیره‌شده روی دستگاه</p>}
              {history.error && (
                <div className={styles.inlineError} role="status">
                  {history.error}
                  <button onClick={history.refresh}>تلاش دوباره</button>
                </div>
              )}
              {history.loading && !history.value ? (
                <div className={styles.chartSkeleton} aria-label="در حال دریافت نمودار" />
              ) : history.value ? (
                <>
                  <Chart feed={history.value} />
                  {history.value.status === 'stale' && <p className={styles.footnote}>{history.value.message}</p>}
                  <p className={styles.chartAttribution}>
                    <a href={history.value.data.sourceUrl} target="_blank" rel="noopener noreferrer">
                      منبع: {history.value.data.source}
                    </a>
                    <span>دریافت: {date(history.value.fetchedAt)}</span>
                  </p>
                </>
              ) : (
                <div className={styles.empty}>
                  <TrendingUp size={28} />
                  <p>تاریخچه فعلاً در دسترس نیست.</p>
                </div>
              )}
            </section>

            <section className={`${styles.panel} ${styles.sourcePanel}`}>
              <h3>
                <ShieldCheck size={18} /> سلامت و اتصال منابع زنده
              </h3>
              {market.value &&
                (['iran', 'crypto', 'fx'] as const).map((id) => (
                  <div key={id} className={styles.sourceRow}>
                    <span>
                      <strong>{id === 'iran' ? 'نرخ‌های بازار آزاد و طلا (TGJU/صرافی)' : id === 'crypto' ? 'والکس و بازار جهانی کریپتو' : 'بانک مرکزی اروپا (ECB)'}</strong>
                      <small>{statusLabel[market.value![id].status]}</small>
                    </span>
                    <i className={market.value![id].status === 'fresh' ? styles.sourceReady : styles.sourceWaiting} />
                  </div>
                ))}
              <p>تمام اطلاعات به صورت خودکار و بدون نیاز به کلید تجاری با فرکانس بالا به‌روز می‌شوند.</p>
            </section>
          </div>
        </div>
      )}

      {/* TAB 2: TELEGRAM CHANNELS FEED */}
      {activeTab === 'telegram' && (
        <section className="telegram-news-section">
          <div className="tg-channels-bar">
            <div className="tg-channel-pills">
              {PRESET_CHANNELS.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  className={`tg-pill-btn ${selectedChannel === ch.id ? 'active' : ''}`}
                  onClick={() => setSelectedChannel(ch.id)}
                >
                  <span>{ch.badge}</span>
                  <strong>{ch.name}</strong>
                  <small>{ch.category}</small>
                </button>
              ))}

              {customChannels.map((ch) => (
                <div key={ch.id} className={`tg-pill-custom ${selectedChannel === ch.id ? 'active' : ''}`}>
                  <button type="button" onClick={() => setSelectedChannel(ch.id)} className="tg-custom-click">
                    <span>📡</span>
                    <strong>{ch.name}</strong>
                  </button>
                  <button
                    type="button"
                    className="tg-del-btn"
                    onClick={() => removeCustomChannel(ch.id)}
                    title="حذف این کانال"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}

              <button type="button" className="tg-add-btn" onClick={() => setShowAddChannel(!showAddChannel)}>
                <Plus size={16} />
                <span>افزودن کانال دلخواه</span>
              </button>
            </div>
          </div>

          {/* Add Channel Modal / Dropdown */}
          {showAddChannel && (
            <div className="tg-add-panel">
              <form onSubmit={addCustomChannel} className="tg-add-form">
                <div className="tg-add-header">
                  <h4>افزودن کانال تلگرام عمومی</h4>
                  <button type="button" onClick={() => setShowAddChannel(false)}>
                    <X size={16} />
                  </button>
                </div>
                <p>آیدی یا لینک عمومی هر کانال تلگرامی را وارد کنید تا آخرین پست‌های آن به صورت خودکار نمایش داده شوند.</p>
                <div className="tg-add-row">
                  <input
                    value={newChannelInput}
                    onChange={(e) => setNewChannelInput(e.target.value)}
                    placeholder="مثلاً zoomit یا @arzdigital یا https://t.me/isna94"
                    dir="ltr"
                    required
                  />
                  <button type="submit" className="g-btn primary">
                    افزودن و مشاهده
                  </button>
                </div>
              </form>

              <div className="tg-guide-box">
                <h5>
                  <HelpCircle size={15} /> راهنمای افزودن کانال تلگرام:
                </h5>
                <ol>
                  <li>کانال مورد نظر باید عمومی (Public) باشد.</li>
                  <li>کافیست نام کاربری کانال بدون علامت @ را تایپ کنید.</li>
                  <li>روشنا مستقیماً پست‌ها را از پیش‌نمایش وب تلگرام استخراج می‌کند و هیچ نیازی به فیلترشکن ندارد.</li>
                </ol>
              </div>
            </div>
          )}

          {/* Channel Header Banner */}
          {channelFeed && (
            <div className="tg-feed-banner">
              <div className="tg-banner-info">
                {channelFeed.channelAvatar ? (
                  <img src={channelFeed.channelAvatar} alt={channelFeed.channelTitle} className="tg-feed-avatar" />
                ) : (
                  <div className="tg-feed-avatar-placeholder">
                    <Send size={24} />
                  </div>
                )}
                <div>
                  <h3>{channelFeed.channelTitle}</h3>
                  <small dir="ltr">@{channelFeed.channel}</small>
                  {channelFeed.subscribers && <span className="tg-subs-count">👥 {channelFeed.subscribers}</span>}
                </div>
              </div>
              <div className="tg-banner-actions">
                <button
                  type="button"
                  className="g-btn"
                  onClick={() => void loadChannel(selectedChannel)}
                  disabled={channelLoading}
                >
                  <RefreshCw size={15} className={channelLoading ? styles.spin : ''} />
                  {channelLoading ? 'در حال دریافت...' : 'تازه‌سازی پست‌ها'}
                </button>
                <a
                  href={`https://t.me/${channelFeed.channel}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="g-btn"
                >
                  <ExternalLink size={15} /> باز کردن در تلگرام
                </a>
              </div>
            </div>
          )}

          {channelError && (
            <div className={styles.inlineError} role="status">
              {channelError}
              <button onClick={() => void loadChannel(selectedChannel)}>تلاش دوباره</button>
            </div>
          )}

          {/* Posts Grid */}
          {channelLoading && !channelFeed ? (
            <div className="tg-posts-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="tg-post-card skeleton-card" />
              ))}
            </div>
          ) : telegramFilteredPosts.length ? (
            <div className="tg-posts-grid">
              {telegramFilteredPosts.map((post) => (
                <article key={post.id} className="tg-post-card">
                  {post.photo && (
                    <div className="tg-post-media">
                      <img src={post.photo} alt="رسانه خبر" loading="lazy" />
                    </div>
                  )}
                  <div className="tg-post-body">
                    <p dir="auto">{post.text}</p>
                  </div>
                  <footer className="tg-post-footer">
                    <span>
                      <Clock3 size={13} /> {date(post.date)}
                    </span>
                    <a href={post.url} target="_blank" rel="noopener noreferrer">
                      مشاهده در تلگرام <ArrowUpRight size={14} />
                    </a>
                  </footer>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <Send size={36} />
              <strong>مطلبی در این کانال یافت نشد.</strong>
              <p>کانال دیگری را انتخاب کنید یا ارتباط اینترنت را بررسی فرمایید.</p>
            </div>
          )}
        </section>
      )}

      {/* TAB 3: OFFICIAL NEWS & GDELT */}
      {activeTab === 'news' && (
        <section className={`${styles.panel} ${styles.newsPanel}`}>
          <header className={styles.panelHeading}>
            <div>
              <span className={styles.kicker}>THE WORLD, IN CONTEXT</span>
              <h3>
                <Newspaper size={21} /> خبرهای رسمی با لینک منبع اصلی
              </h3>
            </div>
            <label className={styles.language}>
              <span>زبان خبر</span>
              <select value={language} onChange={(event) => setLanguage(event.target.value as 'fa' | 'all')}>
                <option value="fa">فارسی</option>
                <option value="all">همه زبان‌ها</option>
              </select>
            </label>
          </header>
          <div className={styles.newsControls}>
            <div className={styles.filters} aria-label="دسته خبر">
              {categories.map((item) => (
                <button key={item.id} onClick={() => setCategory(item.id)} aria-pressed={category === item.id}>
                  {item.label}
                </button>
              ))}
            </div>
            <span className={styles.fetched}>
              <Clock3 size={13} /> دریافت: {date(news.value?.fetchedAt || null)}
            </span>
          </div>
          {news.error && (
            <div className={styles.inlineError} role="status">
              {news.error}
              <button onClick={news.refresh}>تلاش دوباره</button>
            </div>
          )}
          {news.value && news.value.status !== 'fresh' && (
            <p className={styles.notice} role="status">
              {news.value.message}
            </p>
          )}
          {news.loading && !news.value ? (
            <div className={styles.newsSkeletons} aria-label="در حال دریافت خبرها">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} />
              ))}
            </div>
          ) : articles.length ? (
            <div className={styles.newsGrid}>
              {articles.map((article, i) => (
                <article key={article.id} className={styles.newsCard}>
                  <div className={styles.newsMeta}>
                    <span dir="ltr">{article.publisher}</span>
                    <span>{number(i + 1, 0).padStart(2, '۰')}</span>
                  </div>
                  <a href={article.url} target="_blank" rel="noopener noreferrer">
                    <h4 dir="auto">{article.title}</h4>
                    <ArrowUpRight size={18} />
                  </a>
                  <footer>
                    <span>
                      <Clock3 size={12} /> ثبت در نمایه: {date(article.seenAt)}
                    </span>
                    <small>{article.language}</small>
                  </footer>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <Newspaper size={30} />
              <strong>{query ? 'خبری با این عبارت پیدا نشد' : 'خبری برای این فیلتر دریافت نشده است'}</strong>
              <p>
                {query
                  ? 'جست‌وجو فقط روی عنوان‌ها و منابع دریافت‌شده انجام می‌شود.'
                  : 'زبان یا دسته را تغییر دهید؛ پوشش فارسی و دسترسی منبع ممکن است محدود باشد.'}
              </p>
            </div>
          )}
          <footer className={styles.newsFootnote}>
            <span>
              <Info size={14} /> عنوان‌ها به زبان اصلی‌اند و مستقیماً به سایت خبرگزاری لینک دارند.
            </span>
            <a href="https://www.gdeltproject.org/" target="_blank" rel="noopener noreferrer">
              منبع نمایه: GDELT Project <ArrowUpRight size={13} />
            </a>
          </footer>
        </section>
      )}

      <p className={styles.disclaimer}>
        <Check size={14} /> این بخش صرفاً جهت آگاهی و تحلیل شخصی شماست؛ توصیه مالی یا سیگنال معاملاتی نیست.
      </p>
    </section>
  );
}

'use client';

import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Bookmark, Check, ChevronLeft, Clock3, Globe2, Info, Newspaper, RefreshCw, Search, ShieldCheck, TrendingUp, WifiOff } from 'lucide-react';
import { z } from 'zod';
import { historyFeedSchema, marketSnapshotSchema, newsFeedSchema, quoteIds, type HistoryFeed, type MarketQuote, type MarketSnapshot, type NewsCategory, type NewsFeed } from '@/lib/markets/types';
import styles from './market.module.css';

const CACHE_PREFIX = 'roshna-market-v1:';
const WATCH_KEY = 'roshna-market-watchlist-v1';
const categories: { id: NewsCategory; label: string }[] = [{ id: 'general', label: 'روز و جهان' }, { id: 'technology', label: 'تکنولوژی' }, { id: 'economy', label: 'اقتصاد' }, { id: 'crypto', label: 'کریپتو' }];
const number = (value: number, digits = 2) => new Intl.NumberFormat('fa-IR', { maximumFractionDigits: digits }).format(value);
const date = (value: string | null, time = true) => value ? new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', ...(time ? { timeStyle: 'short' as const } : {}) }).format(new Date(value)) : 'هنوز دریافت نشده';

/** Only validated public data is cached; old data always carries an explicit cached label. */
function usePublicFeed<T>(url: string, schema: z.ZodType<T>) {
  const [state, setState] = useState<{ value: T | null; loading: boolean; cached: boolean; error: string | null }>({ value: null, loading: true, cached: false, error: null });
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let previous: T | null = null;
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + url);
      if (raw && raw.length < 300_000) {
        const saved = JSON.parse(raw);
        if (typeof saved.savedAt === 'number' && saved.savedAt <= Date.now() && Date.now() - saved.savedAt < 7 * 86_400_000) {
          const result = schema.safeParse(saved.value);
          if (result.success) previous = result.data;
        }
      }
    } catch { /* Storage may be unavailable; live content remains usable. */ }
    setState({ value: previous, loading: true, cached: !!previous, error: null });
    const timeout = window.setTimeout(() => controller.abort(), 18_000);
    void (async () => {
      try {
        const response = await fetch(url, { signal: controller.signal, cache: 'no-store', credentials: 'same-origin' });
        if (!response.ok) throw new Error(response.status === 429 ? 'درخواست‌ها زیاد است؛ یک دقیقه بعد دوباره تلاش کنید.' : 'ارتباط با سرویس برقرار نشد.');
        const value = schema.parse(await response.json());
        if (!active) return;
        setState({ value, loading: false, cached: false, error: null });
        try { localStorage.setItem(CACHE_PREFIX + url, JSON.stringify({ savedAt: Date.now(), value })); } catch { /* Public cache is optional. */ }
      } catch (error) {
        if (active) setState({ value: previous, loading: false, cached: !!previous, error: error instanceof Error && error.message.startsWith('درخواست') ? error.message : 'دریافت تازه ممکن نشد. اتصال اینترنت را بررسی کنید.' });
      } finally { window.clearTimeout(timeout); }
    })();
    return () => { active = false; controller.abort(); window.clearTimeout(timeout); };
  }, [url, schema, revision]);
  return { ...state, refresh };
}

function Chart({ feed }: { feed: HistoryFeed }) {
  const gradient = useId().replace(/:/g, '');
  const points = feed.data.points;
  if (points.length < 2) return <div className={styles.empty}><TrendingUp size={30} /><strong>تاریخچه در دسترس نیست</strong><p>{feed.message || 'منبع هنوز داده کافی برای رسم نمودار ارائه نکرده است.'}</p></div>;
  const min = Math.min(...points.map(point => point.value));
  const max = Math.max(...points.map(point => point.value));
  const from = Date.parse(points[0].at); const to = Date.parse(points[points.length - 1].at);
  const coords = points.map(point => `${12 + (Date.parse(point.at) - from) / (to - from || 1) * 576},${164 - (point.value - min) / (max - min || 1) * 140}`);
  const description = `نمودار ${number(points.length, 0)} مشاهده واقعی از ${date(points[0].at, false)} تا ${date(points[points.length - 1].at, false)}؛ کمینه ${number(min, 5)} و بیشینه ${number(max, 5)} ${feed.data.unit}`;
  return <div className={styles.chart}>
    <div className={styles.chartScale}><span>{number(max, 5)}</span><span>{feed.data.unit}</span></div>
    <svg viewBox="0 0 600 190" role="img" aria-label={description} preserveAspectRatio="none">
      <defs><linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity=".24" /><stop offset="100%" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs>
      {[30, 95, 160].map(y => <line key={y} x1="12" x2="588" y1={y} y2={y} className={styles.gridLine} />)}
      <polygon points={`12,190 ${coords.join(' ')} 588,190`} fill={`url(#${gradient})`} />
      <polyline points={coords.join(' ')} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
    <div className={styles.chartScale}><span>{date(points[0].at, false)}</span><span>{date(points[points.length - 1].at, false)}</span></div>
    <details className={styles.observations}><summary>مشاهده داده‌های نمودار</summary><div><table><thead><tr><th>زمان مشاهده</th><th>{feed.data.unit}</th></tr></thead><tbody>{points.map((point, i) => <tr key={`${point.at}-${i}`}><td>{date(point.at)}</td><td>{number(point.value, 6)}</td></tr>)}</tbody></table></div></details>
  </div>;
}

function Change({ quote }: { quote: MarketQuote }) {
  if (quote.changePercent === null) return <span className={styles.muted}>—</span>;
  const positive = quote.changePercent >= 0;
  return <span className={positive ? styles.positive : styles.negative} aria-label={`${quote.changePercent > 0 ? 'افزایش' : quote.changePercent < 0 ? 'کاهش' : 'بدون تغییر'} ${number(Math.abs(quote.changePercent))} درصد`}>
    {positive ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}<bdi>{number(Math.abs(quote.changePercent))}٪</bdi>
  </span>;
}

export default function MarketHub() {
  const [category, setCategory] = useState<NewsCategory>('general');
  const [language, setLanguage] = useState<'fa' | 'all'>('fa');
  const [query, setQuery] = useState('');
  const [assetFilter, setAssetFilter] = useState<'all' | 'crypto' | 'fx' | 'iran' | 'watch'>('all');
  const [selected, setSelected] = useState('fx-usd');
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [storageError, setStorageError] = useState('');
  const [offline, setOffline] = useState(false);
  const market = usePublicFeed<MarketSnapshot>('/api/market/quotes', marketSnapshotSchema);
  const news = usePublicFeed<NewsFeed>(`/api/market/news?category=${category}&language=${language}`, newsFeedSchema);
  const history = usePublicFeed<HistoryFeed>(`/api/market/history?asset=${selected}`, historyFeedSchema);
  useEffect(() => {
    const read = () => { try { const parsed = JSON.parse(localStorage.getItem(WATCH_KEY) || '[]'); if (Array.isArray(parsed)) setWatchlist(parsed.filter((item): item is string => typeof item === 'string' && (quoteIds as readonly string[]).includes(item)).slice(0, 24)); } catch { /* Defaults remain available. */ } };
    const sync = (event: StorageEvent) => { if (event.key === WATCH_KEY) read(); };
    const connection = () => setOffline(!navigator.onLine);
    read(); connection(); window.addEventListener('storage', sync); window.addEventListener('online', connection); window.addEventListener('offline', connection);
    return () => { window.removeEventListener('storage', sync); window.removeEventListener('online', connection); window.removeEventListener('offline', connection); };
  }, []);
  const toggleWatch = (id: string) => {
    const next = watchlist.includes(id) ? watchlist.filter(item => item !== id) : [...watchlist, id];
    setWatchlist(next);
    try { localStorage.setItem(WATCH_KEY, JSON.stringify(next)); setStorageError(''); } catch { setStorageError('ذخیره فهرست روی این دستگاه ممکن نیست؛ انتخاب فعلی فقط تا بستن صفحه می‌ماند.'); }
  };
  const allQuotes = useMemo(() => market.value ? [...market.value.fx.data, ...market.value.crypto.data, ...market.value.iran.data] : [], [market.value]);
  const normalizedQuery = query.trim().toLocaleLowerCase('fa');
  const quotes = allQuotes.filter(quote => (assetFilter === 'all' || assetFilter === 'watch' && watchlist.includes(quote.id) || assetFilter === quote.category) && `${quote.name} ${quote.symbol}`.toLocaleLowerCase('fa').includes(normalizedQuery));
  const articles = (news.value?.data || []).filter(article => `${article.title} ${article.publisher}`.toLocaleLowerCase('fa').includes(normalizedQuery));
  const selectedQuote = allQuotes.find(quote => quote.id === selected);
  const refreshAll = () => { market.refresh(); news.refresh(); history.refresh(); };
  const statusLabel = { fresh: 'داده دریافت شد', stale: 'داده قدیمی', unavailable: 'منبع در دسترس نیست', unconfigured: 'نیاز به اتصال منبع' };
  const fetching = market.loading || news.loading || history.loading;
  return <section className={styles.root} aria-label="اخبار و بازار">
    <header className={styles.hero}>
      <div className={styles.heroCopy}><span className={styles.eyebrow}><Globe2 size={16} /> پنجره‌ای به جهان</span><h2>دید بازتر.<br /><span>تصمیم آگاهانه‌تر.</span></h2><p>خبر را از منبع بخوان، بازار را با داده دنبال کن و چیزهای مهم را کنار هم نگه دار.</p><div className={styles.heroMeta}><ShieldCheck size={15} /> منبع مشخص <span>·</span> زمان شفاف <span>·</span> فهرست شخصی</div></div>
      <div className={styles.heroAside}><div className={styles.orbit} aria-hidden="true"><Globe2 size={82} strokeWidth={.9} /><span /><i /></div><span>NEWS & MARKETS</span><button className={styles.refresh} onClick={refreshAll} disabled={fetching}><RefreshCw size={16} className={fetching ? styles.spin : ''} />{fetching ? 'در حال دریافت' : 'بروزرسانی منابع'}</button></div>
    </header>
    {(offline || market.cached || news.cached) && <div className={styles.notice} role="status"><WifiOff size={17} /><p>{offline ? 'آفلاین هستید.' : 'نسخه ذخیره‌شده روی دستگاه نمایش داده می‌شود.'} قیمت‌ها و خبرهای ذخیره‌شده، اطلاعات لحظه‌ای نیستند؛ زمان هر منبع را بررسی کنید.</p></div>}
    {storageError && <p className={styles.notice} role="status">{storageError}</p>}
    <div className={styles.toolbar}><label className={styles.search}><Search size={18} /><input value={query} onChange={event => setQuery(event.target.value)} maxLength={100} placeholder="جست‌وجو در دارایی‌ها و خبرهای همین صفحه..." aria-label="جست‌وجوی دارایی و خبر" />{query && <button onClick={() => setQuery('')} aria-label="پاک‌کردن جست‌وجو">×</button>}</label><span><Bookmark size={15} /> {number(watchlist.length, 0)} دارایی در فهرست من</span></div>
    <div className={styles.overview}>
      {['fx-usd', 'bitcoin', 'iran-gold18'].map(id => {
        const quote = allQuotes.find(item => item.id === id);
        return <button key={id} className={`${styles.summaryCard} ${selected === id ? styles.summarySelected : ''}`} onClick={() => setSelected(id)} aria-pressed={selected === id}><span>{quote?.name || (id === 'fx-usd' ? 'دلار آمریکا' : id === 'bitcoin' ? 'بیت‌کوین' : 'طلای ۱۸ عیار')}<ChevronLeft size={16} /></span><strong>{quote?.price ? number(quote.price, quote.category === 'fx' ? 4 : 2) : market.loading ? <span className={styles.skeletonText} /> : 'متصل نشده'}</strong><small>{quote?.unit || (id === 'fx-usd' ? 'دلار برای یک یورو' : id === 'bitcoin' ? 'دلار آمریکا' : 'تومان برای یک گرم')}</small>{quote && <Change quote={quote} />}</button>;
      })}
    </div>
    <div className={styles.workspace}>
      <section className={styles.panel}><header className={styles.panelHeading}><div><span className={styles.kicker}>MARKET PULSE</span><h3>دارایی‌های زیر نظر</h3></div><TrendingUp size={21} /></header>
        <div className={styles.filters} aria-label="فیلتر دارایی‌ها">{([{ id: 'all', label: 'همه' }, { id: 'watch', label: 'فهرست من' }, { id: 'fx', label: 'ارز جهانی' }, { id: 'crypto', label: 'کریپتو' }, { id: 'iran', label: 'ایران و طلا' }] as const).map(item => <button key={item.id} aria-pressed={assetFilter === item.id} onClick={() => setAssetFilter(item.id)}>{item.label}</button>)}</div>
        {market.error && <div className={styles.inlineError} role="status">{market.error}<button onClick={market.refresh}>تلاش دوباره</button></div>}
        {market.loading && !market.value ? <div className={styles.skeletons} aria-label="در حال دریافت قیمت‌ها">{[1, 2, 3, 4].map(i => <div key={i} />)}</div> : quotes.length ? <div className={styles.quoteList}>{quotes.map(quote => <div className={`${styles.quoteRow} ${selected === quote.id ? styles.quoteSelected : ''}`} key={quote.id}>
          <button className={styles.watch} onClick={() => toggleWatch(quote.id)} aria-pressed={watchlist.includes(quote.id)} aria-label={`${watchlist.includes(quote.id) ? 'حذف' : 'افزودن'} ${quote.name} ${watchlist.includes(quote.id) ? 'از' : 'به'} فهرست من`}><Bookmark size={17} fill={watchlist.includes(quote.id) ? 'currentColor' : 'none'} /></button>
          <button className={styles.asset} onClick={() => setSelected(quote.id)} aria-pressed={selected === quote.id}><span className={styles.symbol} dir="ltr">{quote.symbol.split('/')[0].slice(0, 4)}</span><span><strong>{quote.name}</strong><small>{quote.unit}</small></span></button>
          <div className={styles.price}><strong>{quote.price === null ? '—' : number(quote.price, quote.category === 'fx' ? 4 : 2)}</strong>{quote.price === null ? <small>داده در دسترس نیست</small> : <><Change quote={quote} /><small>{quote.changeLabel}</small></>}</div>
        </div>)}</div> : <div className={styles.empty}><Bookmark size={25} /><strong>{assetFilter === 'watch' ? 'فهرست شما هنوز خالی است' : 'نتیجه‌ای پیدا نشد'}</strong><p>{assetFilter === 'watch' ? 'با نشان کنار هر دارایی، آن را به فهرست خود اضافه کنید.' : 'عبارت جست‌وجو یا فیلتر را تغییر دهید.'}</p></div>}
        <p className={styles.footnote}>نرخ‌های ارز جهانی، نرخ مرجع روزانه بانک مرکزی اروپا و به ازای یک یورو هستند؛ قیمت دلار بازار ایران نیستند.</p>
      </section>
      <div className={styles.rightColumn}><section className={styles.panel}><header className={styles.panelHeading}><div><span className={styles.kicker}>REAL OBSERVATIONS</span><h3>{selectedQuote?.name || 'نمودار دارایی'}</h3><p>{selectedQuote?.asOf ? `تاریخ منبع: ${date(selectedQuote.asOf, selectedQuote.category !== 'fx')}` : 'نمودار فقط با تاریخچه واقعی منبع رسم می‌شود.'}</p></div><span className={styles.smallBadge}>{selected.startsWith('fx-') ? '۳۰ روز' : '۷ روز'}</span></header>
        {history.cached && <p className={styles.footnote}>تاریخچه ذخیره‌شده روی دستگاه</p>}{history.error && <div className={styles.inlineError} role="status">{history.error}<button onClick={history.refresh}>تلاش دوباره</button></div>}
        {history.loading && !history.value ? <div className={styles.chartSkeleton} aria-label="در حال دریافت نمودار" /> : history.value ? <><Chart feed={history.value} />{history.value.status === 'stale' && <p className={styles.footnote}>{history.value.message}</p>}<p className={styles.chartAttribution}><a href={history.value.data.sourceUrl} target="_blank" rel="noopener noreferrer">{history.value.data.source}</a><span>دریافت: {date(history.value.fetchedAt)}</span></p></> : <div className={styles.empty}><TrendingUp size={28} /><p>تاریخچه فعلاً در دسترس نیست.</p></div>}
      </section><section className={`${styles.panel} ${styles.sourcePanel}`}><h3><ShieldCheck size={18} /> شفافیت داده‌ها</h3>{market.value && (['fx', 'crypto', 'iran'] as const).map(id => <div key={id} className={styles.sourceRow}><span><strong>{id === 'fx' ? 'ECB / Frankfurter' : id === 'crypto' ? 'CoinGecko' : 'بازار ایران'}</strong><small>{statusLabel[market.value![id].status]}</small></span><i className={market.value![id].status === 'fresh' ? styles.sourceReady : styles.sourceWaiting} /></div>)}<p>قیمت‌های رمزارز و ایران تا زمان اتصال منبع دارای مجوز، خالی می‌مانند. قدیمی‌بودن داده یا قطع ارتباط پنهان نمی‌شود.</p><a href="https://www.coingecko.com/en/api" target="_blank" rel="noopener noreferrer">Powered by CoinGecko</a></section></div>
    </div>
    <section className={`${styles.panel} ${styles.newsPanel}`}><header className={styles.panelHeading}><div><span className={styles.kicker}>THE WORLD, IN CONTEXT</span><h3><Newspaper size={21} />خبرها، با لینک منبع</h3></div><label className={styles.language}><span>زبان خبر</span><select value={language} onChange={event => setLanguage(event.target.value as 'fa' | 'all')}><option value="fa">فارسی</option><option value="all">همه زبان‌ها</option></select></label></header>
      <div className={styles.newsControls}><div className={styles.filters} aria-label="دسته خبر">{categories.map(item => <button key={item.id} onClick={() => setCategory(item.id)} aria-pressed={category === item.id}>{item.label}</button>)}</div><span className={styles.fetched}><Clock3 size={13} />دریافت: {date(news.value?.fetchedAt || null)}</span></div>
      {news.error && <div className={styles.inlineError} role="status">{news.error}<button onClick={news.refresh}>تلاش دوباره</button></div>}{news.value && news.value.status !== 'fresh' && <p className={styles.notice} role="status">{news.value.message}</p>}
      {news.loading && !news.value ? <div className={styles.newsSkeletons} aria-label="در حال دریافت خبرها">{[1, 2, 3, 4].map(i => <div key={i} />)}</div> : articles.length ? <div className={styles.newsGrid}>{articles.map((article, i) => <article key={article.id} className={styles.newsCard}><div className={styles.newsMeta}><span dir="ltr">{article.publisher}</span><span>{number(i + 1, 0).padStart(2, '۰')}</span></div><a href={article.url} target="_blank" rel="noopener noreferrer"><h4 dir="auto">{article.title}</h4><ArrowUpRight size={18} /></a><footer><span><Clock3 size={12} /> ثبت در نمایه: {date(article.seenAt)}</span><small>{article.language}</small></footer></article>)}</div> : <div className={styles.empty}><Newspaper size={30} /><strong>{query ? 'خبری با این عبارت پیدا نشد' : 'خبری برای این فیلتر دریافت نشده است'}</strong><p>{query ? 'جست‌وجو فقط روی عنوان‌ها و منابع دریافت‌شده انجام می‌شود.' : 'زبان یا دسته را تغییر دهید؛ پوشش فارسی و دسترسی منبع ممکن است محدود باشد.'}</p></div>}
      <footer className={styles.newsFootnote}><span><Info size={14} />عنوان‌ها به زبان اصلی‌اند. زمان ثبت در نمایه لزوماً زمان انتشار خبر نیست.</span><a href="https://www.gdeltproject.org/" target="_blank" rel="noopener noreferrer">منبع نمایه: GDELT Project <ArrowUpRight size={13} /></a></footer>
    </section>
    <p className={styles.disclaimer}><Check size={14} /> این بخش برای اطلاع‌رسانی است؛ توصیه خرید و فروش یا تضمین صحت داده ارائه نمی‌کند. فهرست شخصی فقط روی همین دستگاه ذخیره می‌شود.</p>
  </section>;
}

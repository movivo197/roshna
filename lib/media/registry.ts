export interface TvSource {
  id: string;
  manifestUrl: string;
  allowedHosts: string[];
  priority: number;
}

export interface TvChannel {
  id: string;
  name: string;
  category: 'satellite' | 'sports' | 'movies' | 'music' | 'docs' | 'news' | 'kids' | 'general';
  logo: string;
  badge: string;
  description: string;
  epgCurrent: string;
  epgNext: string;
  sources: TvSource[];
}

export interface RadioSource {
  id: string;
  streamUrl: string;
  allowedHosts: string[];
  priority: number;
}

export interface RadioStation {
  id: string;
  name: string;
  tag: string;
  logo: string;
  desc: string;
  tone: string;
  sources: RadioSource[];
}

export const TV_CHANNELS: Record<string, TvChannel> = {
  _canary: {
    id: '_canary',
    name: 'تست سیگنال کَناری (Canary Self-Test)',
    category: 'general',
    logo: '🛡️',
    badge: 'CANARY',
    description: 'استریم زنده آزمایشی داخلی روشنا جهت بررسی سلامت پلیر HLS بدون وابستگی به سرورهای خارجی',
    epgCurrent: 'تست مداوم خط لوله HLS.js و صوتی تصویری',
    epgNext: 'سنجش سلامت کلاینت',
    sources: [
      {
        id: 'canary_internal',
        manifestUrl: 'internal://canary',
        allowedHosts: ['localhost'],
        priority: 1,
      },
    ],
  },
  persiana_cinema: {
    id: 'persiana_cinema',
    name: 'پرشیانا سینما (Persiana Cinema)',
    category: 'satellite',
    logo: '🎬',
    badge: 'FHD',
    description: 'برترین فیلم‌های سینمایی روز جهان و هالیوود با دوبله و زیرنویس اختصاصی',
    epgCurrent: 'فیلم سینمایی برتر جهان',
    epgNext: 'شاهکارهای سینمای اکشن و درام',
    sources: [
      {
        id: 'primary',
        manifestUrl: 'https://cinehls.persiana.live/hls/stream.m3u8',
        allowedHosts: ['cinehls.persiana.live', 'persiana.live', 'wns.live'],
        priority: 1,
      },
      {
        id: 'backup',
        manifestUrl: 'https://gcinemahls.wns.live/hls/stream.m3u8',
        allowedHosts: ['gcinemahls.wns.live', 'wns.live', 'persiana.live'],
        priority: 2,
      },
    ],
  },
  rjtv: {
    id: 'rjtv',
    name: 'رادیو جوان (Radio Javan TV)',
    category: 'music',
    logo: '🎧',
    badge: '1080p',
    description: 'پخش ۲۴ ساعته برترین موزیک‌ویدیوها، مصاحبه‌ها، کنسرت‌ها و برنامه‌های اختصاصی',
    epgCurrent: 'موزیک‌ویدیوهای روز و برترین ریمیکس‌ها',
    epgNext: 'برنامه اختصاصی گرند استودیو RJ',
    sources: [
      {
        id: 'primary',
        manifestUrl: 'https://rjtvhls.wns.live/hls/stream.m3u8',
        allowedHosts: ['rjtvhls.wns.live', 'wns.live', 'radiojavan.com'],
        priority: 1,
      },
      {
        id: 'backup_1',
        manifestUrl: 'https://musichls.persiana.live/hls/stream.m3u8',
        allowedHosts: ['musichls.persiana.live', 'persiana.live'],
        priority: 2,
      },
      {
        id: 'backup_2',
        manifestUrl: 'https://hls.avang.live/hls/stream.m3u8',
        allowedHosts: ['hls.avang.live', 'avang.live'],
        priority: 3,
      },
    ],
  },
  avaseries: {
    id: 'avaseries',
    name: 'آوا سریال (AVA Series HD)',
    category: 'movies',
    logo: '📺',
    badge: 'HD',
    description: 'پخش محبوب‌ترین سریال‌های داستانی، خانوادگی، درام و ترکی با دوبله پارسی',
    epgCurrent: 'سریال درام و پرمخاطب',
    epgNext: 'قسمت جدید سریال محبوب خانوادگی',
    sources: [
      {
        id: 'primary',
        manifestUrl: 'https://avaserieshls.wns.live/hls/stream.m3u8',
        allowedHosts: ['avaserieshls.wns.live', 'wns.live'],
        priority: 1,
      },
      {
        id: 'backup',
        manifestUrl: 'https://onehls.persiana.live/hls/stream.m3u8',
        allowedHosts: ['onehls.persiana.live', 'persiana.live'],
        priority: 2,
      },
    ],
  },
  avafamily: {
    id: 'avafamily',
    name: 'آوا فمیلی (AVA Family)',
    category: 'satellite',
    logo: '🍿',
    badge: 'HD',
    description: 'سرگرمی‌های شاد خانوادگی، فیلم، انیمیشن و شوهای تلویزیونی',
    epgCurrent: 'برنامه شاد و سرگرمی خانوادگی',
    epgNext: 'فیلم سینمایی عصرگاهی',
    sources: [
      {
        id: 'primary',
        manifestUrl: 'https://familyhls.avatv.live/hls/stream.m3u8',
        allowedHosts: ['familyhls.avatv.live', 'avatv.live'],
        priority: 1,
      },
      {
        id: 'backup',
        manifestUrl: 'https://familyhls.persiana.live/hls/stream.m3u8',
        allowedHosts: ['familyhls.persiana.live', 'persiana.live'],
        priority: 2,
      },
    ],
  },
  fx1: {
    id: 'fx1',
    name: 'اف‌ایکس ۱ (FX 1 HD)',
    category: 'movies',
    logo: '⚡',
    badge: 'HD',
    description: 'سینمای هیجان‌انگیز، فیلم‌های علمی‌تخیلی، اکشن و ماجراجویی بدون سانسور',
    epgCurrent: 'فیلم هیجان‌انگیز و اکشن هالیوودی',
    epgNext: 'سینمایی معمایی و تخیلی',
    sources: [
      {
        id: 'primary',
        manifestUrl: 'https://fxtvhls.wns.live/hls/stream.m3u8',
        allowedHosts: ['fxtvhls.wns.live', 'wns.live'],
        priority: 1,
      },
      {
        id: 'backup',
        manifestUrl: 'https://slonehls.wns.live/hls/stream.m3u8',
        allowedHosts: ['slonehls.wns.live', 'wns.live'],
        priority: 2,
      },
    ],
  },
  persiana_iranian: {
    id: 'persiana_iranian',
    name: 'پرشیانا ایرانی (Persiana Iranian)',
    category: 'movies',
    logo: '🇮🇷',
    badge: 'HD',
    description: 'پخش برترین فیلم‌های سینمای ایران، آثار ماندگار و سریال‌های محبوب ایرانی',
    epgCurrent: 'فیلم سینمایی برگزیده ایرانی',
    epgNext: 'نوستالژی‌های سینمای ایران',
    sources: [
      {
        id: 'primary',
        manifestUrl: 'https://irhls.persiana.live/hls/stream.m3u8',
        allowedHosts: ['irhls.persiana.live', 'persiana.live'],
        priority: 1,
      },
      {
        id: 'backup',
        manifestUrl: 'https://metafilmhls.wns.live/hls/stream.m3u8',
        allowedHosts: ['metafilmhls.wns.live', 'wns.live'],
        priority: 2,
      },
    ],
  },
  persiana_comedy: {
    id: 'persiana_comedy',
    name: 'پرشیانا کمدی (Persiana Comedy)',
    category: 'satellite',
    logo: '😂',
    badge: 'HD',
    description: 'خنده‌دارترین فیلم‌های کمدی جهان، شوها و برنامه‌های طنز ۲۴ ساعته',
    epgCurrent: 'فیلم کمدی و طنز خانوادگی',
    epgNext: 'استندآپ کمدی و شوهای خنده',
    sources: [
      {
        id: 'primary',
        manifestUrl: 'https://comedyhls.persiana.live/hls/stream.m3u8',
        allowedHosts: ['comedyhls.persiana.live', 'persiana.live'],
        priority: 1,
      },
      {
        id: 'backup',
        manifestUrl: 'https://cafefhls.wns.live/hls/stream.m3u8',
        allowedHosts: ['cafefhls.wns.live', 'wns.live'],
        priority: 2,
      },
    ],
  },
  persiana_series: {
    id: 'persiana_series',
    name: 'پرشیانا سریز (Persiana Series)',
    category: 'movies',
    logo: '🎞️',
    badge: 'HD',
    description: 'پخش مداوم بهترین سریال‌های هالیوود و جهان با زیرنویس و دوبله',
    epgCurrent: 'پخش سریال پرمخاطب جهانی',
    epgNext: 'پشت صحنه و نقد سریال',
    sources: [
      {
        id: 'primary',
        manifestUrl: 'https://onehls.persiana.live/hls/stream.m3u8',
        allowedHosts: ['onehls.persiana.live', 'persiana.live'],
        priority: 1,
      },
      {
        id: 'backup',
        manifestUrl: 'https://sltwohls.wns.live/hls/stream.m3u8',
        allowedHosts: ['sltwohls.wns.live', 'wns.live'],
        priority: 2,
      },
    ],
  },
  persiana_music: {
    id: 'persiana_music',
    name: 'پرشیانا موزیک (4Music / Persiana Music)',
    category: 'music',
    logo: '🎵',
    badge: 'HD',
    description: 'برترین موسیقی‌های پاپ، هیپ‌هاپ، راک، نوستالژی و ریمیکس‌های شاد',
    epgCurrent: 'تاپ موزیک و تازه‌های ترانه',
    epgNext: 'پلی‌لیست پرانرژی روزانه',
    sources: [
      {
        id: 'primary',
        manifestUrl: 'https://musichls.persiana.live/hls/stream.m3u8',
        allowedHosts: ['musichls.persiana.live', 'persiana.live'],
        priority: 1,
      },
      {
        id: 'backup',
        manifestUrl: 'https://raphls.persiana.live/hls/stream.m3u8',
        allowedHosts: ['raphls.persiana.live', 'persiana.live'],
        priority: 2,
      },
    ],
  },
  avang: {
    id: 'avang',
    name: 'آوانگ تی‌وی (Avang TV HD)',
    category: 'music',
    logo: '🎸',
    badge: '1080p',
    description: 'موزیک ویدیوهای کمپانی آوانگ و هنرمندان نام‌آشنای موسیقی پاپ',
    epgCurrent: 'موزیک ویدیوهای اختصاصی آوانگ',
    epgNext: 'کنسرت‌های خاطره‌انگیز',
    sources: [
      {
        id: 'primary',
        manifestUrl: 'https://hls.avang.live/hls/stream.m3u8',
        allowedHosts: ['hls.avang.live', 'avang.live'],
        priority: 1,
      },
      {
        id: 'backup',
        manifestUrl: 'https://rjtvhls.wns.live/hls/stream.m3u8',
        allowedHosts: ['rjtvhls.wns.live', 'wns.live'],
        priority: 2,
      },
    ],
  },
  persiana_docs: {
    id: 'persiana_docs',
    name: 'پرشیانا مستند و علم (Persiana Science & Docs)',
    category: 'docs',
    logo: '🌌',
    badge: 'HD',
    description: 'مستندهای شگفت‌انگیز کهکشان، اقیانوس‌ها، فناوری و حیات وحش با دوبله فارسی',
    epgCurrent: 'مستند شگفتی‌های کیهان و علم',
    epgNext: 'کاوش در اعماق طبیعت و حیات وحش',
    sources: [
      {
        id: 'primary',
        manifestUrl: 'https://scihls.persiana.live/hls/stream.m3u8',
        allowedHosts: ['scihls.persiana.live', 'persiana.live'],
        priority: 1,
      },
      {
        id: 'backup',
        manifestUrl: 'https://ptravelhls.persiana.live/hls/stream.m3u8',
        allowedHosts: ['ptravelhls.persiana.live', 'persiana.live'],
        priority: 2,
      },
    ],
  },
  persiana_travel: {
    id: 'persiana_travel',
    name: 'پرشیانا گردشگری و سفر (Persiana Travel)',
    category: 'docs',
    logo: '✈️',
    badge: 'HD',
    description: 'زیباترین مقاصد گردشگری جهان، فرهنگ‌ها، جاذبه‌ها و ماجراجویی‌های دیدنی',
    epgCurrent: 'سفر به زیباترین شهرهای دنیا',
    epgNext: 'مستند جاذبه‌های توریستی و فرهنگ ملل',
    sources: [
      {
        id: 'primary',
        manifestUrl: 'https://ptravelhls.persiana.live/hls/stream.m3u8',
        allowedHosts: ['ptravelhls.persiana.live', 'persiana.live'],
        priority: 1,
      },
      {
        id: 'backup',
        manifestUrl: 'https://scihls.persiana.live/hls/stream.m3u8',
        allowedHosts: ['scihls.persiana.live', 'persiana.live'],
        priority: 2,
      },
    ],
  },
  persiana_fight: {
    id: 'persiana_fight',
    name: 'پرشیانا مبارزه و ورزش (Persiana Fight)',
    category: 'sports',
    logo: '🥊',
    badge: 'HD',
    description: 'پوشش مسابقات UFC، بوکس، کشتی‌کج، موی‌تای و مبارزات رزمی معتبر دنیا',
    epgCurrent: 'مسابقات قهرمانی UFC و بوکس حرفه‌ای',
    epgNext: 'بهترین ناک‌اوت‌های تاریخ ورزش رزمی',
    sources: [
      {
        id: 'primary',
        manifestUrl: 'https://fighthls.persiana.live/hls/stream.m3u8',
        allowedHosts: ['fighthls.persiana.live', 'persiana.live'],
        priority: 1,
      },
      {
        id: 'backup',
        manifestUrl: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
        allowedHosts: ['rbmn-live.akamaized.net', 'akamaized.net'],
        priority: 2,
      },
    ],
  },
  persiana_nostalgia: {
    id: 'persiana_nostalgia',
    name: 'پرشیانا خاطره‌ها (Persiana Nostalgia)',
    category: 'satellite',
    logo: '📻',
    badge: 'HD',
    description: 'ترانه‌ها، شوها، فیلم‌ها و سریال‌های خاطره‌انگیز دهه‌های گذشته',
    epgCurrent: 'ترانه‌ها و برنامه‌های قدیمی و خاطره‌انگیز',
    epgNext: 'سینمای کلاسیک طلایی',
    sources: [
      {
        id: 'primary',
        manifestUrl: 'https://noshls.persiana.live/hls/stream.m3u8',
        allowedHosts: ['noshls.persiana.live', 'persiana.live'],
        priority: 1,
      },
      {
        id: 'backup',
        manifestUrl: 'https://clshls.wns.live/hls/stream.m3u8',
        allowedHosts: ['clshls.wns.live', 'wns.live'],
        priority: 2,
      },
    ],
  },
  grand_cinema: {
    id: 'grand_cinema',
    name: 'گرند سینما (Grand Cinema HD)',
    category: 'movies',
    logo: '🎥',
    badge: 'HD',
    description: 'پخش فیلم‌های تحسین‌شده جشنواره‌ها، آثار بلاک‌باستر و سینمای جهان',
    epgCurrent: 'فیلم سینمایی برتر هالیوود',
    epgNext: 'آثار برگزیده اسکار و کن',
    sources: [
      {
        id: 'primary',
        manifestUrl: 'https://gcinemahls.wns.live/hls/stream.m3u8',
        allowedHosts: ['gcinemahls.wns.live', 'wns.live'],
        priority: 1,
      },
      {
        id: 'backup',
        manifestUrl: 'https://cinehls.persiana.live/hls/stream.m3u8',
        allowedHosts: ['cinehls.persiana.live', 'persiana.live'],
        priority: 2,
      },
    ],
  },
  redbull_tv: {
    id: 'redbull_tv',
    name: 'ردبول تی‌وی ورزش (Red Bull TV)',
    category: 'sports',
    logo: '🏎️',
    badge: 'FHD',
    description: 'مسابقات آدرنالین، فرمول یک، رالی، پارکور، دوچرخه‌سواری کوهستان و اسکیت برد',
    epgCurrent: 'مسابقات قهرمانی جهانی ردبول',
    epgNext: 'ماجراجویی در طبیعت بکر و ورزش‌های پرهیجان',
    sources: [
      {
        id: 'primary',
        manifestUrl: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
        allowedHosts: ['rbmn-live.akamaized.net', 'akamaized.net'],
        priority: 1,
      },
    ],
  },
  euronews_persian: {
    id: 'euronews_persian',
    name: 'یورونیوز فارسی (Euronews Farsi)',
    category: 'news',
    logo: '🌍',
    badge: 'HD',
    description: 'پوشش بی‌طرفانه اخبار اروپا، خاورمیانه، اقتصاد، فناوری و رویدادهای بین‌المللی',
    epgCurrent: 'اخبار زنده جهان و گزارش‌های بین‌المللی',
    epgNext: 'مجله هفتگی علم، فناوری و اقتصاد',
    sources: [
      {
        id: 'primary',
        manifestUrl: 'https://euronews-persian-video.akamaized.net/hls/live/2042171/euronewsfarsi/master.m3u8',
        allowedHosts: ['euronews-persian-video.akamaized.net', 'akamaized.net'],
        priority: 1,
      },
    ],
  },
};

export const RADIO_STATIONS: Record<string, RadioStation> = {
  lofi: {
    id: 'lofi',
    name: 'لوفای چیل و مطالعه (Lofi Study Beats)',
    tag: 'تمرکز و کار',
    logo: '☕',
    desc: 'ریتم‌های آرامش‌بخش لوفای هیپ‌هاپ برای باز کردن ذهن، مطالعه عمیق و برنامه‌نویسی',
    tone: 'blue',
    sources: [
      {
        id: 'zeno_lofi',
        streamUrl: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
        allowedHosts: ['stream.zeno.fm', 'zeno.fm'],
        priority: 1,
      },
    ],
  },
  meditation: {
    id: 'meditation',
    name: 'مدیتیشن ۴۳۲Hz و نوای طبیعت (Deep Zen)',
    tag: 'آرامش عمیق',
    logo: '🧘',
    desc: 'فرکانس‌های ۴۳۲ هرتز، امواج تتا و زنگ‌های تبتی برای کاهش فوری استرس و خواب آرام',
    tone: 'mint',
    sources: [
      {
        id: 'zeno_med',
        streamUrl: 'https://stream.zeno.fm/75nswy9f4h8uv',
        allowedHosts: ['stream.zeno.fm', 'zeno.fm'],
        priority: 1,
      },
    ],
  },
  piano: {
    id: 'piano',
    name: 'پیانوی آرام و شبانه (Acoustic Piano)',
    tag: 'تک‌نوازی و ذن',
    logo: '🎹',
    desc: 'ملودی‌های لطیف پیانو و سازهای زهی کلاسیک برای همراهی لحظات تفکر و نوشتن',
    tone: 'purple',
    sources: [
      {
        id: 'zeno_piano',
        streamUrl: 'https://stream.zeno.fm/0r0xa792kwzuv',
        allowedHosts: ['stream.zeno.fm', 'zeno.fm'],
        priority: 1,
      },
    ],
  },
  ambient: {
    id: 'ambient',
    name: 'امبینت فضایی و کیهانی (Space Ambient)',
    tag: 'الهام‌بخش',
    logo: '🌌',
    desc: 'صداهای ژرف و بی‌پایان کیهان برای گسترش آگاهی، رویاپردازی و ریلکسیشن',
    tone: 'gold',
    sources: [
      {
        id: 'zeno_ambient',
        streamUrl: 'https://stream.zeno.fm/w062e73k2h8uv',
        allowedHosts: ['stream.zeno.fm', 'zeno.fm'],
        priority: 1,
      },
    ],
  },
};

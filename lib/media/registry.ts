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
      {
        id: 'backup_1',
        manifestUrl: 'https://tv-trtworld.medya.trt.com.tr/master.m3u8',
        allowedHosts: ['tv-trtworld.medya.trt.com.tr', 'medya.trt.com.tr', 'trtworld.com'],
        priority: 2,
      },
      {
        id: 'backup_2',
        manifestUrl: 'https://hlspackager.akamaized.net/live/DB/IRAN_INTERNATIONAL/HLS/IRAN_INTERNATIONAL.m3u8',
        allowedHosts: ['hlspackager.akamaized.net', 'akamaized.net', 'iranintl.com'],
        priority: 3,
      },
    ],
  },
  persiana_korea: {
    id: 'persiana_korea',
    name: 'پرشیانا کره (Persiana Korea)',
    category: 'movies',
    logo: '🌸',
    badge: 'HD',
    description: 'محبوب‌ترین کی‌دراماها (K-Drama)، فیلم‌های کره‌ای و برنامه‌های K-Pop',
    epgCurrent: 'سریال پرطرفدار کره‌ای با زیرنویس',
    epgNext: 'برنامه ویژه موسیقی و درام آسیایی',
    sources: [
      {
        id: 'primary',
        manifestUrl: 'https://korhls.persiana.live/hls/stream.m3u8',
        allowedHosts: ['korhls.persiana.live', 'persiana.live', 'wns.live'],
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
  four_u_tv: {
    id: 'four_u_tv',
    name: 'فور یو تی‌وی (4U TV HD)',
    category: 'satellite',
    logo: '🌟',
    badge: 'HD',
    description: 'سرگرمی، موسیقی، فیلم‌های سینمایی و برنامه‌های متنوع تلویزیونی',
    epgCurrent: 'برنامه شاد و مسابقه تلویزیونی',
    epgNext: 'موزیک و شوهای روز',
    sources: [
      {
        id: 'primary',
        manifestUrl: 'https://hls.4utv.live/hls/stream.m3u8',
        allowedHosts: ['hls.4utv.live', '4utv.live', 'avatv.live'],
        priority: 1,
      },
      {
        id: 'backup',
        manifestUrl: 'https://familyhls.avatv.live/hls/stream.m3u8',
        allowedHosts: ['familyhls.avatv.live', 'avatv.live'],
        priority: 2,
      },
    ],
  },
  toonix_kids: {
    id: 'toonix_kids',
    name: 'تونیکس کارتون (Toonix Kids)',
    category: 'kids',
    logo: '🦄',
    badge: 'HD',
    description: 'پخش کارتون‌ها، انیمیشن‌های دوبله فارسی، ماجراجویی و برنامه‌های شاد کودکان',
    epgCurrent: 'انیمیشن شاد و ماجراجویانه با دوبله',
    epgNext: 'کارتون‌های جذاب ویژه خردسالان و کودکان',
    sources: [
      {
        id: 'primary',
        manifestUrl: 'https://toonixhls.wns.live/hls/stream.m3u8',
        allowedHosts: ['toonixhls.wns.live', 'wns.live', 'persiana.live'],
        priority: 1,
      },
      {
        id: 'backup',
        manifestUrl: 'https://junhls.persiana.live/hls/stream.m3u8',
        allowedHosts: ['junhls.persiana.live', 'persiana.live'],
        priority: 2,
      },
    ],
  },
  persiana_junior: {
    id: 'persiana_junior',
    name: 'پرشیانا جونیور (Persiana Junior)',
    category: 'kids',
    logo: '🎈',
    badge: 'HD',
    description: 'دنیای سرشار از رنگ، کارتون‌های آموزنده و قصه‌های کودکانه',
    epgCurrent: 'انیمیشن‌های آموزنده و شاد',
    epgNext: 'برنامه کودک و آموزش مهارت‌ها',
    sources: [
      {
        id: 'primary',
        manifestUrl: 'https://junhls.persiana.live/hls/stream.m3u8',
        allowedHosts: ['junhls.persiana.live', 'persiana.live', 'wns.live'],
        priority: 1,
      },
      {
        id: 'backup',
        manifestUrl: 'https://toonixhls.wns.live/hls/stream.m3u8',
        allowedHosts: ['toonixhls.wns.live', 'wns.live'],
        priority: 2,
      },
    ],
  },
  iran_intl: {
    id: 'iran_intl',
    name: 'ایران اینترنشنال (Iran International)',
    category: 'news',
    logo: '🌐',
    badge: '1080p',
    description: 'پوشش زنده ۲۴ ساعته اخبار، گزارش‌های ویژه، تحلیل‌های اقتصادی و بین‌المللی',
    epgCurrent: 'بولتن زنده خبری و پوشش رویدادها',
    epgNext: 'برنامه تحلیلی و اتاق خبر',
    sources: [
      {
        id: 'primary',
        manifestUrl: 'https://hlspackager.akamaized.net/live/DB/IRAN_INTERNATIONAL/HLS/IRAN_INTERNATIONAL.m3u8',
        allowedHosts: ['hlspackager.akamaized.net', 'akamaized.net', 'iranintl.com'],
        priority: 1,
      },
      {
        id: 'backup',
        manifestUrl: 'https://tv-trtworld.medya.trt.com.tr/master.m3u8',
        allowedHosts: ['tv-trtworld.medya.trt.com.tr', 'medya.trt.com.tr', 'trtworld.com'],
        priority: 2,
      },
    ],
  },
  nasa_tv: {
    id: 'nasa_tv',
    name: 'ناسا تی‌وی (NASA TV Live HD)',
    category: 'docs',
    logo: '🚀',
    badge: '1080p',
    description: 'پخش زنده ۲۴ ساعته از ایستگاه فضایی بین‌المللی، پرتاب موشک‌ها و اسرار کیهان',
    epgCurrent: 'پخش زنده ایستگاه فضایی بین‌المللی ISS',
    epgNext: 'مستند کاوش‌های مریخ و تلسکوپ جیمز وب',
    sources: [
      {
        id: 'primary',
        manifestUrl: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8',
        allowedHosts: ['ntv1.akamaized.net', 'akamaized.net', 'nasa.gov'],
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
  trt_world: {
    id: 'trt_world',
    name: 'تی‌آرتی ورد (TRT World News HD)',
    category: 'news',
    logo: '🌍',
    badge: '1080p',
    description: 'شبکه بین‌المللی اخبار جهان، تحلیل رویدادهای منطقه‌ای و مستندهای جهانی',
    epgCurrent: 'World News Bulletin Live',
    epgNext: 'Insight Documentary & Global Analysis',
    sources: [
      {
        id: 'primary',
        manifestUrl: 'https://tv-trtworld.medya.trt.com.tr/master.m3u8',
        allowedHosts: ['tv-trtworld.medya.trt.com.tr', 'medya.trt.com.tr', 'trtworld.com'],
        priority: 1,
      },
      {
        id: 'backup',
        manifestUrl: 'https://hlspackager.akamaized.net/live/DB/IRAN_INTERNATIONAL/HLS/IRAN_INTERNATIONAL.m3u8',
        allowedHosts: ['hlspackager.akamaized.net', 'akamaized.net'],
        priority: 2,
      },
    ],
  },
  tv3: {
    id: 'tv3',
    name: 'شبکه سه سیما (TV 3)',
    category: 'sports',
    logo: '⚽',
    badge: 'HD',
    description: 'ورزش، فوتبال زنده لیگ برتر و اروپا، مسابقات و سریال‌های پرطرفدار',
    epgCurrent: 'پخش زنده مسابقات ورزشی و فوتبال',
    epgNext: 'گزارش ورزشی و تحلیل لیگ',
    sources: [
      {
        id: 'primary',
        manifestUrl: 'https://ncdn.telewebion.ir/tv3/live/playlist.m3u8',
        allowedHosts: ['ncdn.telewebion.ir', 'telewebion.ir', 'telewebion.com'],
        priority: 1,
      },
      {
        id: 'backup_sports',
        manifestUrl: 'https://fighthls.persiana.live/hls/stream.m3u8',
        allowedHosts: ['fighthls.persiana.live', 'persiana.live'],
        priority: 2,
      },
      {
        id: 'backup_redbull',
        manifestUrl: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
        allowedHosts: ['rbmn-live.akamaized.net', 'akamaized.net'],
        priority: 3,
      },
    ],
  },
  varzesh: {
    id: 'varzesh',
    name: 'شبکه ورزش (Varzesh TV)',
    category: 'sports',
    logo: '🏆',
    badge: 'HD',
    description: 'پخش زنده تخصصی رویدادهای ورزشی ایران و جهان، کشتی و والیبال',
    epgCurrent: 'رویدادهای زنده ورزشی جهان',
    epgNext: 'شب‌های فوتبالی و دنیای ورزش',
    sources: [
      {
        id: 'primary',
        manifestUrl: 'https://ncdn.telewebion.ir/varzesh/live/playlist.m3u8',
        allowedHosts: ['ncdn.telewebion.ir', 'telewebion.ir', 'telewebion.com'],
        priority: 1,
      },
      {
        id: 'backup_sports',
        manifestUrl: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
        allowedHosts: ['rbmn-live.akamaized.net', 'akamaized.net'],
        priority: 2,
      },
      {
        id: 'backup_fight',
        manifestUrl: 'https://fighthls.persiana.live/hls/stream.m3u8',
        allowedHosts: ['fighthls.persiana.live', 'persiana.live'],
        priority: 3,
      },
    ],
  },
  nasim: {
    id: 'nasim',
    name: 'شبکه نسیم (Nasim TV)',
    category: 'general',
    logo: '🎭',
    badge: 'HD',
    description: 'نشاط و سرگرمی خانوادگی، برنامه‌های کمدی و مسابقات طنز',
    epgCurrent: 'مسابقه و سرگرمی خانوادگی',
    epgNext: 'برنامه طنز و موسیقی شبانه',
    sources: [
      {
        id: 'primary',
        manifestUrl: 'https://ncdn.telewebion.ir/nasim/live/playlist.m3u8',
        allowedHosts: ['ncdn.telewebion.ir', 'telewebion.ir', 'telewebion.com'],
        priority: 1,
      },
      {
        id: 'backup',
        manifestUrl: 'https://comedyhls.persiana.live/hls/stream.m3u8',
        allowedHosts: ['comedyhls.persiana.live', 'persiana.live'],
        priority: 2,
      },
    ],
  },
  mostanad: {
    id: 'mostanad',
    name: 'شبکه مستند (Mostanad TV)',
    category: 'docs',
    logo: '🌿',
    badge: 'HD',
    description: 'مستندهای حیات وحش، تاریخ، کهکشان و فناوری با کیفیت بالا',
    epgCurrent: 'مستند شگفتی‌های خلقت و طبیعت',
    epgNext: 'مستند کاوشگران فضا و فناوری',
    sources: [
      {
        id: 'primary',
        manifestUrl: 'https://ncdn.telewebion.ir/mostanad/live/playlist.m3u8',
        allowedHosts: ['ncdn.telewebion.ir', 'telewebion.ir', 'telewebion.com'],
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
  pooya: {
    id: 'pooya',
    name: 'شبکه پویا و نهال (Pooya TV)',
    category: 'kids',
    logo: '🎈',
    badge: 'HD',
    description: 'کارتون‌ها، انیمیشن‌های آموزنده و برنامه‌های شاد ویژه کودک و نوجوان',
    epgCurrent: 'انیمیشن‌های جذاب و سرگرم‌کننده',
    epgNext: 'برنامه شاد کودکانه و قصه',
    sources: [
      {
        id: 'primary',
        manifestUrl: 'https://ncdn.telewebion.ir/pooya/live/playlist.m3u8',
        allowedHosts: ['ncdn.telewebion.ir', 'telewebion.ir', 'telewebion.com'],
        priority: 1,
      },
      {
        id: 'backup_toonix',
        manifestUrl: 'https://toonixhls.wns.live/hls/stream.m3u8',
        allowedHosts: ['toonixhls.wns.live', 'wns.live', 'persiana.live'],
        priority: 2,
      },
      {
        id: 'backup_junior',
        manifestUrl: 'https://junhls.persiana.live/hls/stream.m3u8',
        allowedHosts: ['junhls.persiana.live', 'persiana.live'],
        priority: 3,
      },
    ],
  },
  tv1: {
    id: 'tv1',
    name: 'شبکه یک سیما (TV 1)',
    category: 'general',
    logo: '🇮🇷',
    badge: 'HD',
    description: 'شبکه ملی؛ اخبار، برنامه‌های گفتگومحور، مستند و سریال‌های فاخر',
    epgCurrent: 'برنامه فرهنگی و اجتماعی',
    epgNext: 'اخبار سراسری ساعت ۲۱',
    sources: [
      {
        id: 'primary',
        manifestUrl: 'https://ncdn.telewebion.ir/tv1/live/playlist.m3u8',
        allowedHosts: ['ncdn.telewebion.ir', 'telewebion.ir', 'telewebion.com'],
        priority: 1,
      },
      {
        id: 'backup',
        manifestUrl: 'https://irhls.persiana.live/hls/stream.m3u8',
        allowedHosts: ['irhls.persiana.live', 'persiana.live'],
        priority: 2,
      },
    ],
  },
  namayesh: {
    id: 'namayesh',
    name: 'شبکه نمایش (Namayesh TV)',
    category: 'movies',
    logo: '🍿',
    badge: 'HD',
    description: 'فیلم‌های سینمایی برتر جهان، هالیوود و سینمای کلاسیک',
    epgCurrent: 'فیلم سینمایی منتخب جهان',
    epgNext: 'سینمای کلاسیک و شاهکارهای برتر',
    sources: [
      {
        id: 'primary',
        manifestUrl: 'https://ncdn.telewebion.ir/namayesh/live/playlist.m3u8',
        allowedHosts: ['ncdn.telewebion.ir', 'telewebion.ir', 'telewebion.com'],
        priority: 1,
      },
      {
        id: 'backup_cinema',
        manifestUrl: 'https://cinehls.persiana.live/hls/stream.m3u8',
        allowedHosts: ['cinehls.persiana.live', 'persiana.live'],
        priority: 2,
      },
      {
        id: 'backup_grand',
        manifestUrl: 'https://gcinemahls.wns.live/hls/stream.m3u8',
        allowedHosts: ['gcinemahls.wns.live', 'wns.live'],
        priority: 3,
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

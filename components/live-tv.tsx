'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Tv,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Radio,
  RefreshCw,
  Film,
  Dumbbell,
  Compass,
  Newspaper,
  Smile,
  Heart,
  ShieldCheck,
  Layers,
  Sparkles,
  Music2,
  Search,
  Server
} from 'lucide-react';

export type TVChannel = {
  id: string;
  name: string;
  category: 'satellite' | 'sports' | 'movies' | 'music' | 'docs' | 'news' | 'kids' | 'general';
  logo: string;
  badge: string;
  description: string;
  streamUrl: string;
  backupUrls?: string[];
  epgCurrent: string;
  epgNext: string;
};

const TV_CHANNELS: TVChannel[] = [
  {
    id: '_canary',
    name: 'تست سیگنال کَناری (Canary Self-Test)',
    category: 'general',
    logo: '🛡️',
    badge: 'CANARY',
    description: 'استریم زنده آزمایشی داخلی جهت سنجش سلامت پلیر HLS و رمزگشای دستگاه شما بدون وابستگی به اینترنت خارجی',
    streamUrl: '/api/media/hls/_canary',
    epgCurrent: 'تست داخلی خط لوله HLS.js و صدا و تصویر',
    epgNext: 'سنجش سلامت کلاینت',
  },
  // ─── ماهواره‌ای و پرطرفدار فارسی (SATELLITE & PERSIAN FTA) ───
  {
    id: 'persiana_cinema',
    name: 'پرشیانا سینما (Persiana Cinema)',
    category: 'satellite',
    logo: '🎬',
    badge: 'FHD',
    description: 'برترین فیلم‌های سینمایی روز جهان و هالیوود با دوبله و زیرنویس اختصاصی',
    streamUrl: 'https://cinehls.persiana.live/hls/stream.m3u8',
    backupUrls: ['https://gcinemahls.wns.live/hls/stream.m3u8'],
    epgCurrent: 'فیلم سینمایی برتر جهان',
    epgNext: 'شاهکارهای سینمای اکشن و درام',
  },
  {
    id: 'rjtv',
    name: 'رادیو جوان (Radio Javan TV)',
    category: 'music',
    logo: '🎧',
    badge: '1080p',
    description: 'پخش ۲۴ ساعته برترین موزیک‌ویدیوها، مصاحبه‌ها، کنسرت‌ها و برنامه‌های اختصاصی',
    streamUrl: 'https://rjtvhls.wns.live/hls/stream.m3u8',
    backupUrls: ['https://musichls.persiana.live/hls/stream.m3u8', 'https://hls.avang.live/hls/stream.m3u8'],
    epgCurrent: 'موزیک‌ویدیوهای روز و برترین ریمیکس‌ها',
    epgNext: 'برنامه اختصاصی گرند استودیو RJ',
  },
  {
    id: 'avaseries',
    name: 'آوا سریال (AVA Series HD)',
    category: 'movies',
    logo: '📺',
    badge: 'HD',
    description: 'پخش محبوب‌ترین سریال‌های داستانی، خانوادگی، درام و ترکی با دوبله پارسی',
    streamUrl: 'https://avaserieshls.wns.live/hls/stream.m3u8',
    backupUrls: ['https://onehls.persiana.live/hls/stream.m3u8'],
    epgCurrent: 'سریال درام و پرمخاطب',
    epgNext: 'قسمت جدید سریال محبوب خانوادگی',
  },
  {
    id: 'avafamily',
    name: 'آوا فمیلی (AVA Family)',
    category: 'satellite',
    logo: '🍿',
    badge: 'HD',
    description: 'سرگرمی‌های شاد خانوادگی، فیلم، انیمیشن و شوهای تلویزیونی',
    streamUrl: 'https://familyhls.avatv.live/hls/stream.m3u8',
    backupUrls: ['https://familyhls.persiana.live/hls/stream.m3u8'],
    epgCurrent: 'برنامه شاد و سرگرمی خانوادگی',
    epgNext: 'فیلم سینمایی عصرگاهی',
  },
  {
    id: 'fx1',
    name: 'اف‌ایکس ۱ (FX 1 HD)',
    category: 'movies',
    logo: '⚡',
    badge: 'HD',
    description: 'سینمای هیجان‌انگیز، فیلم‌های علمی‌تخیلی، اکشن و ماجراجویی بدون سانسور',
    streamUrl: 'https://fxtvhls.wns.live/hls/stream.m3u8',
    backupUrls: ['https://slonehls.wns.live/hls/stream.m3u8'],
    epgCurrent: 'فیلم هیجان‌انگیز و اکشن هالیوودی',
    epgNext: 'سینمایی معمایی و تخیلی',
  },
  {
    id: 'persiana_iranian',
    name: 'پرشیانا ایرانی (Persiana Iranian)',
    category: 'movies',
    logo: '🇮🇷',
    badge: 'HD',
    description: 'پخش برترین فیلم‌های سینمای ایران، آثار ماندگار و سریال‌های محبوب ایرانی',
    streamUrl: 'https://irhls.persiana.live/hls/stream.m3u8',
    backupUrls: ['https://metafilmhls.wns.live/hls/stream.m3u8'],
    epgCurrent: 'فیلم سینمایی برگزیده ایرانی',
    epgNext: 'نوستالژی‌های سینمای ایران',
  },
  {
    id: 'persiana_comedy',
    name: 'پرشیانا کمدی (Persiana Comedy)',
    category: 'satellite',
    logo: '😂',
    badge: 'HD',
    description: 'خنده‌دارترین فیلم‌های کمدی جهان، شوها و برنامه‌های طنز ۲۴ ساعته',
    streamUrl: 'https://comedyhls.persiana.live/hls/stream.m3u8',
    backupUrls: ['https://cafefhls.wns.live/hls/stream.m3u8'],
    epgCurrent: 'فیلم کمدی و طنز خانوادگی',
    epgNext: 'استندآپ کمدی و شوهای خنده',
  },
  {
    id: 'persiana_series',
    name: 'پرشیانا سریز (Persiana Series)',
    category: 'movies',
    logo: '🎞️',
    badge: 'HD',
    description: 'پخش مداوم بهترین سریال‌های هالیوود و جهان با زیرنویس و دوبله',
    streamUrl: 'https://onehls.persiana.live/hls/stream.m3u8',
    backupUrls: ['https://sltwohls.wns.live/hls/stream.m3u8'],
    epgCurrent: 'پخش سریال پرمخاطب جهانی',
    epgNext: 'پشت صحنه و نقد سریال',
  },
  {
    id: 'persiana_music',
    name: 'پرشیانا موزیک (4Music / Persiana Music)',
    category: 'music',
    logo: '🎵',
    badge: 'HD',
    description: 'برترین موسیقی‌های پاپ، هیپ‌هاپ، راک، نوستالژی و ریمیکس‌های شاد',
    streamUrl: 'https://musichls.persiana.live/hls/stream.m3u8',
    backupUrls: ['https://raphls.persiana.live/hls/stream.m3u8'],
    epgCurrent: 'تاپ موزیک و تازه‌های ترانه',
    epgNext: 'پلی‌لیست پرانرژی روزانه',
  },
  {
    id: 'avang',
    name: 'آوانگ تی‌وی (Avang TV HD)',
    category: 'music',
    logo: '🎸',
    badge: '1080p',
    description: 'موزیک ویدیوهای کمپانی آوانگ و هنرمندان نام‌آشنای موسیقی پاپ',
    streamUrl: 'https://hls.avang.live/hls/stream.m3u8',
    backupUrls: ['https://rjtvhls.wns.live/hls/stream.m3u8'],
    epgCurrent: 'موزیک ویدیوهای اختصاصی آوانگ',
    epgNext: 'کنسرت‌های خاطره‌انگیز',
  },
  {
    id: 'persiana_docs',
    name: 'پرشیانا مستند و علم (Persiana Science & Docs)',
    category: 'docs',
    logo: '🌌',
    badge: 'HD',
    description: 'مستندهای شگفت‌انگیز کهکشان، اقیانوس‌ها، فناوری و حیات وحش با دوبله فارسی',
    streamUrl: 'https://scihls.persiana.live/hls/stream.m3u8',
    backupUrls: ['https://ptravelhls.persiana.live/hls/stream.m3u8'],
    epgCurrent: 'مستند شگفتی‌های کیهان و علم',
    epgNext: 'کاوش در اعماق طبیعت و حیات وحش',
  },
  {
    id: 'persiana_travel',
    name: 'پرشیانا گردشگری و سفر (Persiana Travel)',
    category: 'docs',
    logo: '✈️',
    badge: 'HD',
    description: 'زیباترین مقاصد گردشگری جهان، فرهنگ‌ها، جاذبه‌ها و ماجراجویی‌های دیدنی',
    streamUrl: 'https://ptravelhls.persiana.live/hls/stream.m3u8',
    backupUrls: ['https://scihls.persiana.live/hls/stream.m3u8'],
    epgCurrent: 'سفر به زیباترین شهرهای دنیا',
    epgNext: 'مستند جاذبه‌های توریستی و فرهنگ ملل',
  },
  {
    id: 'persiana_fight',
    name: 'پرشیانا مبارزه و ورزش (Persiana Fight)',
    category: 'sports',
    logo: '🥊',
    badge: 'HD',
    description: 'پوشش مسابقات UFC، بوکس، کشتی‌کج، موی‌تای و مبارزات رزمی معتبر دنیا',
    streamUrl: 'https://fighthls.persiana.live/hls/stream.m3u8',
    backupUrls: ['https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8'],
    epgCurrent: 'مسابقات قهرمانی UFC و بوکس حرفه‌ای',
    epgNext: 'بهترین ناک‌اوت‌های تاریخ ورزش رزمی',
  },
  {
    id: 'persiana_korea',
    name: 'پرشیانا کره (Persiana Korea)',
    category: 'movies',
    logo: '🌸',
    badge: 'HD',
    description: 'محبوب‌ترین کی‌دراماها (K-Drama)، فیلم‌های کره‌ای و برنامه‌های K-Pop',
    streamUrl: 'https://korhls.persiana.live/hls/stream.m3u8',
    backupUrls: ['https://onehls.persiana.live/hls/stream.m3u8'],
    epgCurrent: 'سریال پرطرفدار کره‌ای با زیرنویس',
    epgNext: 'برنامه ویژه موسیقی و درام آسیایی',
  },
  {
    id: 'persiana_nostalgia',
    name: 'پرشیانا خاطره‌ها (Persiana Nostalgia)',
    category: 'satellite',
    logo: '📻',
    badge: 'HD',
    description: 'ترانه‌ها، شوها، فیلم‌ها و سریال‌های خاطره‌انگیز دهه‌های گذشته',
    streamUrl: 'https://noshls.persiana.live/hls/stream.m3u8',
    backupUrls: ['https://clshls.wns.live/hls/stream.m3u8'],
    epgCurrent: 'ترانه‌ها و برنامه‌های قدیمی و خاطره‌انگیز',
    epgNext: 'سینمای کلاسیک طلایی',
  },
  {
    id: 'grand_cinema',
    name: 'گرند سینما (Grand Cinema HD)',
    category: 'movies',
    logo: '🎥',
    badge: 'HD',
    description: 'پخش فیلم‌های تحسین‌شده جشنواره‌ها، آثار بلاک‌باستر و سینمای جهان',
    streamUrl: 'https://gcinemahls.wns.live/hls/stream.m3u8',
    backupUrls: ['https://cinehls.persiana.live/hls/stream.m3u8'],
    epgCurrent: 'فیلم سینمایی برتر هالیوود',
    epgNext: 'آثار برگزیده اسکار و کن',
  },
  {
    id: 'four_u_tv',
    name: 'فور یو تی‌وی (4U TV HD)',
    category: 'satellite',
    logo: '🌟',
    badge: 'HD',
    description: 'سرگرمی، موسیقی، فیلم‌های سینمایی و برنامه‌های متنوع تلویزیونی',
    streamUrl: 'https://hls.4utv.live/hls/stream.m3u8',
    backupUrls: ['https://familyhls.avatv.live/hls/stream.m3u8'],
    epgCurrent: 'برنامه شاد و مسابقه تلویزیونی',
    epgNext: 'موزیک و شوهای روز',
  },
  {
    id: 'toonix_kids',
    name: 'تونیکس کارتون (Toonix Kids)',
    category: 'kids',
    logo: '🦄',
    badge: 'HD',
    description: 'پخش کارتون‌ها، انیمیشن‌های دوبله فارسی، ماجراجویی و برنامه‌های شاد کودکان',
    streamUrl: 'https://toonixhls.wns.live/hls/stream.m3u8',
    backupUrls: ['https://junhls.persiana.live/hls/stream.m3u8'],
    epgCurrent: 'انیمیشن شاد و ماجراجویانه با دوبله',
    epgNext: 'کارتون‌های جذاب ویژه خردسالان و کودکان',
  },
  {
    id: 'persiana_junior',
    name: 'پرشیانا جونیور (Persiana Junior)',
    category: 'kids',
    logo: '🎈',
    badge: 'HD',
    description: 'دنیای سرشار از رنگ، کارتون‌های آموزنده و قصه‌های کودکانه',
    streamUrl: 'https://junhls.persiana.live/hls/stream.m3u8',
    backupUrls: ['https://toonixhls.wns.live/hls/stream.m3u8'],
    epgCurrent: 'انیمیشن‌های آموزنده و شاد',
    epgNext: 'برنامه کودک و آموزش مهارت‌ها',
  },
  {
    id: 'iran_intl',
    name: 'ایران اینترنشنال (Iran International)',
    category: 'news',
    logo: '🌐',
    badge: '1080p',
    description: 'پوشش زنده ۲۴ ساعته اخبار، گزارش‌های ویژه، تحلیل‌های اقتصادی و بین‌المللی',
    streamUrl: 'https://hlspackager.akamaized.net/live/DB/IRAN_INTERNATIONAL/HLS/IRAN_INTERNATIONAL.m3u8',
    backupUrls: ['https://tv-trtworld.medya.trt.com.tr/master.m3u8'],
    epgCurrent: 'بولتن زنده خبری و پوشش رویدادها',
    epgNext: 'برنامه تحلیلی و اتاق خبر',
  },
  {
    id: 'redbull_tv',
    name: 'ردبول تی‌وی (Red Bull TV HD)',
    category: 'sports',
    logo: '🏄‍♂️',
    badge: '1080p',
    description: 'ورزش‌های اکستریم، اسنوبورد، ردبول فرمول یک، آفرود و هیجان فوق‌العاده',
    streamUrl: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
    backupUrls: ['https://fighthls.persiana.live/hls/stream.m3u8'],
    epgCurrent: 'مسابقات ردبول آکروباتیک و موتورسواری',
    epgNext: 'ماجراجویی در صخره‌ها و موج‌سواری',
  },
  {
    id: 'nasa_tv',
    name: 'ناسا تی‌وی (NASA TV Live HD)',
    category: 'docs',
    logo: '🚀',
    badge: '1080p',
    description: 'پخش زنده ۲۴ ساعته از ایستگاه فضایی بین‌المللی، پرتاب موشک‌ها و اسرار کیهان',
    streamUrl: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8',
    backupUrls: ['https://scihls.persiana.live/hls/stream.m3u8'],
    epgCurrent: 'پخش زنده ایستگاه فضایی بین‌المللی ISS',
    epgNext: 'مستند کاوش‌های مریخ و تلسکوپ جیمز وب',
  },
  {
    id: 'trt_world',
    name: 'تی‌آرتی ورد (TRT World News HD)',
    category: 'news',
    logo: '🌍',
    badge: '1080p',
    description: 'شبکه بین‌المللی اخبار جهان، تحلیل رویدادهای منطقه‌ای و مستندهای جهانی',
    streamUrl: 'https://tv-trtworld.medya.trt.com.tr/master.m3u8',
    backupUrls: ['https://hlspackager.akamaized.net/live/DB/IRAN_INTERNATIONAL/HLS/IRAN_INTERNATIONAL.m3u8'],
    epgCurrent: 'World News Bulletin Live',
    epgNext: 'Insight Documentary & Global Analysis',
  },

  // ─── شبکه‌های ملی و صدا و سیما (IRIB CHANNELS) ───
  {
    id: 'tv3',
    name: 'شبکه سه سیما (TV 3)',
    category: 'sports',
    logo: '⚽',
    badge: 'HD',
    description: 'ورزش، فوتبال زنده لیگ برتر و اروپا، مسابقات و سریال‌های پرطرفدار',
    streamUrl: 'https://ncdn.telewebion.ir/tv3/live/playlist.m3u8',
    backupUrls: ['https://fighthls.persiana.live/hls/stream.m3u8'],
    epgCurrent: 'پخش زنده مسابقات ورزشی و فوتبال',
    epgNext: 'گزارش ورزشی و تحلیل لیگ',
  },
  {
    id: 'varzesh',
    name: 'شبکه ورزش (Varzesh TV)',
    category: 'sports',
    logo: '🏆',
    badge: 'HD',
    description: 'پخش زنده تخصصی رویدادهای ورزشی ایران و جهان، کشتی و والیبال',
    streamUrl: 'https://ncdn.telewebion.ir/varzesh/live/playlist.m3u8',
    backupUrls: ['https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8'],
    epgCurrent: 'رویدادهای زنده ورزشی جهان',
    epgNext: 'شب‌های فوتبالی و دنیای ورزش',
  },
  {
    id: 'nasim',
    name: 'شبکه نسیم (Nasim TV)',
    category: 'general',
    logo: '🎭',
    badge: 'HD',
    description: 'نشاط و سرگرمی خانوادگی، برنامه‌های کمدی و مسابقات طنز',
    streamUrl: 'https://ncdn.telewebion.ir/nasim/live/playlist.m3u8',
    backupUrls: ['https://comedyhls.persiana.live/hls/stream.m3u8'],
    epgCurrent: 'مسابقه و سرگرمی خانوادگی',
    epgNext: 'برنامه طنز و موسیقی شبانه',
  },
  {
    id: 'mostanad',
    name: 'شبکه مستند (Mostanad TV)',
    category: 'docs',
    logo: '🌿',
    badge: 'HD',
    description: 'مستندهای حیات وحش، تاریخ، کهکشان و فناوری با کیفیت بالا',
    streamUrl: 'https://ncdn.telewebion.ir/mostanad/live/playlist.m3u8',
    backupUrls: ['https://scihls.persiana.live/hls/stream.m3u8'],
    epgCurrent: 'مستند شگفتی‌های خلقت و طبیعت',
    epgNext: 'مستند کاوشگران فضا و فناوری',
  },
  {
    id: 'pooya',
    name: 'شبکه پویا و نهال (Pooya TV)',
    category: 'kids',
    logo: '🎈',
    badge: 'HD',
    description: 'کارتون‌ها، انیمیشن‌های آموزنده و برنامه‌های شاد ویژه کودک و نوجوان',
    streamUrl: 'https://ncdn.telewebion.ir/pooya/live/playlist.m3u8',
    backupUrls: ['https://toonixhls.wns.live/hls/stream.m3u8'],
    epgCurrent: 'انیمیشن‌های جذاب و سرگرم‌کننده',
    epgNext: 'برنامه شاد کودکانه و قصه',
  },
  {
    id: 'tv1',
    name: 'شبکه یک سیما (TV 1)',
    category: 'general',
    logo: '🇮🇷',
    badge: 'HD',
    description: 'شبکه ملی؛ اخبار، برنامه‌های گفتگومحور، مستند و سریال‌های فاخر',
    streamUrl: 'https://ncdn.telewebion.ir/tv1/live/playlist.m3u8',
    backupUrls: ['https://irhls.persiana.live/hls/stream.m3u8'],
    epgCurrent: 'برنامه فرهنگی و اجتماعی',
    epgNext: 'اخبار سراسری ساعت ۲۱',
  },
  {
    id: 'namayesh',
    name: 'شبکه نمایش (Namayesh TV)',
    category: 'movies',
    logo: '🍿',
    badge: 'HD',
    description: 'فیلم‌های سینمایی برتر جهان، هالیوود و سینمای کلاسیک',
    streamUrl: 'https://ncdn.telewebion.ir/namayesh/live/playlist.m3u8',
    backupUrls: ['https://cinehls.persiana.live/hls/stream.m3u8'],
    epgCurrent: 'فیلم سینمایی منتخب جهان',
    epgNext: 'سینمای کلاسیک و شاهکارهای برتر',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'همه شبکه‌ها', icon: Layers },
  { id: 'satellite', label: 'ماهواره‌ای و فارسی', icon: Sparkles },
  { id: 'movies', label: 'فیلم و سریال', icon: Film },
  { id: 'music', label: 'موزیک و شو', icon: Music2 },
  { id: 'sports', label: 'ورزش و فوتبال', icon: Dumbbell },
  { id: 'docs', label: 'مستند و فضا', icon: Compass },
  { id: 'kids', label: 'کارتون و کودک', icon: Smile },
  { id: 'news', label: 'اخبار و رویداد', icon: Newspaper },
  { id: 'general', label: 'شبکه‌های سراسری', icon: Tv },
];

export default function LiveTV() {
  const [selectedChannel, setSelectedChannel] = useState<TVChannel>(TV_CHANNELS[0]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentServerIndex, setCurrentServerIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(['persiana_cinema', 'rjtv', 'avaseries', 'persiana_fight']);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const hlsInstanceRef = useRef<any>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('roshna-tv-favorites') || '[]');
      if (Array.isArray(saved) && saved.length > 0) setFavorites(saved);
    } catch {}
  }, []);

  const toggleFavorite = (channelId: string) => {
    const next = favorites.includes(channelId)
      ? favorites.filter((id) => id !== channelId)
      : [...favorites, channelId];
    setFavorites(next);
    try {
      localStorage.setItem('roshna-tv-favorites', JSON.stringify(next));
    } catch {}
  };

  // Get same-origin stream endpoint through Roshana Media Gateway with server index
  const getStreamUrl = useCallback((channel: TVChannel, serverIdx: number) => {
    return `/api/media/hls/${encodeURIComponent(channel.id)}?s=${serverIdx}`;
  }, []);

  // Setup HLS Player
  const loadChannel = useCallback((channel: TVChannel, serverIdx = 0) => {
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setHasError(false);
    setCurrentServerIndex(serverIdx);

    const streamToLoad = getStreamUrl(channel, serverIdx);

    if (hlsInstanceRef.current) {
      try {
        hlsInstanceRef.current.destroy();
      } catch {}
      hlsInstanceRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        manifestLoadingTimeOut: 12000,
        levelLoadingTimeOut: 12000,
        fragLoadingTimeOut: 18000,
      });

      hls.loadSource(streamToLoad);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        setHasError(false);
        video.play().then(() => setIsPlaying(true)).catch(() => {
          // If browser policy blocks sound autoplay, auto-fallback to muted play
          video.muted = true;
          setIsMuted(true);
          video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        });
      });

      hls.on(Hls.Events.ERROR, (_event: any, data: any) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              const totalServers = 1 + (channel.backupUrls?.length || 0);
              if (serverIdx + 1 < totalServers) {
                hls.destroy();
                loadChannel(channel, serverIdx + 1);
              } else {
                hls.startLoad();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              setHasError(true);
              setIsLoading(false);
              break;
          }
        }
      });

      hlsInstanceRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS for Safari / iOS
      video.src = streamToLoad;
      video.onloadedmetadata = () => {
        setIsLoading(false);
        setHasError(false);
        video.play().then(() => setIsPlaying(true)).catch(() => {
          // Fallback to muted playback on iOS Safari autoplay restriction
          video.muted = true;
          setIsMuted(true);
          video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        });
      };
      video.onerror = () => {
        const totalServers = 1 + (channel.backupUrls?.length || 0);
        if (serverIdx + 1 < totalServers) {
          loadChannel(channel, serverIdx + 1);
        } else {
          setHasError(true);
          setIsLoading(false);
        }
      };
    } else {
      setHasError(true);
      setIsLoading(false);
    }
  }, [getStreamUrl]);

  useEffect(() => {
    loadChannel(selectedChannel, 0);
    return () => {
      if (hlsInstanceRef.current) {
        try {
          hlsInstanceRef.current.destroy();
        } catch {}
        hlsInstanceRef.current = null;
      }
    };
  }, [selectedChannel, loadChannel]);

  const switchServer = () => {
    const totalServers = 1 + (selectedChannel.backupUrls?.length || 0);
    const nextIdx = (currentServerIndex + 1) % totalServers;
    loadChannel(selectedChannel, nextIdx);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleFullscreen = () => {
    const container = playerContainerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const filteredChannels = TV_CHANNELS.filter((ch) => {
    const matchCat = categoryFilter === 'all' || ch.category === categoryFilter;
    const matchSearch =
      !searchQuery.trim() ||
      ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.epgCurrent.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const availableServersCount = 1 + (selectedChannel.backupUrls?.length || 0);

  return (
    <div className="tv-hub-container" dir="rtl">
      {/* Hero Header */}
      <header className="tv-hero-header">
        <div className="tv-hero-info">
          <span className="tv-eyebrow">
            <Radio size={16} /> تلویزیون اینترنتی زنده روشنا
          </span>
          <h1>پخش زنده شبکه‌های ماهواره‌ای و سراسری</h1>
          <p>
            تماشای زنده و رایگان بیش از ۲۵ شبکه پرطرفدار سینمایی، موسیقی، ورزشی، مستند و کودک با سرورهای پرسرعت CDN بدون قطعی.
          </p>
        </div>
        <div className="tv-hero-badge">
          <div className="tv-live-pill">
            <span className="tv-pulse-dot" />
            <strong>پخش زنده Full HD</strong>
          </div>
          <small>{TV_CHANNELS.length} شبکه اختصاصی فعال</small>
        </div>
      </header>

      {/* Main TV Layout */}
      <div className="tv-main-grid">
        {/* Left Column: Player and Active Channel Info */}
        <div className="tv-player-column">
          <div ref={playerContainerRef} className={`tv-player-wrapper ${isFullscreen ? 'fullscreen' : ''}`}>
            <video
              ref={videoRef}
              className="tv-video-element"
              playsInline
              // @ts-ignore
              webkit-playsinline="true"
              x5-playsinline="true"
              autoPlay
              muted={isMuted}
              onClick={togglePlay}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />

            {/* Overlay Loading / Error */}
            {isLoading && (
              <div className="tv-player-overlay">
                <RefreshCw size={36} className="tv-spin" />
                <span>در حال اتصال به سرور سیگنال {selectedChannel.name}...</span>
              </div>
            )}

            {hasError && (
              <div className="tv-player-overlay error">
                <Tv size={42} />
                <strong>سیگنال این سرور در دسترس نیست</strong>
                <p>می‌توانید سرور کمکی را تغییر دهید یا شبکه دیگری را انتخاب کنید.</p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {availableServersCount > 1 && (
                    <button type="button" className="g-btn primary" onClick={switchServer}>
                      <Server size={15} /> تعویض سرور پخش (سرور {currentServerIndex + 1} از {availableServersCount})
                    </button>
                  )}
                  <button type="button" className="g-btn" onClick={() => loadChannel(selectedChannel, 0)}>
                    <RefreshCw size={15} /> تلاش مجدد
                  </button>
                </div>
              </div>
            )}

            {/* Custom Player Controls Bar */}
            <div className="tv-controls-bar">
              <div className="tv-controls-left">
                <button type="button" className="tv-ctrl-btn" onClick={togglePlay} title={isPlaying ? 'توقف' : 'پخش'}>
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <div className="tv-volume-box">
                  <button type="button" className="tv-ctrl-btn" onClick={toggleMute} title={isMuted ? 'صدا' : 'بی‌صدا'}>
                    {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="tv-volume-slider"
                  />
                </div>
                <div className="tv-channel-tag">
                  <span className="tv-tag-logo">{selectedChannel.logo}</span>
                  <strong className="tv-tag-name">{selectedChannel.name}</strong>
                  <span className="tv-live-tag">زنده</span>
                </div>
              </div>

              <div className="tv-controls-right">
                {availableServersCount > 1 && (
                  <button
                    type="button"
                    className="tv-ctrl-btn tv-server-ctrl-btn"
                    onClick={switchServer}
                    title={`تعویض سرور (سرور ${currentServerIndex + 1} از ${availableServersCount})`}
                  >
                    <Server size={15} />
                    <span className="tv-server-text">سرور {currentServerIndex + 1}</span>
                  </button>
                )}
                <button
                  type="button"
                  className={`tv-ctrl-btn ${favorites.includes(selectedChannel.id) ? 'fav-active' : ''}`}
                  onClick={() => toggleFavorite(selectedChannel.id)}
                  title="نشان‌کردن این شبکه"
                >
                  <Heart size={18} fill={favorites.includes(selectedChannel.id) ? '#d4af37' : 'none'} />
                </button>
                <button type="button" className="tv-ctrl-btn" onClick={toggleFullscreen} title="تمام صفحه">
                  {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* Active Channel Details & EPG */}
          <div className="tv-channel-details-card">
            <div className="tv-det-header">
              <div className="tv-det-title">
                <span className="tv-det-icon">{selectedChannel.logo}</span>
                <div>
                  <h2>{selectedChannel.name}</h2>
                  <p>{selectedChannel.description}</p>
                </div>
              </div>
              <div className="tv-det-badges-row">
                {availableServersCount > 1 && (
                  <button
                    type="button"
                    className="tv-det-server-btn"
                    onClick={switchServer}
                    title="تغییر سرور پخش زنده"
                  >
                    <Server size={13} />
                    <span>سرور {currentServerIndex + 1}</span>
                  </button>
                )}
                <span className="tv-det-badge">{selectedChannel.badge}</span>
              </div>
            </div>

            {/* EPG Program Guide */}
            <div className="tv-epg-box">
              <div className="tv-epg-item current">
                <div className="tv-epg-time">
                  <span className="tv-pulse-dot small" />
                  <span>در حال پخش:</span>
                </div>
                <strong>{selectedChannel.epgCurrent}</strong>
              </div>
              <div className="tv-epg-item next">
                <div className="tv-epg-time">
                  <span>برنامه بعدی:</span>
                </div>
                <strong>{selectedChannel.epgNext}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Channels Selector Sidebar */}
        <div className="tv-channels-sidebar">
          {/* Search Box */}
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', right: '12px', top: '12px', color: 'var(--muted)' }} />
            <input
              type="text"
              placeholder="جستجوی نام یا ژانر شبکه..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 36px 9px 12px',
                borderRadius: '12px',
                border: '1px solid var(--line)',
                background: 'var(--bg)',
                fontSize: '12.5px',
                color: 'var(--text)',
                outline: 'none',
              }}
            />
          </div>

          {/* Categories Selector */}
          <div className="tv-cats-pills">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`tv-cat-btn ${categoryFilter === cat.id ? 'active' : ''}`}
                  onClick={() => setCategoryFilter(cat.id)}
                >
                  <Icon size={14} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Channels Grid List */}
          <div className="tv-channels-list">
            {filteredChannels.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--muted)', fontSize: '12.5px' }}>
                شبکه‌ای با این مشخصات یافت نشد.
              </div>
            ) : (
              filteredChannels.map((ch) => {
                const isSelected = selectedChannel.id === ch.id;
                const isFav = favorites.includes(ch.id);
                return (
                  <button
                    key={ch.id}
                    type="button"
                    className={`tv-ch-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedChannel(ch);
                    }}
                  >
                    <div className="tv-ch-icon">{ch.logo}</div>
                    <div className="tv-ch-info">
                      <div className="tv-ch-name-row">
                        <strong>{ch.name}</strong>
                        {isFav && <span className="tv-fav-star">★</span>}
                      </div>
                      <small>{ch.epgCurrent}</small>
                    </div>
                    <span className="tv-ch-hd">{ch.badge}</span>
                  </button>
                );
              })
            )}
          </div>

          <div className="tv-sidebar-foot">
            <ShieldCheck size={16} />
            <small>پخش پرسرعت و پایدار CDN با قابلیت تعویض سرور</small>
          </div>
        </div>
      </div>
    </div>
  );
}

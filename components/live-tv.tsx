'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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
  Layers
} from 'lucide-react';

declare global {
  interface Window {
    Hls?: any;
  }
}

export type TVChannel = {
  id: string;
  name: string;
  category: 'sports' | 'movies' | 'docs' | 'news' | 'kids' | 'general';
  logo: string;
  badge: string;
  description: string;
  streamUrl: string;
  epgCurrent: string;
  epgNext: string;
};

const TV_CHANNELS: TVChannel[] = [
  {
    id: 'tv3',
    name: 'شبکه سه سیما',
    category: 'sports',
    logo: '⚽',
    badge: 'HD',
    description: 'ورزش، فوتبال زنده لیگ برتر و اروپا، مسابقات و سریال‌های پرطرفدار',
    streamUrl: 'https://cdn1.telewebion.com/live/tv3/playlist.m3u8',
    epgCurrent: 'پخش زنده مسابقات ورزشی و فوتبال',
    epgNext: 'گزارش ورزشی و تحلیل لیگ',
  },
  {
    id: 'varzesh',
    name: 'شبکه ورزش',
    category: 'sports',
    logo: '🏆',
    badge: 'HD',
    description: 'پخش زنده تخصصی رویدادهای ورزشی ایران و جهان، کشتی و والیبال',
    streamUrl: 'https://cdn1.telewebion.com/live/varzesh/playlist.m3u8',
    epgCurrent: 'رویدادهای زنده ورزشی جهان',
    epgNext: 'شب‌های فوتبالی و دنیای ورزش',
  },
  {
    id: 'nasim',
    name: 'شبکه نسیم',
    category: 'movies',
    logo: '🎭',
    badge: 'HD',
    description: 'نشاط و سرگرمی خانوادگی، برنامه‌های کمدی و مسابقات طنز',
    streamUrl: 'https://cdn1.telewebion.com/live/nasim/playlist.m3u8',
    epgCurrent: 'مسابقه و سرگرمی خانوادگی',
    epgNext: 'برنامه طنز و موسیقی شبانه',
  },
  {
    id: 'mostanad',
    name: 'شبکه مستند',
    category: 'docs',
    logo: '🌿',
    badge: 'HD',
    description: 'مستندهای شگفت‌انگیز حیات وحش، تاریخ، کهکشان و فناوری با کیفیت بالا',
    streamUrl: 'https://cdn1.telewebion.com/live/mostanad/playlist.m3u8',
    epgCurrent: 'مستند شگفتی‌های خلقت و طبیعت',
    epgNext: 'مستند کاوشگران فضا و فناوری',
  },
  {
    id: 'ifilm',
    name: 'شبکه آی‌فیلم',
    category: 'movies',
    logo: '🎬',
    badge: 'HD',
    description: 'سریال‌ها و فیلم‌های ماندگار سینمای ایران و خاطره‌انگیزترین آثار تلویزیونی',
    streamUrl: 'https://cdn1.telewebion.com/live/ifilm/playlist.m3u8',
    epgCurrent: 'سریال داستانی و اجتماعی',
    epgNext: 'فیلم سینمایی برگزیده',
  },
  {
    id: 'namayesh',
    name: 'شبکه نمایش',
    category: 'movies',
    logo: '🍿',
    badge: 'HD',
    description: 'فیلم‌های سینمایی برتر جهان، هالیوود و سینمای کلاسیک',
    streamUrl: 'https://cdn1.telewebion.com/live/namayesh/playlist.m3u8',
    epgCurrent: 'فیلم سینمایی منتخب جهان',
    epgNext: 'سینمای کلاسیک و شاهکارهای برتر',
  },
  {
    id: 'irinn',
    name: 'شبکه خبر',
    category: 'news',
    logo: '📰',
    badge: 'HD',
    description: 'پوشش زنده و ۲۴ ساعته رویدادها و اخبار سیاسی، اقتصادی و بین‌المللی',
    streamUrl: 'https://cdn1.telewebion.com/live/irinn/playlist.m3u8',
    epgCurrent: 'بخش خبری و گزارش تحلیلی',
    epgNext: 'گفتگوی ویژه خبری و اقتصاد',
  },
  {
    id: 'tv1',
    name: 'شبکه یک سیما',
    category: 'general',
    logo: '🇮🇷',
    badge: 'HD',
    description: 'شبکه ملی؛ اخبار، برنامه‌های گفتگومحور، مستند و سریال‌های فاخر',
    streamUrl: 'https://cdn1.telewebion.com/live/tv1/playlist.m3u8',
    epgCurrent: 'برنامه فرهنگی و اجتماعی صبحگاهی',
    epgNext: 'اخبار سراسری ساعت ۱۴',
  },
  {
    id: 'pooya',
    name: 'شبکه پویا و نهال',
    category: 'kids',
    logo: '🎈',
    badge: 'HD',
    description: 'کارتون‌ها، انیمیشن‌های آموزنده و برنامه‌های شاد ویژه کودک و نوجوان',
    streamUrl: 'https://cdn1.telewebion.com/live/pooya/playlist.m3u8',
    epgCurrent: 'انیمیشن‌های جذاب و سرگرم‌کننده',
    epgNext: 'برنامه شاد کودکانه و قصه',
  },
  {
    id: 'amoozesh',
    name: 'شبکه آموزش',
    category: 'docs',
    logo: '📚',
    badge: 'HD',
    description: 'آموزش مهارت‌های زندگی، دروس دانشگاهی، کنکور و رشد شخصی',
    streamUrl: 'https://cdn1.telewebion.com/live/amoozesh/playlist.m3u8',
    epgCurrent: 'آموزش مهارت و توسعه فردی',
    epgNext: 'کلاس‌های درس و مباحث علمی',
  },
  {
    id: 'tv4',
    name: 'شبکه چهار (فرهیختگان)',
    category: 'docs',
    logo: '🔬',
    badge: 'HD',
    description: 'علم، فلسفه، اندیشه، ادبیات و برنامه‌های تخصصی دانشگاهی',
    streamUrl: 'https://cdn1.telewebion.com/live/tv4/playlist.m3u8',
    epgCurrent: 'برنامه علمی و معرفتی تخصصی',
    epgNext: 'سینما چهار و تحلیل فلسفی',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'همه شبکه‌ها', icon: Layers },
  { id: 'sports', label: 'ورزش و فوتبال', icon: Dumbbell },
  { id: 'movies', label: 'فیلم و سرگرمی', icon: Film },
  { id: 'docs', label: 'مستند و دانش', icon: Compass },
  { id: 'news', label: 'اخبار و رویدادها', icon: Newspaper },
  { id: 'kids', label: 'کودک و نوجوان', icon: Smile },
];

export default function LiveTV() {
  const [selectedChannel, setSelectedChannel] = useState<TVChannel>(TV_CHANNELS[0]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(['tv3', 'varzesh', 'mostanad']);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const hlsInstanceRef = useRef<any>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('roshna-tv-favorites') || '[]');
      if (Array.isArray(saved) && saved.length > 0) setFavorites(saved);
    } catch {
      /* ignore */
    }
  }, []);

  // Ensure HLS.js script is loaded
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.Hls) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.8/dist/hls.min.js';
      script.async = true;
      script.onload = () => {
        loadChannel(selectedChannel);
      };
      document.head.appendChild(script);
    }
  }, []);

  const toggleFavorite = (channelId: string) => {
    const next = favorites.includes(channelId)
      ? favorites.filter((id) => id !== channelId)
      : [...favorites, channelId];
    setFavorites(next);
    try {
      localStorage.setItem('roshna-tv-favorites', JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  // Setup HLS Player
  const loadChannel = useCallback((channel: TVChannel) => {
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setHasError(false);

    if (hlsInstanceRef.current) {
      hlsInstanceRef.current.destroy();
      hlsInstanceRef.current = null;
    }

    const HlsLib = window.Hls;

    if (HlsLib && HlsLib.isSupported()) {
      const hls = new HlsLib({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });

      hls.loadSource(channel.streamUrl);
      hls.attachMedia(video);

      hls.on(HlsLib.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().then(() => setIsPlaying(true)).catch(() => {
          setIsPlaying(false);
        });
      });

      hls.on(HlsLib.Events.ERROR, (_event: any, data: any) => {
        if (data.fatal) {
          switch (data.type) {
            case HlsLib.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case HlsLib.ErrorTypes.MEDIA_ERROR:
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
      video.src = channel.streamUrl;
      video.onloadedmetadata = () => {
        setIsLoading(false);
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      };
      video.onerror = () => {
        setHasError(true);
        setIsLoading(false);
      };
    } else {
      // If HlsLib is not yet loaded, wait 500ms and retry
      setTimeout(() => {
        if (window.Hls) {
          loadChannel(channel);
        } else {
          setHasError(true);
          setIsLoading(false);
        }
      }, 600);
    }
  }, []);

  useEffect(() => {
    loadChannel(selectedChannel);
    return () => {
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
    };
  }, [selectedChannel, loadChannel]);

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

  const filteredChannels = TV_CHANNELS.filter(
    (ch) => categoryFilter === 'all' || ch.category === categoryFilter
  );

  return (
    <div className="tv-hub-container" dir="rtl">
      {/* Hero Header */}
      <header className="tv-hero-header">
        <div className="tv-hero-info">
          <span className="tv-eyebrow">
            <Radio size={16} /> تلویزیون اینترنتی زنده روشنا
          </span>
          <h1>پخش زنده شبکه‌های سراسری</h1>
          <p>
            تماشای بدون وقفه و با کیفیت بالای شبکه‌های ملی، ورزشی، فیلم و مستند بدون نیاز به فیلترشکن.
          </p>
        </div>
        <div className="tv-hero-badge">
          <div className="tv-live-pill">
            <span className="tv-pulse-dot" />
            <strong>پخش زنده HLS</strong>
          </div>
          <small>ترافیک نیم‌بهاء داخلی</small>
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
              onClick={togglePlay}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />

            {/* Overlay Loading / Error */}
            {isLoading && (
              <div className="tv-player-overlay">
                <RefreshCw size={36} className="tv-spin" />
                <span>در حال دریافت سیگنال پخش زنده...</span>
              </div>
            )}

            {hasError && (
              <div className="tv-player-overlay error">
                <Tv size={42} />
                <strong>سیگنال موقتاً قطع است</strong>
                <p>کانال دیگری را انتخاب کنید یا دوباره تلاش فرمایید.</p>
                <button type="button" className="g-btn primary" onClick={() => loadChannel(selectedChannel)}>
                  <RefreshCw size={15} /> تلاش مجدد
                </button>
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
                  <strong>{selectedChannel.name}</strong>
                  <span className="tv-live-tag">زنده</span>
                </div>
              </div>

              <div className="tv-controls-right">
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
              <span className="tv-det-badge">{selectedChannel.badge}</span>
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
            {filteredChannels.map((ch) => {
              const isSelected = selectedChannel.id === ch.id;
              const isFav = favorites.includes(ch.id);
              return (
                <button
                  key={ch.id}
                  type="button"
                  className={`tv-ch-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedChannel(ch)}
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
            })}
          </div>

          <div className="tv-sidebar-foot">
            <ShieldCheck size={16} />
            <small>پخش مستقیم از CDN بدون قطعی</small>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Radio,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  CloudRain,
  Flame,
  Waves,
  Trees,
  Wind,
  Bell,
  Clock,
  Coffee,
  Moon,
  Compass,
  Headphones,
  RotateCcw,
  Sliders
} from 'lucide-react';
import { faNumber as n } from '@/lib/growth-data';

interface RadioStation {
  id: string;
  name: string;
  tag: string;
  logo: string;
  desc: string;
  streamUrl: string;
  tone: string;
}

const STATIONS: RadioStation[] = [
  {
    id: 'lofi',
    name: 'لوفای چیل و مطالعه (Lofi Study Beats)',
    tag: 'تمرکز و کار',
    logo: '☕',
    desc: 'ریتم‌های آرامش‌بخش لوفای هیپ‌هاپ برای باز کردن ذهن، مطالعه عمیق و برنامه‌نویسی',
    streamUrl: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
    tone: 'blue',
  },
  {
    id: 'meditation',
    name: 'مدیتیشن ۴۳۲Hz و نوای طبیعت (Deep Zen)',
    tag: 'آرامش عمیق',
    logo: '🧘',
    desc: 'فرکانس‌های ۴۳۲ هرتز، امواج تتا و زنگ‌های تبتی برای کاهش فوری استرس و خواب آرام',
    streamUrl: 'https://stream.zeno.fm/75nswy9f4h8uv',
    tone: 'mint',
  },
  {
    id: 'piano',
    name: 'پیانوی آرام و شبانه (Acoustic Piano)',
    tag: 'تک‌نوازی و ذن',
    logo: '🎹',
    desc: 'ملودی‌های لطیف پیانو و سازهای زهی کلاسیک برای همراهی لحظات تفکر و نوشتن',
    streamUrl: 'https://stream.zeno.fm/0r0xa792kwzuv',
    tone: 'purple',
  },
  {
    id: 'ambient',
    name: 'امبینت فضایی و کیهانی (Space Ambient)',
    tag: 'الهام‌بخش',
    logo: '🌌',
    desc: 'صداهای ژرف و بی‌پایان کیهان برای گسترش آگاهی، رویاپردازی و ریلکسیشن',
    streamUrl: 'https://stream.zeno.fm/w062e73k2h8uv',
    tone: 'gold',
  },
];

interface AmbientSound {
  id: string;
  name: string;
  icon: any;
  volume: number;
}

export default function RadioHub() {
  const [activeTab, setActiveTab] = useState<'stations' | 'mixer'>('stations');
  const [selectedStation, setSelectedStation] = useState<RadioStation>(STATIONS[0]);
  const [isStationPlaying, setIsStationPlaying] = useState(false);
  const [stationVolume, setStationVolume] = useState(0.7);
  const [isStationMuted, setIsStationMuted] = useState(false);
  const [stationLoading, setStationLoading] = useState(false);

  // Soundscape Mixer Channels
  const [ambientSounds, setAmbientSounds] = useState<AmbientSound[]>([
    { id: 'rain', name: 'باران ملایم', icon: CloudRain, volume: 0 },
    { id: 'fire', name: 'شومینه هیزمی', icon: Flame, volume: 0 },
    { id: 'ocean', name: 'امواج دریا', icon: Waves, volume: 0 },
    { id: 'birds', name: 'پرندگان جنگل', icon: Trees, volume: 0 },
    { id: 'wind', name: 'وزش باد شبانه', icon: Wind, volume: 0 },
    { id: 'bowl', name: 'کاسه تبتی و زنگ', icon: Bell, volume: 0 },
  ]);

  // Sleep Timer
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimeRemaining, setSleepTimeRemaining] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthNodesRef = useRef<{ [key: string]: { gain: GainNode; source: any } }>({});

  // Initialize Web Audio Synthesizers for Ambient Sounds
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const createNoiseBuffer = (ctx: AudioContext, type: 'white' | 'pink' | 'brown') => {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'white') {
        output[i] = white * 0.3;
      } else if (type === 'pink') {
        const b0 = 0.99886 * lastOut + white * 0.0555179;
        lastOut = b0;
        output[i] = b0 * 0.6;
      } else {
        // Brown noise
        lastOut = (lastOut + 0.02 * white) / 1.02;
        output[i] = lastOut * 1.5;
      }
    }
    return buffer;
  };

  const updateSoundVolume = (soundId: string, vol: number) => {
    setAmbientSounds((prev) =>
      prev.map((s) => (s.id === soundId ? { ...s, volume: vol } : s))
    );

    const ctx = getAudioContext();
    if (!ctx) return;

    if (!synthNodesRef.current[soundId]) {
      if (vol === 0) return;
      // Build sound generator
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.connect(ctx.destination);

      if (soundId === 'rain') {
        const src = ctx.createBufferSource();
        src.buffer = createNoiseBuffer(ctx, 'pink');
        src.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1200;
        src.connect(filter);
        filter.connect(gain);
        src.start();
        synthNodesRef.current[soundId] = { gain, source: src };
      } else if (soundId === 'ocean') {
        const src = ctx.createBufferSource();
        src.buffer = createNoiseBuffer(ctx, 'brown');
        src.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;

        // LFO for wave modulation
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 0.12; // wave cycle ~8 seconds
        lfoGain.gain.value = 350;
        lfo.connect(filter.frequency);
        lfo.start();

        src.connect(filter);
        filter.connect(gain);
        src.start();
        synthNodesRef.current[soundId] = { gain, source: src };
      } else if (soundId === 'fire') {
        const src = ctx.createBufferSource();
        src.buffer = createNoiseBuffer(ctx, 'pink');
        src.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 3;
        src.connect(filter);
        filter.connect(gain);
        src.start();
        synthNodesRef.current[soundId] = { gain, source: src };
      } else if (soundId === 'wind') {
        const src = ctx.createBufferSource();
        src.buffer = createNoiseBuffer(ctx, 'pink');
        src.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 320;
        filter.Q.value = 1.5;

        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.2;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 200;
        lfo.connect(filter.frequency);
        lfo.start();

        src.connect(filter);
        filter.connect(gain);
        src.start();
        synthNodesRef.current[soundId] = { gain, source: src };
      } else if (soundId === 'bowl') {
        // Tibetan harmonic chime
        const osc = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc.type = 'sine';
        osc2.type = 'sine';
        osc.frequency.value = 216; // 432 / 2
        osc2.frequency.value = 432;
        const subGain = ctx.createGain();
        subGain.gain.value = 0.3;
        osc2.connect(subGain);
        subGain.connect(gain);
        osc.connect(gain);
        osc.start();
        osc2.start();
        synthNodesRef.current[soundId] = { gain, source: osc };
      } else if (soundId === 'birds') {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 2800;
        osc.connect(gain);
        osc.start();
        synthNodesRef.current[soundId] = { gain, source: osc };
      }
    }

    const node = synthNodesRef.current[soundId];
    if (node) {
      node.gain.gain.linearRampToValueAtTime(vol * 0.35, ctx.currentTime + 0.1);
    }
  };

  const applyPreset = (preset: 'rainy_cafe' | 'cabin' | 'ocean_zen' | 'deep_study') => {
    const zeroed = [
      { id: 'rain', name: 'باران ملایم', icon: CloudRain, volume: 0 },
      { id: 'fire', name: 'شومینه هیزمی', icon: Flame, volume: 0 },
      { id: 'ocean', name: 'امواج دریا', icon: Waves, volume: 0 },
      { id: 'birds', name: 'پرندگان جنگل', icon: Trees, volume: 0 },
      { id: 'wind', name: 'وزش باد شبانه', icon: Wind, volume: 0 },
      { id: 'bowl', name: 'کاسه تبتی و زنگ', icon: Bell, volume: 0 },
    ];

    if (preset === 'rainy_cafe') {
      zeroed.find((s) => s.id === 'rain')!.volume = 0.65;
      zeroed.find((s) => s.id === 'fire')!.volume = 0.35;
    } else if (preset === 'cabin') {
      zeroed.find((s) => s.id === 'wind')!.volume = 0.5;
      zeroed.find((s) => s.id === 'fire')!.volume = 0.6;
      zeroed.find((s) => s.id === 'birds')!.volume = 0.2;
    } else if (preset === 'ocean_zen') {
      zeroed.find((s) => s.id === 'ocean')!.volume = 0.7;
      zeroed.find((s) => s.id === 'bowl')!.volume = 0.3;
    } else if (preset === 'deep_study') {
      zeroed.find((s) => s.id === 'rain')!.volume = 0.45;
      zeroed.find((s) => s.id === 'bowl')!.volume = 0.2;
    }

    zeroed.forEach((s) => updateSoundVolume(s.id, s.volume));
  };

  const resetMixer = () => {
    ambientSounds.forEach((s) => updateSoundVolume(s.id, 0));
  };

  // Sleep Timer countdown effect
  useEffect(() => {
    if (sleepTimerMinutes === null) return;
    setSleepTimeRemaining(sleepTimerMinutes * 60);

    const interval = setInterval(() => {
      setSleepTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          // Time is up -> Stop all audio
          if (audioRef.current) audioRef.current.pause();
          setIsStationPlaying(false);
          resetMixer();
          setSleepTimerMinutes(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerMinutes]);

  // Clean up Web Audio and HTML5 audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        try {
          audioCtxRef.current.close();
        } catch {}
      }
    };
  }, []);

  const toggleStationPlay = (station = selectedStation) => {
    if (!audioRef.current) {
      audioRef.current = new Audio(station.streamUrl);
    }

    if (selectedStation.id !== station.id) {
      setSelectedStation(station);
      audioRef.current.src = station.streamUrl;
      setStationLoading(true);
      audioRef.current
        .play()
        .then(() => {
          setIsStationPlaying(true);
          setStationLoading(false);
        })
        .catch(() => {
          setIsStationPlaying(false);
          setStationLoading(false);
        });
      return;
    }

    if (isStationPlaying) {
      audioRef.current.pause();
      setIsStationPlaying(false);
    } else {
      setStationLoading(true);
      audioRef.current
        .play()
        .then(() => {
          setIsStationPlaying(true);
          setStationLoading(false);
        })
        .catch(() => {
          setIsStationPlaying(false);
          setStationLoading(false);
        });
    }
  };

  const handleStationVolume = (val: number) => {
    setStationVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
      setIsStationMuted(val === 0);
    }
  };

  const isAnyMixerActive = ambientSounds.some((s) => s.volume > 0);

  return (
    <div className="rd-hub-container" dir="rtl">
      {/* Header */}
      <header className="rd-hero-header">
        <div className="rd-hero-info">
          <span className="rd-eyebrow">
            <Radio size={16} /> رادیو آرامش، لوفای و اصوات طبیعت
          </span>
          <h1>نوای سکون و کار عمیق</h1>
          <p>
            موسیقی‌های پیوسته لوفای، فرکانس‌های ذهن‌آگاهی و میکسر اصوات باران و طبیعت برای تمرکز، مطالعه و خواب آرام.
          </p>
        </div>
        <div className="rd-hero-badge">
          <div className="rd-live-pill">
            <span className={`rd-pulse-dot ${isStationPlaying || isAnyMixerActive ? 'active' : ''}`} />
            <strong>{isStationPlaying || isAnyMixerActive ? 'در حال پخش زنده' : 'آماده برای پخش'}</strong>
          </div>
          <small>صوت‌های سنتز‌شده آفلاین</small>
        </div>
      </header>

      {/* Tabs */}
      <div className="rd-nav-tabs">
        <button
          type="button"
          className={`rd-tab-btn ${activeTab === 'stations' ? 'active' : ''}`}
          onClick={() => setActiveTab('stations')}
        >
          <Headphones size={16} />
          <span>ایستگاه‌های رادیو آنلاین</span>
        </button>
        <button
          type="button"
          className={`rd-tab-btn ${activeTab === 'mixer' ? 'active' : ''}`}
          onClick={() => setActiveTab('mixer')}
        >
          <Sliders size={16} />
          <span>میکسر اصوات طبیعت (آفلاین)</span>
        </button>
      </div>

      {/* Tab 1: Live Radio Stations */}
      {activeTab === 'stations' && (
        <div className="rd-stations-grid">
          {/* Main Active Station Card */}
          <div className="rd-player-card">
            <div className="rd-card-visual">
              <div className={`rd-soundwave-circle ${isStationPlaying ? 'playing' : ''}`}>
                <span className="rd-station-logo">{selectedStation.logo}</span>
              </div>
              <div className="rd-station-text">
                <span className="g-tag">{selectedStation.tag}</span>
                <h2>{selectedStation.name}</h2>
                <p>{selectedStation.desc}</p>
              </div>
            </div>

            {/* Controls */}
            <div className="rd-player-controls">
              <button
                type="button"
                className="g-btn primary rd-play-main-btn"
                onClick={() => toggleStationPlay(selectedStation)}
              >
                {stationLoading ? (
                  <span>در حال اتصال…</span>
                ) : isStationPlaying ? (
                  <>
                    <Pause size={20} />
                    <span>توقف رادیو</span>
                  </>
                ) : (
                  <>
                    <Play size={20} />
                    <span>شروع پخش</span>
                  </>
                )}
              </button>

              <div className="rd-volume-slider-box">
                <button
                  type="button"
                  className="g-icon-btn"
                  onClick={() => {
                    const next = !isStationMuted;
                    setIsStationMuted(next);
                    if (audioRef.current) audioRef.current.muted = next;
                  }}
                >
                  {isStationMuted || stationVolume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isStationMuted ? 0 : stationVolume}
                  onChange={(e) => handleStationVolume(parseFloat(e.target.value))}
                  aria-label="بلندی صدای رادیو"
                />
              </div>
            </div>
          </div>

          {/* Stations Selector List */}
          <div className="rd-stations-list">
            <h3>انتخاب ایستگاه رادیویی</h3>
            <div className="rd-list-stack">
              {STATIONS.map((st) => {
                const isSelected = selectedStation.id === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    className={`rd-station-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleStationPlay(st)}
                  >
                    <span className="rd-st-icon">{st.logo}</span>
                    <div className="rd-st-info">
                      <div className="rd-st-title-row">
                        <strong>{st.name}</strong>
                        <span className="rd-st-tag">{st.tag}</span>
                      </div>
                      <small>{st.desc}</small>
                    </div>
                    {isSelected && isStationPlaying && <span className="rd-playing-indicator">● زنده</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Ambient Soundscape Mixer */}
      {activeTab === 'mixer' && (
        <div className="rd-mixer-section">
          {/* Presets Row */}
          <div className="rd-presets-bar">
            <strong>حال‌وهوای پیشنهادی:</strong>
            <button type="button" className="rd-preset-chip" onClick={() => applyPreset('rainy_cafe')}>
              <Coffee size={14} /> کافه بارانی
            </button>
            <button type="button" className="rd-preset-chip" onClick={() => applyPreset('cabin')}>
              <Flame size={14} /> کلبه جنگلی
            </button>
            <button type="button" className="rd-preset-chip" onClick={() => applyPreset('ocean_zen')}>
              <Waves size={14} /> ساحل آرامش
            </button>
            <button type="button" className="rd-preset-chip" onClick={() => applyPreset('deep_study')}>
              <Sparkles size={14} /> تمرکز مطالعه
            </button>
            {isAnyMixerActive && (
              <button type="button" className="rd-preset-chip reset" onClick={resetMixer}>
                <RotateCcw size={14} /> خاموش کردن همه
              </button>
            )}
          </div>

          {/* Sound Sliders Grid */}
          <div className="rd-mixer-grid">
            {ambientSounds.map((snd) => {
              const Icon = snd.icon;
              const isActive = snd.volume > 0;
              return (
                <div key={snd.id} className={`rd-sound-card ${isActive ? 'active' : ''}`}>
                  <div className="rd-sound-header">
                    <div className="rd-sound-icon-box">
                      <Icon size={22} />
                    </div>
                    <div className="rd-sound-title">
                      <strong>{snd.name}</strong>
                      <small>{isActive ? `${n(Math.round(snd.volume * 100))}٪` : 'خاموش'}</small>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={snd.volume}
                    onChange={(e) => updateSoundVolume(snd.id, parseFloat(e.target.value))}
                    className="rd-mixer-slider"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sleep Timer Drawer */}
      <footer className="rd-sleep-footer">
        <div className="rd-sleep-left">
          <Clock size={18} />
          <strong>تایمر خواب:</strong>
          <span>
            {sleepTimeRemaining !== null
              ? `${n(Math.floor(sleepTimeRemaining / 60))}:${n(sleepTimeRemaining % 60).padStart(2, '۰')} باقی‌مانده`
              : 'غیرفعال'}
          </span>
        </div>
        <div className="rd-sleep-options">
          {[15, 30, 45, 60].map((mins) => (
            <button
              key={mins}
              type="button"
              className={`rd-sleep-btn ${sleepTimerMinutes === mins ? 'active' : ''}`}
              onClick={() => setSleepTimerMinutes(sleepTimerMinutes === mins ? null : mins)}
            >
              {n(mins)} دقیقه
            </button>
          ))}
          {sleepTimerMinutes !== null && (
            <button type="button" className="rd-sleep-btn cancel" onClick={() => setSleepTimerMinutes(null)}>
              لغو تایمر
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

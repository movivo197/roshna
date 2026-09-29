'use client';

import { useState, useEffect } from 'react';
import {
  Trophy,
  Award,
  Sparkles,
  Flame,
  Star,
  CheckCircle2,
  Calendar,
  Zap,
  Target,
  BookOpen,
  Heart,
  Smile,
  ShieldCheck,
  Compass,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { faNumber as n, type GrowthData } from '@/lib/growth-data';

interface Props {
  data: GrowthData;
  notify?: (msg: string) => void;
}

interface BadgeDef {
  id: string;
  title: string;
  desc: string;
  category: 'habit' | 'focus' | 'mind' | 'task';
  icon: string;
  isUnlocked: (data: GrowthData) => boolean;
  getProgress: (data: GrowthData) => { current: number; total: number; unit: string };
}

const BADGES: BadgeDef[] = [
  {
    id: 'first_task',
    title: 'نخستین گام',
    desc: 'تکمیل اولین وظیفه در برنامه‌ریزی روزانه',
    category: 'task',
    icon: '🌱',
    isUnlocked: (d) => d.tasks.some((t) => t.done),
    getProgress: (d) => ({ current: d.tasks.filter((t) => t.done).length, total: 1, unit: 'تسک' }),
  },
  {
    id: 'tasks_10',
    title: 'انضباط پولادین',
    desc: 'تکمیل حداقل ۱۰ وظیفه و کار روزانه',
    category: 'task',
    icon: '🛡️',
    isUnlocked: (d) => d.tasks.filter((t) => t.done).length >= 10,
    getProgress: (d) => ({ current: d.tasks.filter((t) => t.done).length, total: 10, unit: 'تسک' }),
  },
  {
    id: 'tasks_50',
    title: 'فرمانروای عملگرایی',
    desc: 'تکمیل ۵۰ وظیفه با پیوستگی و اقتدار',
    category: 'task',
    icon: '👑',
    isUnlocked: (d) => d.tasks.filter((t) => t.done).length >= 50,
    getProgress: (d) => ({ current: d.tasks.filter((t) => t.done).length, total: 50, unit: 'تسک' }),
  },
  {
    id: 'first_habit',
    title: 'بذر استمرار',
    desc: 'ثبت اولین روز از عادت‌های روزانه',
    category: 'habit',
    icon: '🔥',
    isUnlocked: (d) => d.habits.some((h) => h.days.length > 0),
    getProgress: (d) => ({
      current: d.habits.reduce((acc, h) => acc + h.days.length, 0),
      total: 1,
      unit: 'روز',
    }),
  },
  {
    id: 'streak_7',
    title: 'زنجیره طلایی ۷ روزه',
    desc: 'پیوستگی در یک عادت به مدت ۷ روز متوالی',
    category: 'habit',
    icon: '⚡',
    isUnlocked: (d) => d.habits.some((h) => h.days.length >= 7),
    getProgress: (d) => ({
      current: Math.max(0, ...d.habits.map((h) => h.days.length), 0),
      total: 7,
      unit: 'روز',
    }),
  },
  {
    id: 'streak_21',
    title: 'تثبیت هویت تازه',
    desc: '۲۱ روز استمرار برای ساخت یک عادت ریشه‌دار',
    category: 'habit',
    icon: '💎',
    isUnlocked: (d) => d.habits.some((h) => h.days.length >= 21),
    getProgress: (d) => ({
      current: Math.max(0, ...d.habits.map((h) => h.days.length), 0),
      total: 21,
      unit: 'روز',
    }),
  },
  {
    id: 'focus_60',
    title: 'غوطه‌وری در کار عمیق',
    desc: 'ثبت حداقل ۶۰ دقیقه تمرکز عمیق بدون حواس‌پرتی',
    category: 'focus',
    icon: '🎯',
    isUnlocked: (d) => d.focus.reduce((sum, f) => sum + f.minutes, 0) >= 60,
    getProgress: (d) => ({
      current: d.focus.reduce((sum, f) => sum + f.minutes, 0),
      total: 60,
      unit: 'دقیقه',
    }),
  },
  {
    id: 'focus_300',
    title: 'استاد فلو استیت (Flow)',
    desc: 'ثبت بیش از ۳۰۰ دقیقه تمرکز خالص و خلاقانه',
    category: 'focus',
    icon: '🧘',
    isUnlocked: (d) => d.focus.reduce((sum, f) => sum + f.minutes, 0) >= 300,
    getProgress: (d) => ({
      current: d.focus.reduce((sum, f) => sum + f.minutes, 0),
      total: 300,
      unit: 'دقیقه',
    }),
  },
  {
    id: 'first_journal',
    title: 'کاتب درون',
    desc: 'ثبت اولین احساس و ژورنال در دفتر خودشناسی',
    category: 'mind',
    icon: '✍️',
    isUnlocked: (d) => d.journal.length > 0,
    getProgress: (d) => ({ current: d.journal.length, total: 1, unit: 'یادداشت' }),
  },
  {
    id: 'journal_7',
    title: 'آینه بازتاب',
    desc: 'ثبت حداقل ۷ بار تأمل و قدردانی در دفتر روزانه',
    category: 'mind',
    icon: '🪞',
    isUnlocked: (d) => d.journal.length >= 7,
    getProgress: (d) => ({ current: d.journal.length, total: 7, unit: 'یادداشت' }),
  },
  {
    id: 'gadgets_master',
    title: 'کاشف آرامش و سکون',
    desc: 'انجام حداقل ۵ تمرین از گجت‌های ذهن و تنفس',
    category: 'mind',
    icon: '🌌',
    isUnlocked: (d) => (d.gadgets || []).length >= 5,
    getProgress: (d) => ({ current: (d.gadgets || []).length, total: 5, unit: 'تمرین' }),
  },
  {
    id: 'wheel_eval',
    title: 'معمار تعادل زندگی',
    desc: 'ارزیابی حوزه‌های ۸‌گانه در چرخه زندگی',
    category: 'mind',
    icon: '🎡',
    isUnlocked: (d) => Object.values(d.wheel || {}).some((v) => v > 0),
    getProgress: (d) => ({
      current: Object.values(d.wheel || {}).filter((v) => v > 0).length,
      total: 8,
      unit: 'بخش',
    }),
  },
];

interface Challenge {
  id: string;
  title: string;
  tag: string;
  icon: string;
  desc: string;
  dailyPrompt: string;
  totalDays: number;
}

const CHALLENGES: Challenge[] = [
  {
    id: 'morning_sun',
    title: 'چالش ۳۰ روزه سحرخیزی و روتین طلایی',
    tag: 'انرژی و نشاط',
    icon: '☀️',
    desc: 'بیداری پیش از ساعت ۷ صبح، نوشیدن یک لیوان آب، ۵ دقیقه تنفس هوای تازه و تحرک ملایم.',
    dailyPrompt: 'امروز به‌موقع بیدار شدم و صبحم را با آرامش و بدون چک کردن گوشی آغاز کردم.',
    totalDays: 30,
  },
  {
    id: 'gratitude_zen',
    title: 'چالش ۳۰ روزه ذهن‌آگاهی و شکرگزاری',
    tag: 'روانشناسی مثبت',
    icon: '🕊️',
    desc: 'ثبت هر روزه ۳ نقطه روشن و قدردانی از نعمات کوچک زندگی برای سیم‌کشی مجدد مغز به سوی آرامش.',
    dailyPrompt: 'امروز ۳ زیبایی یا اتفاق کوچک را دیدم و در دفترچه سپاسگزاری ثبت کردم.',
    totalDays: 30,
  },
  {
    id: 'deep_work',
    title: 'چالش ۳۰ روزه تمرکز عمیق (Deep Work)',
    tag: 'بهره‌وری و کار',
    icon: '⚡',
    desc: 'حداقل ۳۰ دقیقه کار عمیق و بدون وقفه روی مهم‌ترین پروژه روز با گوشی در حالت بی‌صدا.',
    dailyPrompt: 'یک بلوک تمرکز عمیق ۳۰ دقیقه‌ای بدون هیچ حواس‌پرتی را به پایان رساندم.',
    totalDays: 30,
  },
  {
    id: 'wellness_body',
    title: 'چالش ۳۰ روزه تندرستی و نوشیدن آب',
    tag: 'سلامت جسم',
    icon: '💧',
    desc: 'نوشیدن ۸ لیوان آب در طول روز، ۱۵ دقیقه پیاده‌روی یا ورزش هوازی و کشش عضلات.',
    dailyPrompt: 'به نیازهای بدنم توجه کردم، آب کافی نوشیدم و بدنم را به حرکت واداشتم.',
    totalDays: 30,
  },
];

export default function GamificationHub({ data, notify }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'challenges'>('overview');
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>(CHALLENGES[0].id);
  const [challengeProgress, setChallengeProgress] = useState<{ [key: string]: number[] }>({});

  // Load 30-Day challenges state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('roshna-30day-challenges-v1');
      if (saved) {
        setChallengeProgress(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const toggleDay = (challengeId: string, dayNum: number) => {
    setChallengeProgress((prev) => {
      const currentDays = prev[challengeId] || [];
      const nextDays = currentDays.includes(dayNum)
        ? currentDays.filter((d) => d !== dayNum)
        : [...currentDays, dayNum];

      const updated = { ...prev, [challengeId]: nextDays };
      try {
        localStorage.setItem('roshna-30day-challenges-v1', JSON.stringify(updated));
      } catch {}

      if (!currentDays.includes(dayNum) && notify) {
        notify(`روز ${n(dayNum)} از چالش با موفقیت تیک خورد! 🌟`);
      }
      return updated;
    });
  };

  // Calculate Total XP dynamically from real user engagement
  const tasksXP = data.tasks.filter((t) => t.done).length * 10;
  const habitsXP = data.habits.reduce((sum, h) => sum + h.days.length, 0) * 15;
  const journalXP = data.journal.length * 25;
  const gadgetsXP = (data.gadgets || []).length * 20;
  const focusXP = Math.floor(data.focus.reduce((sum, f) => sum + f.minutes, 0) * 1);
  const wheelXP = Object.values(data.wheel || {}).some((v) => v > 0) ? 50 : 0;

  const totalXP = tasksXP + habitsXP + journalXP + gadgetsXP + focusXP + wheelXP;

  // Level Progression Tiers
  const getLevelInfo = (xp: number) => {
    if (xp < 300) {
      return { level: 1, title: 'جوانه نور', icon: '🌱', nextXP: 300, currentTierXP: xp };
    } else if (xp < 800) {
      return { level: 2, title: 'نهال استمرار', icon: '🌿', nextXP: 800, currentTierXP: xp - 300 };
    } else if (xp < 1600) {
      return { level: 3, title: 'شاخه پایداری', icon: '🌳', nextXP: 1600, currentTierXP: xp - 800 };
    } else if (xp < 3200) {
      return { level: 4, title: 'درخت حکمت', icon: '🌲', nextXP: 3200, currentTierXP: xp - 1600 };
    } else if (xp < 6000) {
      return { level: 5, title: 'سرو کهنسال', icon: '🏔️', nextXP: 6000, currentTierXP: xp - 3200 };
    } else {
      return { level: 6, title: 'استاد آگاهی', icon: '👑', nextXP: 10000, currentTierXP: xp - 6000 };
    }
  };

  const currentLevel = getLevelInfo(totalXP);
  const unlockedBadgesCount = BADGES.filter((b) => b.isUnlocked(data)).length;
  const activeChallenge = CHALLENGES.find((c) => c.id === selectedChallengeId) || CHALLENGES[0];
  const activeCompletedDays = challengeProgress[activeChallenge.id] || [];

  return (
    <div className="gm-hub-container" dir="rtl">
      {/* Header */}
      <header className="gm-hero-header">
        <div className="gm-hero-info">
          <span className="gm-eyebrow">
            <Trophy size={16} /> باشگاه افتخارات و رشد فردی
          </span>
          <h1>سفر قهرمانی و سطح کاربری</h1>
          <p>
            هر تیک وظیفه، هر دقیقه تمرکز و هر مکث خودشناسی، امتیازی برای صعود به سطوح بالاتر آگاهی و کسب مدال‌های ماندگار است.
          </p>
        </div>
        <div className="gm-hero-badge">
          <div className="gm-live-pill">
            <span className="gm-pulse-dot" />
            <strong>سطح {n(currentLevel.level)}: {currentLevel.title}</strong>
          </div>
          <small>{n(totalXP)} امتیاز تجربه (XP)</small>
        </div>
      </header>

      {/* Tabs */}
      <div className="gm-nav-tabs">
        <button
          type="button"
          className={`gm-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <TrendingUp size={16} />
          <span>نمای کلی و سطح من</span>
        </button>
        <button
          type="button"
          className={`gm-tab-btn ${activeTab === 'badges' ? 'active' : ''}`}
          onClick={() => setActiveTab('badges')}
        >
          <Award size={16} />
          <span>تالار نشان‌ها ({n(unlockedBadgesCount)} از {n(BADGES.length)})</span>
        </button>
        <button
          type="button"
          className={`gm-tab-btn ${activeTab === 'challenges' ? 'active' : ''}`}
          onClick={() => setActiveTab('challenges')}
        >
          <Calendar size={16} />
          <span>چالش‌های ۳۰ روزه</span>
        </button>
      </div>

      {/* Tab 1: Level Overview */}
      {activeTab === 'overview' && (
        <div className="gm-overview-grid">
          {/* Level Progress Big Card */}
          <div className="gm-level-card">
            <div className="gm-level-top">
              <div className="gm-level-avatar">{currentLevel.icon}</div>
              <div className="gm-level-headings">
                <span className="g-tag">رتبه فعلی شما</span>
                <h2>سطح {n(currentLevel.level)}: {currentLevel.title}</h2>
                <p>برای رسیدن به سطح بعدی به {n(Math.max(0, currentLevel.nextXP - totalXP))} امتیاز دیگر نیاز دارید.</p>
              </div>
            </div>

            <div className="gm-xp-bar-box">
              <div className="gm-xp-meta">
                <span>{n(totalXP)} XP کسب‌شده</span>
                <span>هدف سطح بعد: {n(currentLevel.nextXP)} XP</span>
              </div>
              <div className="gm-xp-bar">
                <div
                  className="gm-xp-bar-fill"
                  style={{ width: `${Math.min(100, Math.round((totalXP / currentLevel.nextXP) * 100))}%` }}
                />
              </div>
            </div>

            {/* XP Breakdown Grid */}
            <div className="gm-xp-breakdown">
              <div className="gm-break-item">
                <CheckCircle2 size={16} className="gm-icon-gold" />
                <div>
                  <small>وظایف انجام‌شده</small>
                  <strong>+{n(tasksXP)} XP</strong>
                </div>
              </div>
              <div className="gm-break-item">
                <Flame size={16} className="gm-icon-mint" />
                <div>
                  <small>استمرار عادت‌ها</small>
                  <strong>+{n(habitsXP)} XP</strong>
                </div>
              </div>
              <div className="gm-break-item">
                <BookOpen size={16} className="gm-icon-blue" />
                <div>
                  <small>دفتر خودشناسی</small>
                  <strong>+{n(journalXP)} XP</strong>
                </div>
              </div>
              <div className="gm-break-item">
                <Sparkles size={16} className="gm-icon-purple" />
                <div>
                  <small>تمرینات گجت و آرامش</small>
                  <strong>+{n(gadgetsXP)} XP</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Badges Showcase */}
          <div className="gm-mini-badges-card">
            <div className="gm-card-head">
              <Award size={18} />
              <h3>تازه‌ترین نشان‌های قفل‌گشایی‌شده</h3>
            </div>
            <div className="gm-mini-badges-list">
              {BADGES.filter((b) => b.isUnlocked(data)).length === 0 ? (
                <div className="gm-empty-hint">
                  <span>🌱</span>
                  <p>هنوز نشانی کسب نکرده‌اید؛ با ثبت اولین تسک یا عادت، اولین مدال خود را بگیرید!</p>
                </div>
              ) : (
                BADGES.filter((b) => b.isUnlocked(data))
                  .slice(0, 4)
                  .map((b) => (
                    <div key={b.id} className="gm-mini-badge-item">
                      <span className="gm-badge-emoji">{b.icon}</span>
                      <div>
                        <strong>{b.title}</strong>
                        <small>{b.desc}</small>
                      </div>
                      <span className="gm-unlocked-badge">کسب شد</span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Badges Collection Hall */}
      {activeTab === 'badges' && (
        <div className="gm-badges-grid">
          {BADGES.map((badge) => {
            const unlocked = badge.isUnlocked(data);
            const progress = badge.getProgress(data);
            const pct = Math.min(100, Math.round((progress.current / progress.total) * 100));

            return (
              <div key={badge.id} className={`gm-badge-card ${unlocked ? 'unlocked' : 'locked'}`}>
                <div className="gm-badge-icon-wrap">
                  <span className="gm-badge-symbol">{badge.icon}</span>
                  {unlocked && <span className="gm-badge-star">★</span>}
                </div>
                <div className="gm-badge-info">
                  <strong>{badge.title}</strong>
                  <p>{badge.desc}</p>
                  <div className="gm-badge-progress-box">
                    <div className="gm-badge-bar">
                      <div className="gm-badge-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <small>
                      {unlocked
                        ? 'تکمیل و ثبت در کارنامه'
                        : `${n(progress.current)} از ${n(progress.total)} ${progress.unit}`}
                    </small>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: 30-Day Challenges */}
      {activeTab === 'challenges' && (
        <div className="gm-challenges-layout">
          {/* Challenge Selector Pills */}
          <div className="gm-ch-selector">
            {CHALLENGES.map((ch) => {
              const isSelected = selectedChallengeId === ch.id;
              const daysDone = (challengeProgress[ch.id] || []).length;
              return (
                <button
                  key={ch.id}
                  type="button"
                  className={`gm-ch-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedChallengeId(ch.id)}
                >
                  <span className="gm-ch-pill-icon">{ch.icon}</span>
                  <div className="gm-ch-pill-info">
                    <strong>{ch.title}</strong>
                    <small>{n(daysDone)} از ۳۰ روز تکمیل شده</small>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Challenge Interactive Board */}
          <div className="gm-challenge-board">
            <div className="gm-board-head">
              <div className="gm-board-title">
                <span className="gm-board-emoji">{activeChallenge.icon}</span>
                <div>
                  <span className="g-tag">{activeChallenge.tag}</span>
                  <h2>{activeChallenge.title}</h2>
                  <p>{activeChallenge.desc}</p>
                </div>
              </div>
              <div className="gm-board-stats">
                <strong>{n(activeCompletedDays.length)} / ۳۰ روز</strong>
                <div className="gm-ring-pct">
                  {n(Math.round((activeCompletedDays.length / 30) * 100))}٪
                </div>
              </div>
            </div>

            {/* 30 Days Matrix */}
            <div className="gm-days-matrix">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((dayNum) => {
                const isDone = activeCompletedDays.includes(dayNum);
                return (
                  <button
                    key={dayNum}
                    type="button"
                    className={`gm-day-tile ${isDone ? 'is-done' : ''}`}
                    onClick={() => toggleDay(activeChallenge.id, dayNum)}
                    title={`روز ${n(dayNum)}: برای تیک زدن یا برداشتن کلیک کنید`}
                  >
                    <span className="gm-day-num">{n(dayNum)}</span>
                    <span className="gm-day-status">{isDone ? '✓' : 'روز'}</span>
                  </button>
                );
              })}
            </div>

            <div className="gm-board-foot">
              <ShieldCheck size={16} />
              <small>پیوستگی در ۳۰ روز، مسیرهای عصبی مغز را برای رفتار تازه تثبیت می‌کند.</small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

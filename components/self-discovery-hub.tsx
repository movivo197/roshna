'use client';

import { useState } from 'react';
import {
  Sparkles, Compass, BookOpen, Flame, Heart, Star,
  Award, ArrowLeft, Check, Layers, User, Calendar,
  Globe, HelpCircle, RefreshCw, Feather, Sliders, Play,
  ChevronLeft, ShieldCheck, Sun, Moon, Target, Activity
} from 'lucide-react';
import { useSelfDiscoveryState, type EmotionId } from '@/lib/self-discovery/state';
import {
  JOURNEYS, DIVINE_NAMES, ASSESSMENTS, ACHIEVEMENTS,
  EMOTIONS, DEEP_QUESTIONS, DAILY_PRACTICES, getLevelDef, getNextLevel
} from '@/lib/self-discovery/content';
import type { DailySession, Assessment, DailyPracticeItem } from '@/lib/self-discovery/types';

// Sub-components
import SessionRunner from './self-discovery/session-runner';
import DivineAtlas from './self-discovery/divine-atlas';
import ValuesGame from './self-discovery/values-game';
import AssessmentRunner from './self-discovery/assessment-runner';
import JournalView from './self-discovery/journal-view';
import PracticePlayer from './self-discovery/practice-player';

type ActiveTab = 'today' | 'journeys' | 'atlas' | 'lab' | 'journal' | 'profile';

export default function SelfDiscoveryHub() {
  const {
    state,
    loaded,
    addXp,
    completeActivity,
    completeSession,
    saveJournal,
    saveEmotion,
    saveAssessment,
    toggleSaved,
    markLearned,
    saveValues,
    setSessionStep,
    unlockAchievement,
    setActiveJourney,
  } = useSelfDiscoveryState();

  const [activeTab, setActiveTab] = useState<ActiveTab>('today');

  // Active Interactive Sessions
  const [runningSession, setRunningSession] = useState<DailySession | null>(null);
  const [runningAssessment, setRunningAssessment] = useState<Assessment | null>(null);
  const [isPlayingValuesGame, setIsPlayingValuesGame] = useState(false);

  // Quick Emotion state for Dashboard
  const [todayQuickEmotion, setTodayQuickEmotion] = useState<EmotionId | null>(null);

  // Practice state
  const [selectedPractice, setSelectedPractice] = useState<DailyPracticeItem | null>(null);
  const [practiceDoneToday, setPracticeDoneToday] = useState(false);

  // Journey filter category
  const [journeyCategory, setJourneyCategory] = useState<'all' | 'psych' | 'meaning' | 'virtue'>('all');

  if (!loaded) {
    return (
      <div className="sdhub-loading" dir="rtl">
        <Sparkles size={36} className="sd-finish-sparkle" />
        <p>در حال آماده‌سازی فضای آرامش و خودشناسی…</p>
      </div>
    );
  }

  // Current Level and Next Level calculations
  const levelInfo = getLevelDef(state.level);
  const nextLevel = getNextLevel(state.level);
  const xpInCurrentLevel = state.xp - levelInfo.minXp;
  const xpNeededForNext = nextLevel ? nextLevel.minXp - levelInfo.minXp : 1000;
  const levelProgressPct = nextLevel
    ? Math.min(100, Math.max(5, (xpInCurrentLevel / xpNeededForNext) * 100))
    : 100;

  // Active Journey and Today's Session
  const activeJourney = JOURNEYS.find(j => j.id === state.activeJourneyId) || JOURNEYS[0];
  const activeDayIndex = state.journeyProgress[activeJourney.id] || 0;
  const todaySession = activeJourney.sessions[Math.min(activeDayIndex, activeJourney.sessions.length - 1)];
  const isTodaySessionDone = state.completedSessions.includes(todaySession.id);

  // Discovery of the Day & Practice of the Day
  const todayKeyStr = new Date().toISOString().slice(0, 10);
  const dayHash = [...todayKeyStr].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const discoveryOfTheDay = DIVINE_NAMES[dayHash % DIVINE_NAMES.length];
  const practiceOfTheDay = DAILY_PRACTICES[dayHash % DAILY_PRACTICES.length];

  return (
    <div className="sd-hub-universe" dir="rtl">
      {/* ── TOP APP BAR NAVIGATION ── */}
      <nav className="sd-main-tabs-nav" aria-label="بخش‌های خودشناسی و خداشناسی">
        <button
          className={`sd-tab-btn ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          <Compass size={16} />
          <span>امروز من</span>
        </button>

        <button
          className={`sd-tab-btn ${activeTab === 'journeys' ? 'active' : ''}`}
          onClick={() => setActiveTab('journeys')}
        >
          <Layers size={16} />
          <span>مسیرها</span>
        </button>

        <button
          className={`sd-tab-btn ${activeTab === 'atlas' ? 'active' : ''}`}
          onClick={() => setActiveTab('atlas')}
        >
          <Globe size={16} />
          <span>اطلس معرفت</span>
        </button>

        <button
          className={`sd-tab-btn ${activeTab === 'lab' ? 'active' : ''}`}
          onClick={() => setActiveTab('lab')}
        >
          <Activity size={16} />
          <span>آزمایشگاه و آزمون‌ها</span>
        </button>

        <button
          className={`sd-tab-btn ${activeTab === 'journal' ? 'active' : ''}`}
          onClick={() => setActiveTab('journal')}
        >
          <BookOpen size={16} />
          <span>دفتر درون</span>
          {state.journalEntries.length > 0 && (
            <span className="sd-tab-badge">{state.journalEntries.length}</span>
          )}
        </button>

        <button
          className={`sd-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={16} />
          <span>نقشه من</span>
        </button>
      </nav>

      {/* ── TAB 1: TODAY (DASHBOARD) ── */}
      {activeTab === 'today' && (
        <div className="sd-dashboard-flow">
          {/* Hero Welcome & Stats */}
          <section className="sd-dash-hero">
            <div className="sd-dash-hero-top">
              <div>
                <span className="sd-eyebrow"><Sparkles size={13} /> مسیر رشد و معرفت درون</span>
                <h1 className="sd-dash-title">
                  امروز یک قدم عمیق‌تر خودت را بشناس
                </h1>
                <p className="sd-dash-sub">
                  آگاهی از احساسات، شفافیت ارزش‌ها و کشف حکمت در سنت‌های معنوی.
                </p>
              </div>

              {/* Live Gamification Status Card */}
              <div className="sd-user-stats-strip">
                <div className="sd-stat-pill streak">
                  <Flame size={16} />
                  <strong>{state.streak} روز</strong>
                  <span>تداوم</span>
                </div>

                <div className="sd-stat-pill level">
                  <Star size={16} />
                  <strong>سطح {state.level}</strong>
                  <span>{levelInfo.label}</span>
                </div>

                <div className="sd-stat-pill xp">
                  <Sparkles size={16} />
                  <strong>{state.xp}</strong>
                  <span>XP کل</span>
                </div>
              </div>
            </div>

            {/* Level Progress Bar */}
            <div className="sd-level-bar-wrap">
              <div className="sd-level-bar-labels">
                <span>سطح {state.level} ({levelInfo.label})</span>
                <span>{nextLevel ? `تا سطح بعدی: ${nextLevel.minXp - state.xp} XP` : 'بالاترین سطح'}</span>
              </div>
              <div className="sd-level-track">
                <div className="sd-level-fill" style={{ width: `${levelProgressPct}%` }} />
              </div>
            </div>
          </section>

          {/* Core Spotlight: Today's Interactive Journey Card */}
          <section className="sd-today-spotlight-card">
            <div className="sd-spotlight-header">
              <div className="sd-spotlight-badge">
                <Compass size={14} />
                <span>{todaySession.dayLabel} · مسیر {activeJourney.title}</span>
              </div>
              <span className="sd-spotlight-time">۱۰ تا ۱۵ دقیقه</span>
            </div>

            <div className="sd-spotlight-body">
              <h2 className="sd-spotlight-title">« {todaySession.title} »</h2>
              <p className="sd-spotlight-desc">
                شامل {todaySession.activities.length} گام تعاملی: درس، تأمل درونی، سؤال چندگزینه‌ای و تمرین عملی.
              </p>

              <div className="sd-spotlight-perks">
                <span><Sparkles size={14} /> +{todaySession.activities.reduce((s, a) => s + a.xp, 30)} XP پاداش</span>
                <span><Check size={14} /> ۱ کشف و بینش معنادار</span>
              </div>
            </div>

            <div className="sd-spotlight-cta-row">
              {isTodaySessionDone ? (
                <div className="sd-session-completed-banner">
                  <Check size={18} />
                  <span>مسیر امروز با موفقیت طی شده است! می‌توانید دوباره مرورش کنید.</span>
                  <button
                    className="sd-btn sd-btn-outline"
                    onClick={() => setRunningSession(todaySession)}
                  >
                    مرور مجدد مسیر
                  </button>
                </div>
              ) : (
                <button
                  className="sd-btn sd-btn-gold sd-btn-large"
                  onClick={() => setRunningSession(todaySession)}
                >
                  <Play size={18} /> شروع مسیر امروز ({todaySession.dayLabel})
                </button>
              )}
            </div>
          </section>

          {/* Quick Emotion Check-in */}
          <section className="sd-dash-card">
            <div className="sd-dash-card-head">
              <h3><Heart size={18} /> چک‌این سریع احساسی امروز</h3>
              <span className="sd-card-sub">الان چه احساسی داری؟</span>
            </div>

            <div className="sd-quick-emotions-row">
              {EMOTIONS.map(em => {
                const isSelected = todayQuickEmotion === em.id || (state.lastCheckinDate === todayKeyStr && state.emotionHistory[0]?.emotion === em.id);
                return (
                  <button
                    key={em.id}
                    className={`sd-quick-em-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setTodayQuickEmotion(em.id as EmotionId);
                      saveEmotion(em.id as EmotionId, 4, 'ثبت سریع از داشبورد');
                    }}
                  >
                    <span className="sd-qem-emoji">{em.emoji}</span>
                    <span className="sd-qem-label">{em.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Daily Sacred Practice (Unity, Mindfulness, Virtues) */}
          <section className="sd-dash-card sd-practice-spotlight-card">
            <div className="sd-dash-card-head">
              <div className="sd-practice-spotlight-badge">
                <span className="sd-pspot-icon">{practiceOfTheDay.icon}</span>
                <div>
                  <span className="sd-pill-gold">تمرین وحدت و اتصال امروز</span>
                  <h3 className="sd-pspot-title">{practiceOfTheDay.title}</h3>
                </div>
              </div>
              <span className="sd-card-sub">{practiceOfTheDay.durationMinutes} دقیقه · {practiceOfTheDay.categoryLabel}</span>
            </div>

            <p className="sd-pspot-obj"><strong>هدف امروز:</strong> {practiceOfTheDay.objective}</p>

            <div className="sd-pspot-action-quote">
              <Feather size={15} />
              <span>{practiceOfTheDay.contemplation}</span>
            </div>

            <div className="sd-pspot-foot">
              <button
                className="sd-btn sd-btn-gold sd-btn-glow"
                onClick={() => setSelectedPractice(practiceOfTheDay)}
              >
                <Play size={16} /> آغاز تمرین هوشمند و تنفس آرامش (+۱۵ XP)
              </button>
              <button
                className={`sd-btn ${practiceDoneToday ? 'sd-btn-outline done' : 'sd-btn-outline'}`}
                onClick={() => {
                  if (!practiceDoneToday) {
                    setPracticeDoneToday(true);
                    addXp(15);
                  }
                }}
              >
                {practiceDoneToday ? <><Check size={15} /> انجام شد (+۱۵ XP)</> : 'ثبت مستقیم انجام‌شده'}
              </button>
            </div>
          </section>

          {/* Two-Column Features: Discovery of Day + Quick Links */}
          <div className="sd-dash-two-col">
            {/* Discovery of the Day */}
            <article className="sd-dash-card sd-discovery-card">
              <div className="sd-dash-card-head">
                <span className="sd-pill-gold"><Globe size={13} /> کشف روزانه معرفت</span>
                <span className="sd-card-sub">{discoveryOfTheDay.tradition}</span>
              </div>

              <div className="sd-discovery-body">
                <h3 className="sd-disc-name">{discoveryOfTheDay.originalScript || discoveryOfTheDay.name}</h3>
                <div className="sd-disc-trans">{discoveryOfTheDay.transliteration} — {discoveryOfTheDay.literalMeaning}</div>
                <p className="sd-disc-desc">{discoveryOfTheDay.shortExplanation}</p>
                <div className="sd-disc-ref">
                  <strong>تأمل امروز:</strong> {discoveryOfTheDay.reflection}
                </div>
              </div>

              <div className="sd-discovery-foot">
                <button
                  className="sd-text-btn"
                  onClick={() => setActiveTab('atlas')}
                >
                  مشاهده در اطلس معرفت <ArrowLeft size={15} />
                </button>
                <button
                  className={`sd-icon-btn ${state.savedConceptIds.includes(discoveryOfTheDay.id) ? 'active' : ''}`}
                  onClick={() => toggleSaved(discoveryOfTheDay.id)}
                  title="نشان کردن مفهوم"
                >
                  <Star size={16} />
                </button>
              </div>
            </article>

            {/* Quick Interactive Tool Cards */}
            <div className="sd-quick-tools-grid">
              <div className="sd-tool-card" onClick={() => setIsPlayingValuesGame(true)}>
                <div className="sd-tool-icon"><Compass size={22} /></div>
                <div>
                  <strong>آزمون ارزش‌های واقعی من</strong>
                  <p>غربال ۴ مرحله‌ای ارزش‌های بنیادین</p>
                </div>
              </div>

              <div className="sd-tool-card" onClick={() => setActiveTab('lab')}>
                <div className="sd-tool-icon"><Activity size={22} /></div>
                <div>
                  <strong>آزمون سبک تصمیم‌گیری</strong>
                  <p>تحلیلی، شهودی، اجتماعی یا سریع؟</p>
                </div>
              </div>

              <div className="sd-tool-card" onClick={() => setActiveTab('journal')}>
                <div className="sd-tool-icon"><Feather size={22} /></div>
                <div>
                  <strong>دفتر درون</strong>
                  <p>{state.journalEntries.length} یادداشت و تأمل ذخیره‌شده</p>
                </div>
              </div>

              <div className="sd-tool-card" onClick={() => setActiveTab('profile')}>
                <div className="sd-tool-icon"><User size={22} /></div>
                <div>
                  <strong>نقشه من</strong>
                  <p>قطب‌نما، آمار احساسات و نتایج آزمون‌ها</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: JOURNEYS MAP ── */}
      {activeTab === 'journeys' && (
        <div className="sd-journeys-tab-view">
          <div className="sd-section-header">
            <div>
              <span className="sd-pill-gold"><Layers size={14} /> نقشه‌های یادگیری و سلوک معنوی</span>
              <h2>سفرهای هفت‌روزه رشد و آگاهی</h2>
              <p>۶ مسیر تخصصی و پیوسته با ۴۲ روز محتوای عمیق برای شناخت خویشتن، جهان و خالق هستی.</p>
            </div>
          </div>

          {/* Active Journey Spotlight Banner */}
          <div className="sd-active-journey-banner">
            <div className="sd-aj-banner-content">
              <div className="sd-aj-badge">
                <Sparkles size={14} />
                <span>مسیر فعال روزانه شما</span>
              </div>
              <h3>{activeJourney.title}</h3>
              <p>{activeJourney.subtitle}</p>

              <div className="sd-aj-progress-bar-wrap">
                <div className="sd-aj-progress-labels">
                  <span>پیشرفت شما: {activeDayIndex} از {activeJourney.daysCount} روز</span>
                  <span>{Math.round((activeDayIndex / activeJourney.daysCount) * 100)}٪ تکمیل</span>
                </div>
                <div className="sd-level-bar-track">
                  <div
                    className="sd-level-bar-fill"
                    style={{ width: `${Math.min(100, Math.max(5, (activeDayIndex / activeJourney.daysCount) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="sd-aj-banner-action">
              <button
                className="sd-btn sd-btn-gold sd-btn-large"
                onClick={() => setRunningSession(todaySession)}
              >
                <Play size={18} /> {isTodaySessionDone ? 'مرور مجدد سشن امروز' : `آغاز سشن روز ${activeDayIndex + 1}`}
              </button>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="sd-practice-cats-row" style={{ marginTop: 24, marginBottom: 20 }}>
            {[
              { id: 'all', label: 'همه مسیرها (۶)' },
              { id: 'psych', label: 'روان‌شناختی و آرامش ذهن (۲)' },
              { id: 'meaning', label: 'معنای آفرینش و کیهان (۲)' },
              { id: 'virtue', label: 'اخلاق، عشق و شفقت (۲)' },
            ].map(cat => (
              <button
                key={cat.id}
                className={`sd-pcat-btn ${journeyCategory === cat.id ? 'active' : ''}`}
                onClick={() => setJourneyCategory(cat.id as any)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Journeys List */}
          <div className="sd-journeys-list">
            {JOURNEYS.filter(journey => {
              if (journeyCategory === 'all') return true;
              if (journeyCategory === 'psych') return ['journey-self', 'journey-peace'].includes(journey.id);
              if (journeyCategory === 'meaning') return ['journey-meaning', 'journey-cosmos'].includes(journey.id);
              if (journeyCategory === 'virtue') return ['journey-virtue', 'journey-compassion'].includes(journey.id);
              return true;
            }).map(journey => {
              const currentProgress = state.journeyProgress[journey.id] || 0;
              const isSelected = state.activeJourneyId === journey.id;
              const progressPct = Math.round((currentProgress / journey.daysCount) * 100);

              const journeyIcons: Record<string, string> = {
                'journey-self': '🪞',
                'journey-meaning': '🧭',
                'journey-virtue': '⚖️',
                'journey-peace': '🕊️',
                'journey-cosmos': '🌌',
                'journey-compassion': '🤍',
              };

              return (
                <div key={journey.id} className={`sd-journey-strip-card ${isSelected ? 'active-focus' : ''}`}>
                  <div className="sd-jstrip-head">
                    <div className="sd-jstrip-title-group">
                      <span className="sd-jstrip-emoji">{journeyIcons[journey.id] || '✨'}</span>
                      <div>
                        <div className="sd-jstrip-tags">
                          <span className="sd-jstrip-badge">{journey.daysCount} روزه</span>
                          <span className="sd-card-sub">+۲۱۰ XP</span>
                          {isSelected && (
                            <span className="sd-pill-gold"><Check size={12} /> مسیر فعال انتخابی شما</span>
                          )}
                        </div>
                        <h3>{journey.title}</h3>
                        <p className="sd-jstrip-subtitle">{journey.subtitle}</p>
                      </div>
                    </div>

                    <div className="sd-jstrip-actions">
                      {!isSelected ? (
                        <button
                          className="sd-btn sd-btn-outline sd-btn-sm"
                          onClick={() => setActiveJourney(journey.id)}
                        >
                          انتخاب به عنوان مسیر فعال من
                        </button>
                      ) : (
                        <span className="sd-jstrip-selected-badge">
                          در حال پیمایش
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="sd-jstrip-desc">{journey.description}</p>

                  {/* Progress Line */}
                  <div className="sd-jstrip-prog-row">
                    <div className="sd-jprog-label">
                      <span>پیشرفت این سفر: {currentProgress} از {journey.daysCount} روز ({progressPct}٪)</span>
                    </div>
                    <div className="sd-level-bar-track">
                      <div className="sd-level-bar-fill" style={{ width: `${Math.min(100, Math.max(3, progressPct))}%` }} />
                    </div>
                  </div>

                  {/* 7 Days Step Roadmap */}
                  <div className="sd-journey-nodes-row">
                    {journey.sessions.map((sess, idx) => {
                      const isDone = state.completedSessions.includes(sess.id);
                      const isCurrent = idx === currentProgress;
                      const isLocked = idx > currentProgress;

                      const duration = sess.durationMinutes || sess.activities?.reduce((s, a) => s + (a.estimatedMinutes || 2), 0) || 5;

                      return (
                        <button
                          key={sess.id}
                          className={`sd-jnode ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''} ${isLocked ? 'locked' : ''}`}
                          onClick={() => setRunningSession(sess)}
                          title={`${sess.title} (${duration} دقیقه)`}
                        >
                          <div className="sd-jnode-circle">
                            {isDone ? <Check size={14} /> : idx + 1}
                          </div>
                          <span className="sd-jnode-title">{sess.title}</span>
                          <span className="sd-jnode-min">{duration} دقیقه</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Card Action Footer */}
                  <div className="sd-jstrip-footer">
                    <button
                      className="sd-btn sd-btn-gold sd-btn-sm"
                      onClick={() => {
                        const targetSession = journey.sessions[Math.min(currentProgress, journey.sessions.length - 1)];
                        setRunningSession(targetSession);
                      }}
                    >
                      <Play size={14} /> ورود به سشن روز {Math.min(currentProgress + 1, journey.daysCount)}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 3: DIVINE ATLAS ── */}
      {activeTab === 'atlas' && (
        <DivineAtlas
          savedIds={state.savedConceptIds}
          learnedIds={state.learnedConceptIds}
          onToggleSave={toggleSaved}
          onMarkLearned={markLearned}
          onAddXp={addXp}
        />
      )}

      {/* ── TAB 4: LAB & ASSESSMENTS ── */}
      {activeTab === 'lab' && (
        <div className="sd-lab-tab-view">
          <div className="sd-section-header">
            <div>
              <span className="sd-pill-gold"><Activity size={14} /> آزمایشگاه تعاملی خودشناسی</span>
              <h2>آزمون‌ها و تمرین‌های خودشناسی</h2>
              <p>ابزارهای تعاملی برای واکاوی الگوها، ارزش‌ها و سبک‌های رفتاری.</p>
            </div>
          </div>

          {/* Featured Values Game Banner */}
          <div className="sd-lab-featured-banner">
            <div>
              <span className="sd-pill-gold">مینی‌گیم اختصاصی</span>
              <h3>بازی ارزش‌های واقعی من (قطب‌نما)</h3>
              <p>از میان ۳۰ ارزش اساسی، در ۴ مرحله اولویت‌بندی، ۳ ارزش حیاتی زندگی‌ات را پیدا کن.</p>
            </div>
            <button
              className="sd-btn sd-btn-gold"
              onClick={() => setIsPlayingValuesGame(true)}
            >
              اجرای بازی ارزش‌ها <Play size={15} />
            </button>
          </div>

          {/* Assessments Grid */}
          <div className="sd-assessments-grid">
            {ASSESSMENTS.map(ass => {
              const previousResult = state.assessmentResults.find(r => r.assessmentId === ass.id);

              return (
                <div key={ass.id} className="sd-assessment-card">
                  <div className="sd-ass-card-top">
                    <span className="sd-ass-pill">{ass.estimatedMinutes} دقیقه</span>
                    {previousResult && <span className="sd-ass-done-pill"><Check size={12} /> تکمیل شده</span>}
                  </div>
                  <h3>{ass.title}</h3>
                  <p>{ass.subtitle}</p>

                  <div className="sd-ass-dims-preview">
                    {ass.dimensions.map(d => (
                      <span key={d.id} className="sd-ass-dim-tag">{d.label}</span>
                    ))}
                  </div>

                  <div className="sd-ass-card-foot">
                    <button
                      className="sd-btn sd-btn-gold"
                      onClick={() => setRunningAssessment(ass)}
                    >
                      {previousResult ? 'آزمون مجدد' : 'شروع آزمون'} <ArrowLeft size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 5: JOURNAL 2.0 ── */}
      {activeTab === 'journal' && (
        <JournalView
          entries={state.journalEntries}
          onSaveEntry={saveJournal}
        />
      )}

      {/* ── TAB 6: MY PROFILE / INNER MAP ── */}
      {activeTab === 'profile' && (
        <div className="sd-profile-tab-view">
          <div className="sd-section-header">
            <div>
              <span className="sd-pill-gold"><User size={14} /> نقشه و هویت درونی</span>
              <h2>پروفایل رشد و شناخت من</h2>
              <p>تصویری منسجم از ارزش‌ها، الگوهای تکرارشونده و دستاوردهای شما.</p>
            </div>
          </div>

          <div className="sd-profile-grid">
            {/* 1. Core Values Compass */}
            <div className="sd-prof-card">
              <h3><Compass size={18} /> قطب‌نمای ارزش‌های من</h3>
              {state.myValues.length > 0 ? (
                <div className="sd-prof-values-list">
                  {state.myValues.map((val, idx) => (
                    <div key={val} className="sd-prof-val-item">
                      <span className="sd-prof-val-rank">رتبه {idx + 1}</span>
                      <strong>{val}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="sd-prof-empty">
                  <p>هنوز آزمون ارزش‌ها را انجام نداده‌اید.</p>
                  <button className="sd-text-btn" onClick={() => setIsPlayingValuesGame(true)}>
                    کشف ارزش‌ها در آزمایشگاه
                  </button>
                </div>
              )}
            </div>

            {/* 2. Emotions Trends */}
            <div className="sd-prof-card">
              <h3><Heart size={18} /> الگوهای احساسی اخیر</h3>
              {state.emotionHistory.length > 0 ? (
                <div className="sd-prof-em-history">
                  {state.emotionHistory.slice(0, 6).map((em, i) => {
                    const emObj = EMOTIONS.find(e => e.id === em.emotion);
                    return (
                      <div key={i} className="sd-prof-em-item">
                        <span className="sd-prof-em-emoji">{emObj?.emoji || '🌸'}</span>
                        <div>
                          <strong>{emObj?.label || em.emotion}</strong>
                          <small>شدت: {em.intensity} از ۵</small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="sd-prof-empty">
                  <p>احساسی ثبت نشده است.</p>
                </div>
              )}
            </div>

            {/* 3. Achievements / Badges */}
            <div className="sd-prof-card sd-prof-card-wide">
              <h3><Award size={18} /> دستاوردها و نشان‌های مسیر</h3>
              <div className="sd-achievements-grid">
                {ACHIEVEMENTS.map(ach => {
                  const isUnlocked =
                    (ach.id === 'first-step' && state.completedSessions.length >= 1) ||
                    (ach.id === 'mirror' && state.journalEntries.length >= 5) ||
                    (ach.id === 'seven-days' && state.streak >= 7) ||
                    (ach.id === 'compass' && state.myValues.length >= 3) ||
                    (ach.id === 'explorer' && state.learnedConceptIds.length >= 5) ||
                    state.unlockedAchievements.includes(ach.id);

                  return (
                    <div key={ach.id} className={`sd-ach-card ${isUnlocked ? 'unlocked' : 'locked'}`}>
                      <span className="sd-ach-icon">{ach.icon}</span>
                      <div className="sd-ach-info">
                        <strong>{ach.title}</strong>
                        <p>{ach.description}</p>
                      </div>
                      {isUnlocked && <Check size={15} className="sd-ach-check" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALS / FULL-SCREEN RUNNERS ── */}
      {/* 1. Daily Session Runner Modal */}
      {runningSession && (
        <SessionRunner
          session={runningSession}
          onClose={() => setRunningSession(null)}
          onComplete={(sessionXp, insight) => {
            completeSession(runningSession.id, sessionXp);
            setRunningSession(null);
          }}
          onSaveJournal={(prompt, text, emotion) => {
            saveJournal({
              date: todayKeyStr,
              prompt,
              text,
              emotion,
            });
          }}
        />
      )}

      {/* 2. Values Game Modal */}
      {isPlayingValuesGame && (
        <div className="sd-session-modal" dir="rtl">
          <div className="sd-session-card sd-values-game-modal">
            <button
              className="sd-session-close"
              onClick={() => setIsPlayingValuesGame(false)}
            >
              ✕
            </button>
            <ValuesGame
              currentValues={state.myValues}
              onSaveValues={vals => {
                saveValues(vals);
              }}
              onClose={() => {
                setIsPlayingValuesGame(false);
                setActiveTab('profile');
              }}
            />
          </div>
        </div>
      )}

      {/* 3. Assessment Runner Modal */}
      {runningAssessment && (
        <div className="sd-session-modal" dir="rtl">
          <div className="sd-session-card">
            <AssessmentRunner
              assessment={runningAssessment}
              onClose={() => setRunningAssessment(null)}
              onComplete={result => {
                saveAssessment(result);
              }}
            />
          </div>
        </div>
      )}

      {/* 4. Daily Sacred Practice Player */}
      {selectedPractice && (
        <PracticePlayer
          practice={selectedPractice}
          onClose={() => setSelectedPractice(null)}
          onComplete={() => {
            setPracticeDoneToday(true);
            addXp(15);
            setSelectedPractice(null);
          }}
        />
      )}
    </div>
  );
}

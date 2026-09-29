'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Pause, RotateCcw, Volume2, VolumeX, Vibrate, CheckCircle2,
  Sparkles, Flame, Heart, Compass, Flower2, ShieldCheck, ArrowLeft,
  Info, Clock, Award, Wind, Feather
} from 'lucide-react';
import { MeditationLevel, MeditationTechnique, MeditationProfile } from '@/lib/meditation/types';
import { TECHNIQUES, getDailyTechnique, defaultMeditationProfile } from '@/lib/meditation/data';
import { playSingingBowl, playChime, triggerVibration } from '@/lib/meditation/sound';
import styles from './meditation.module.css';

const STORAGE_KEY = 'roshana-meditation-profile-v1';

type BreathPhase = 'inhale' | 'hold1' | 'exhale' | 'hold2';

export default function MeditationHub() {
  const [profile, setProfile] = useState<MeditationProfile>(defaultMeditationProfile);
  const [level, setLevel] = useState<MeditationLevel>('beginner');
  const [durationMinutes, setDurationMinutes] = useState<number>(15);
  const [technique, setTechnique] = useState<MeditationTechnique>(TECHNIQUES[0]);

  // Practice state
  const [isActive, setIsActive] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(15 * 60);
  const [phase, setPhase] = useState<BreathPhase>('inhale');
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState<number>(4);
  const [isCompleted, setIsCompleted] = useState(false);

  // Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  // Refs for timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load profile from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setProfile({ ...defaultMeditationProfile, ...parsed });
        if (parsed.preferredLevel) setLevel(parsed.preferredLevel);
        if (parsed.preferredDuration) {
          setDurationMinutes(parsed.preferredDuration);
          setSecondsRemaining(parsed.preferredDuration * 60);
        }
        if (parsed.soundEnabled !== undefined) setSoundEnabled(parsed.soundEnabled);
        if (parsed.vibrationEnabled !== undefined) setVibrationEnabled(parsed.vibrationEnabled);
      }
    } catch {}
  }, []);

  // Update technique when level changes
  useEffect(() => {
    const tech = getDailyTechnique(level);
    setTechnique(tech);
    if (!isActive) {
      setSecondsRemaining(durationMinutes * 60);
      setPhase('inhale');
      setPhaseSecondsLeft(tech.breathing.inhale);
    }
  }, [level, durationMinutes, isActive]);

  // Save profile helper
  const saveProfile = useCallback((patch: Partial<MeditationProfile>) => {
    setProfile(curr => {
      const next = { ...curr, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Audio & Haptic feedback on phase change
  const notifyPhaseChange = useCallback((newPhase: BreathPhase) => {
    if (soundEnabled) {
      if (newPhase === 'inhale') playChime('inhale');
      else if (newPhase === 'hold1' || newPhase === 'hold2') playChime('hold');
      else if (newPhase === 'exhale') playChime('exhale');
    }
    if (vibrationEnabled) {
      triggerVibration(newPhase === 'inhale' ? [30, 40] : 35);
    }
  }, [soundEnabled, vibrationEnabled]);

  // Handle breathing cycle ticks
  useEffect(() => {
    if (!isActive) return;

    phaseTimerRef.current = setInterval(() => {
      setPhaseSecondsLeft(prevSec => {
        if (prevSec > 1) return prevSec - 1;

        // Transition to next phase
        const b = technique.breathing;
        let nextPhase: BreathPhase = 'inhale';
        let nextDuration = b.inhale;

        if (phase === 'inhale') {
          if (b.hold1 > 0) {
            nextPhase = 'hold1';
            nextDuration = b.hold1;
          } else {
            nextPhase = 'exhale';
            nextDuration = b.exhale;
          }
        } else if (phase === 'hold1') {
          nextPhase = 'exhale';
          nextDuration = b.exhale;
        } else if (phase === 'exhale') {
          if (b.hold2 > 0) {
            nextPhase = 'hold2';
            nextDuration = b.hold2;
          } else {
            nextPhase = 'inhale';
            nextDuration = b.inhale;
          }
        } else if (phase === 'hold2') {
          nextPhase = 'inhale';
          nextDuration = b.inhale;
        }

        setPhase(nextPhase);
        notifyPhaseChange(nextPhase);
        return nextDuration;
      });
    }, 1000);

    return () => {
      if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
    };
  }, [isActive, phase, technique, notifyPhaseChange]);

  // Handle total session timer
  useEffect(() => {
    if (!isActive) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          // Complete session!
          setIsActive(false);
          setIsCompleted(true);
          if (soundEnabled) playSingingBowl(220);
          if (vibrationEnabled) triggerVibration([80, 100, 150]);

          // Record stats
          const today = new Date().toISOString().slice(0, 10);
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          const newStreak = profile.lastSessionDate === yesterday ? profile.streak + 1 : 1;

          saveProfile({
            totalMinutes: profile.totalMinutes + durationMinutes,
            sessionsCompleted: profile.sessionsCompleted + 1,
            streak: newStreak,
            lastSessionDate: today,
          });

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, durationMinutes, soundEnabled, vibrationEnabled, profile, saveProfile]);

  // Start / Pause
  const togglePlay = () => {
    if (!isActive) {
      if (soundEnabled) playSingingBowl(260);
      if (vibrationEnabled) triggerVibration(50);
      setIsActive(true);
      setIsCompleted(false);
    } else {
      setIsActive(false);
    }
  };

  // Reset
  const resetSession = () => {
    setIsActive(false);
    setIsCompleted(false);
    setSecondsRemaining(durationMinutes * 60);
    setPhase('inhale');
    setPhaseSecondsLeft(technique.breathing.inhale);
  };

  // Change duration
  const handleDurationChange = (mins: number) => {
    if (isActive) return;
    setDurationMinutes(mins);
    setSecondsRemaining(mins * 60);
    saveProfile({ preferredDuration: mins });
  };

  // Formatting minutes & seconds
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Determine orb animation class based on phase
  const getOrbPhaseClass = () => {
    if (!isActive) return styles.orbRest;
    if (phase === 'inhale') return styles.orbInhale;
    if (phase === 'hold1' || phase === 'hold2') return styles.orbHold;
    if (phase === 'exhale') return styles.orbExhale;
    return styles.orbRest;
  };

  const getPhasePersianLabel = () => {
    if (!isActive) return 'آماده شروع';
    if (phase === 'inhale') return 'دَم عمیق (Inhale)';
    if (phase === 'hold1') return 'مکث و سکون (Hold)';
    if (phase === 'exhale') return 'بازدم رهاساز (Exhale)';
    if (phase === 'hold2') return 'مکث در خلأ (Rest)';
    return '';
  };

  return (
    <div className={styles.root} aria-label="بخش مدیتیشن و تنفس روزانه">
      {/* ── Hero Banner ── */}
      <header
        className={styles.hero}
        style={{
          background: technique.chakra.gradient,
        }}
      >
        <div className={styles.heroBackgroundPattern} />
        <div className={styles.heroHeaderTop}>
          <div className={styles.chakraBadge}>
            <span
              className={styles.chakraDot}
              style={{ background: technique.chakra.color, color: technique.chakra.color }}
            />
            <span>{technique.chakra.persianName}</span>
            <span>·</span>
            <span>{technique.chakra.sanskrit}</span>
          </div>
          <div className={styles.streakPill}>
            <Flame size={14} color="#f59e0b" />
            <span>{profile.streak} روز پیوستگی مدیتیشن</span>
          </div>
        </div>

        <h1 className={styles.heroTitle}>{technique.title}</h1>
        <p className={styles.heroSubtitle}>{technique.subtitle}</p>

        <div className={styles.heroMeta}>
          <span className={styles.heroMetaItem}>
            <Clock size={15} />
            <span>زمان جلسه: {durationMinutes} دقیقه</span>
          </span>
          <span className={styles.heroMetaItem}>
            <Wind size={15} />
            <span>{technique.breathing.label}</span>
          </span>
          <span className={styles.heroMetaItem}>
            <Flower2 size={15} />
            <span>عنصر: {technique.chakra.element}</span>
          </span>
        </div>
      </header>

      {/* ── Level Selector ── */}
      <nav className={styles.levelBar} aria-label="انتخاب سطح مدیتیشن">
        <button
          className={`${styles.levelBtn} ${level === 'beginner' ? styles.levelBtnActive : ''}`}
          onClick={() => { if (!isActive) { setLevel('beginner'); saveProfile({ preferredLevel: 'beginner' }); } }}
          disabled={isActive}
        >
          <strong>سطح مبتدی</strong>
          <small>آرام‌سازی، ریشه و تنفس</small>
        </button>
        <button
          className={`${styles.levelBtn} ${level === 'intermediate' ? styles.levelBtnActive : ''}`}
          onClick={() => { if (!isActive) { setLevel('intermediate'); saveProfile({ preferredLevel: 'intermediate' }); } }}
          disabled={isActive}
        >
          <strong>سطح متوسط</strong>
          <small>هم‌نوایی، تعادل و ویپاسانا</small>
        </button>
        <button
          className={`${styles.levelBtn} ${level === 'advanced' ? styles.levelBtnActive : ''}`}
          onClick={() => { if (!isActive) { setLevel('advanced'); saveProfile({ preferredLevel: 'advanced' }); } }}
          disabled={isActive}
        >
          <strong>سطح پیشرفته</strong>
          <small>چاکراها، کومبهاکا و مانترا</small>
        </button>
      </nav>

      {/* ── Main Interactive Grid ── */}
      {!isCompleted ? (
        <div className={styles.grid}>
          {/* Practice Arena */}
          <section className={styles.arenaCard}>
            <div
              className={styles.chakraAura}
              style={{ background: technique.chakra.color }}
            />

            {/* Breathing Mandala */}
            <div className={styles.mandalaWrap}>
              <div
                className={styles.mandalaRingOuter}
                style={{ borderColor: isActive ? technique.chakra.color : undefined }}
              />
              <div className={styles.mandalaRingMiddle} />

              <div
                className={`${styles.breathingOrb} ${getOrbPhaseClass()}`}
                style={{
                  background: technique.chakra.gradient,
                  boxShadow: isActive ? `0 12px 50px ${technique.chakra.glow}` : undefined,
                }}
              >
                <span className={styles.phaseTitle}>{getPhasePersianLabel()}</span>
                {isActive && (
                  <span className={styles.phaseSeconds}>{phaseSecondsLeft}s</span>
                )}
                {technique.mantra && (
                  <span className={styles.phaseSub}>{technique.mantra}</span>
                )}
              </div>
            </div>

            {/* Session Timer */}
            <div className={styles.sessionTimerRow}>
              <span className={styles.sessionTimeNumber}>{formatTime(secondsRemaining)}</span>
              <span className={styles.sessionPatternLabel}>
                الگوی تنفس: {technique.breathing.label}
              </span>
            </div>

            {/* Duration Selector */}
            <div className={styles.durationBar}>
              {[5, 10, 15, 20, 30].map(mins => (
                <button
                  key={mins}
                  className={`${styles.durationBtn} ${durationMinutes === mins ? styles.durationBtnActive : ''}`}
                  onClick={() => handleDurationChange(mins)}
                  disabled={isActive}
                >
                  {mins} دقیقه
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className={styles.controlsRow}>
              {/* Sound Toggle */}
              <button
                className={`${styles.iconControlBtn} ${soundEnabled ? styles.iconControlActive : ''}`}
                onClick={() => {
                  const n = !soundEnabled;
                  setSoundEnabled(n);
                  saveProfile({ soundEnabled: n });
                }}
                aria-label={soundEnabled ? 'قطع صدا' : 'وصل صدا'}
                title={soundEnabled ? 'صدای کاسه تبتی و چایم فعال است' : 'بی‌صدا'}
              >
                {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </button>

              {/* Play / Pause Primary Button */}
              <button
                className={styles.playBtn}
                style={{ background: technique.chakra.gradient }}
                onClick={togglePlay}
              >
                {isActive ? (
                  <>
                    <Pause size={20} /> توقف موقت
                  </>
                ) : (
                  <>
                    <Play size={20} /> {secondsRemaining < durationMinutes * 60 ? 'ادامه مدیتیشن' : 'شروع مدیتیشن'}
                  </>
                )}
              </button>

              {/* Vibration Toggle */}
              <button
                className={`${styles.iconControlBtn} ${vibrationEnabled ? styles.iconControlActive : ''}`}
                onClick={() => {
                  const v = !vibrationEnabled;
                  setVibrationEnabled(v);
                  saveProfile({ vibrationEnabled: v });
                }}
                aria-label={vibrationEnabled ? 'خاموش کردن ویبره' : 'روشن کردن ویبره'}
                title={vibrationEnabled ? 'ویبره هماهنگ با تنفس فعال است' : 'ویبره خاموش'}
              >
                <Vibrate size={20} />
              </button>

              {/* Reset Button */}
              <button
                className={styles.iconControlBtn}
                onClick={resetSession}
                aria-label="بازنشانی جلسه"
                title="شروع دوباره از ابتدا"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </section>

          {/* Details & Philosophy Column */}
          <div className={styles.detailsCol}>
            {/* Benefits */}
            <div className={styles.infoCard}>
              <div className={styles.infoCardHead}>
                <Sparkles size={18} />
                <span>فواید این مدیتیشن</span>
              </div>
              <ul className={styles.benefitsList}>
                {technique.benefits.map((b, i) => (
                  <li key={i} className={styles.benefitItem}>
                    <CheckCircle2 size={16} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Philosophy */}
            <div className={styles.infoCard}>
              <div className={styles.infoCardHead}>
                <Feather size={18} />
                <span>فلسفه و حکمت تکنیک</span>
              </div>
              <p className={styles.philosophyText}>{technique.philosophy}</p>
            </div>

            {/* Step-by-Step Instructions */}
            <div className={styles.infoCard}>
              <div className={styles.infoCardHead}>
                <Compass size={18} />
                <span>راهنمای گام‌به‌گام</span>
              </div>
              <ol className={styles.stepsList}>
                {technique.instructions.map((step, i) => (
                  <li key={i} className={styles.stepItem}>
                    <span className={styles.stepNum}>{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      ) : (
        /* Completion Screen */
        <div className={styles.completionScreen}>
          <div className={styles.completionLotus}>
            <Flower2 size={46} strokeWidth={1.5} />
          </div>
          <h2 className={styles.completionTitle}>مدیتیشن با آرامش به پایان رسید</h2>
          <p className={styles.completionText}>
            سپاس از اینکه این ۱۵ دقیقه باارزش را به صلح و شفای درون خود اختصاص دادید. بگذارید این آرامش تا پایان روز در تمام کارهایتان جاری بماند.
          </p>

          <div className={styles.completionStats}>
            <div className={styles.compStatBox}>
              <strong>{profile.streak}</strong>
              <span>روز پیوستگی</span>
            </div>
            <div className={styles.compStatBox}>
              <strong>{profile.sessionsCompleted}</strong>
              <span>جلسه کامل‌شده</span>
            </div>
            <div className={styles.compStatBox}>
              <strong>{profile.totalMinutes}</strong>
              <span>دقیقه در آرامش</span>
            </div>
          </div>

          <button className={styles.finishActionBtn} onClick={resetSession}>
            یک جلسه دیگر یا بازگشت به خانه <ArrowLeft size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

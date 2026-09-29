'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Pause, RotateCcw, SkipForward, Volume2, VolumeX, Vibrate,
  Flame, HeartPulse, Clock, Sparkles, CheckCircle2, ArrowLeft,
  Activity, Dumbbell, ShieldCheck, Trophy, Zap, AlertCircle
} from 'lucide-react';
import { WorkoutLevel, WorkoutRoutine, WorkoutProfile, WorkoutPhase } from '@/lib/workout/types';
import { WORKOUT_ROUTINES, getDailyWorkout, defaultWorkoutProfile } from '@/lib/workout/data';
import { playBeep, playWhistle, playWorkoutFanfare, triggerWorkoutVibration } from '@/lib/workout/sound';
import styles from './workout.module.css';

const STORAGE_KEY = 'roshana-workout-profile-v1';

export default function WorkoutHub() {
  const [profile, setProfile] = useState<WorkoutProfile>(defaultWorkoutProfile);
  const [level, setLevel] = useState<WorkoutLevel>('beginner');
  const [durationMinutes, setDurationMinutes] = useState<number>(15);
  const [routine, setRoutine] = useState<WorkoutRoutine>(WORKOUT_ROUTINES[0]);

  // Active workout execution state
  const [isActive, setIsActive] = useState(false);
  const [currentMovementIdx, setCurrentMovementIdx] = useState(0);
  const [phase, setPhase] = useState<WorkoutPhase>('work');
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState<number>(45);
  const [totalSecondsRemaining, setTotalSecondsRemaining] = useState<number>(15 * 60);
  const [isCompleted, setIsCompleted] = useState(false);
  const [caloriesBurnedLive, setCaloriesBurnedLive] = useState<number>(0);

  // Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  const intervalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const totalTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved profile
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setProfile({ ...defaultWorkoutProfile, ...parsed });
        if (parsed.preferredLevel) setLevel(parsed.preferredLevel);
        if (parsed.preferredDuration) {
          setDurationMinutes(parsed.preferredDuration);
          setTotalSecondsRemaining(parsed.preferredDuration * 60);
        }
        if (parsed.soundEnabled !== undefined) setSoundEnabled(parsed.soundEnabled);
        if (parsed.vibrationEnabled !== undefined) setVibrationEnabled(parsed.vibrationEnabled);
      }
    } catch {}
  }, []);

  // Update routine on level or duration change
  useEffect(() => {
    const r = getDailyWorkout(level);
    setRoutine(r);
    if (!isActive) {
      setCurrentMovementIdx(0);
      setPhase('work');
      setPhaseSecondsLeft(r.movements[0]?.durationSeconds || 45);
      setTotalSecondsRemaining(durationMinutes * 60);
      setCaloriesBurnedLive(0);
    }
  }, [level, durationMinutes, isActive]);

  const saveProfile = useCallback((patch: Partial<WorkoutProfile>) => {
    setProfile(curr => {
      const next = { ...curr, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Audio/vibe notification
  const notifyTransition = useCallback((nextPhase: WorkoutPhase) => {
    if (soundEnabled) {
      if (nextPhase === 'work') playWhistle();
      else playBeep(false);
    }
    if (vibrationEnabled) {
      triggerWorkoutVibration(nextPhase === 'work' ? [60, 40, 80] : 50);
    }
  }, [soundEnabled, vibrationEnabled]);

  // Movement & Phase interval timer
  useEffect(() => {
    if (!isActive) return;

    intervalTimerRef.current = setInterval(() => {
      setPhaseSecondsLeft(prev => {
        // Coach countdown beeps at 3, 2, 1
        if (prev <= 4 && prev > 1 && soundEnabled) {
          playBeep(false);
          if (vibrationEnabled) triggerWorkoutVibration(30);
        }

        if (prev > 1) return prev - 1;

        // Phase finished: toggle work <-> rest or next movement
        const currentMovement = routine.movements[currentMovementIdx];
        if (phase === 'work') {
          // Switch to rest
          setPhase('rest');
          notifyTransition('rest');
          return currentMovement.restSeconds;
        } else {
          // Switch to work for next movement
          const nextIdx = (currentMovementIdx + 1) % routine.movements.length;
          setCurrentMovementIdx(nextIdx);
          setPhase('work');
          notifyTransition('work');
          return routine.movements[nextIdx].durationSeconds;
        }
      });
    }, 1000);

    return () => {
      if (intervalTimerRef.current) clearInterval(intervalTimerRef.current);
    };
  }, [isActive, phase, currentMovementIdx, routine, soundEnabled, vibrationEnabled, notifyTransition]);

  // Total session timer and live calorie accumulator
  useEffect(() => {
    if (!isActive) return;

    totalTimerRef.current = setInterval(() => {
      setTotalSecondsRemaining(prev => {
        if (prev <= 1) {
          // Workout finished!
          setIsActive(false);
          setIsCompleted(true);
          if (soundEnabled) playWorkoutFanfare();
          if (vibrationEnabled) triggerWorkoutVibration([100, 80, 200]);

          const calTotal = Math.round((durationMinutes / 15) * routine.calorieBurnPer15Min);
          setCaloriesBurnedLive(calTotal);

          const today = new Date().toISOString().slice(0, 10);
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          const newStreak = profile.lastSessionDate === yesterday ? profile.streak + 1 : 1;

          saveProfile({
            totalMinutes: profile.totalMinutes + durationMinutes,
            estimatedCalories: profile.estimatedCalories + calTotal,
            sessionsCompleted: profile.sessionsCompleted + 1,
            streak: newStreak,
            lastSessionDate: today,
          });

          return 0;
        }

        // update live calories burned
        const elapsed = (durationMinutes * 60) - (prev - 1);
        const currentCals = Math.round((elapsed / (15 * 60)) * routine.calorieBurnPer15Min);
        setCaloriesBurnedLive(currentCals);

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    };
  }, [isActive, durationMinutes, routine, soundEnabled, vibrationEnabled, profile, saveProfile]);

  const togglePlay = () => {
    if (!isActive) {
      if (soundEnabled) playWhistle();
      if (vibrationEnabled) triggerWorkoutVibration(60);
      setIsActive(true);
      setIsCompleted(false);
    } else {
      setIsActive(false);
    }
  };

  const skipMovement = () => {
    const nextIdx = (currentMovementIdx + 1) % routine.movements.length;
    setCurrentMovementIdx(nextIdx);
    setPhase('work');
    setPhaseSecondsLeft(routine.movements[nextIdx].durationSeconds);
    notifyTransition('work');
  };

  const resetWorkout = () => {
    setIsActive(false);
    setIsCompleted(false);
    setCurrentMovementIdx(0);
    setPhase('work');
    setPhaseSecondsLeft(routine.movements[0]?.durationSeconds || 45);
    setTotalSecondsRemaining(durationMinutes * 60);
    setCaloriesBurnedLive(0);
  };

  const handleDurationChange = (mins: number) => {
    if (isActive) return;
    setDurationMinutes(mins);
    setTotalSecondsRemaining(mins * 60);
    saveProfile({ preferredDuration: mins });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentMovement = routine.movements[currentMovementIdx] || routine.movements[0];
  const nextMovement = routine.movements[(currentMovementIdx + 1) % routine.movements.length];

  return (
    <div className={styles.root} aria-label="بخش ورزش روزانه هوازی">
      {/* ── Hero Banner ── */}
      <header className={styles.hero}>
        <div className={styles.heroBackgroundPattern} />
        <div className={styles.heroHeaderTop}>
          <div className={styles.cardioBadge}>
            <span className={styles.fireDot} />
            <span>تمرین هوازی روزانه</span>
            <span>·</span>
            <span>{routine.targetHeartRateZone}</span>
          </div>
          <div className={styles.streakPill}>
            <Flame size={14} color="#fca5a5" />
            <span>{profile.streak} روز پیوستگی تمرین</span>
          </div>
        </div>

        <h1 className={styles.heroTitle}>{routine.title}</h1>
        <p className={styles.heroSubtitle}>{routine.subtitle}</p>

        <div className={styles.heroMeta}>
          <span className={styles.heroMetaItem}>
            <Clock size={15} />
            <span>مدت زمان: {durationMinutes} دقیقه</span>
          </span>
          <span className={styles.heroMetaItem}>
            <Zap size={15} />
            <span>تخمین کالری: ~{Math.round((durationMinutes / 15) * routine.calorieBurnPer15Min)} کیلوکالری</span>
          </span>
          <span className={styles.heroMetaItem}>
            <Activity size={15} />
            <span>{routine.movements.length} حرکت چرخشی هوشمند</span>
          </span>
        </div>
      </header>

      {/* ── Level Selector ── */}
      <nav className={styles.levelBar} aria-label="انتخاب سطح تمرین">
        <button
          className={`${styles.levelBtn} ${level === 'beginner' ? styles.levelBtnActive : ''}`}
          onClick={() => { if (!isActive) { setLevel('beginner'); saveProfile({ preferredLevel: 'beginner' }); } }}
          disabled={isActive}
        >
          <strong>سطح مبتدی</strong>
          <small>کم‌فشار، شاداب و ملایم</small>
        </button>
        <button
          className={`${styles.levelBtn} ${level === 'intermediate' ? styles.levelBtnActive : ''}`}
          onClick={() => { if (!isActive) { setLevel('intermediate'); saveProfile({ preferredLevel: 'intermediate' }); } }}
          disabled={isActive}
        >
          <strong>سطح متوسط</strong>
          <small>تاباتا، بوکس و چربی‌سوزی</small>
        </button>
        <button
          className={`${styles.levelBtn} ${level === 'advanced' ? styles.levelBtnActive : ''}`}
          onClick={() => { if (!isActive) { setLevel('advanced'); saveProfile({ preferredLevel: 'advanced' }); } }}
          disabled={isActive}
        >
          <strong>سطح پیشرفته</strong>
          <small>HIIT انفجاری و توان حداکثری</small>
        </button>
      </nav>

      {/* ── Main Interactive Workout Grid ── */}
      {!isCompleted ? (
        <div className={styles.grid}>
          {/* Active Workout Arena Card */}
          <section className={styles.arenaCard}>
            <div className={styles.redAura} />

            {/* Movement Title & Tip */}
            <div className={styles.movementHeadline}>
              <h2 className={styles.movementTitle}>
                {phase === 'work' ? currentMovement.persianName : 'استراحت فعال و تنفس عمیق'}
              </h2>
              <p className={styles.movementTip}>
                {phase === 'work'
                  ? currentMovement.tips
                  : `آماده حرکت بعدی: ${nextMovement.persianName}`}
              </p>
            </div>

            {/* Cardio Pulse Dial */}
            <div className={styles.dialWrap}>
              <div className={styles.dialTrack} />
              <div
                className={`${styles.dialOrb} ${isActive && phase === 'work' ? styles.dialOrbPulsing : ''} ${phase === 'rest' ? styles.dialOrbRest : ''}`}
              >
                <span className={styles.movementPhaseLabel}>
                  {phase === 'work' ? 'تمرین پرانرژی' : 'استراحت و بازیابی'}
                </span>
                <span className={styles.movementSecondsLeft}>{phaseSecondsLeft}s</span>
                <span className={styles.movementNameBadge} dir="ltr">
                  {currentMovement.name}
                </span>
              </div>
            </div>

            {/* Live Metrics: Time & Calories */}
            <div className={styles.metricsRow}>
              <div className={styles.metricBox}>
                <span className={styles.metricValue}>{formatTime(totalSecondsRemaining)}</span>
                <span className={styles.metricLabel}>زمان باقیمانده</span>
              </div>
              <div className={styles.metricBox}>
                <span className={styles.metricValue}>{caloriesBurnedLive}</span>
                <span className={styles.metricLabel}>کالری سوزانده‌شده (تقریبی)</span>
              </div>
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
              <button
                className={`${styles.iconControlBtn} ${soundEnabled ? styles.iconControlActive : ''}`}
                onClick={() => {
                  const s = !soundEnabled;
                  setSoundEnabled(s);
                  saveProfile({ soundEnabled: s });
                }}
                aria-label={soundEnabled ? 'قطع صدای سوت' : 'وصل صدای سوت'}
                title={soundEnabled ? 'سوت و بوق مربی فعال است' : 'بی‌صدا'}
              >
                {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </button>

              <button className={styles.playBtn} onClick={togglePlay}>
                {isActive ? (
                  <>
                    <Pause size={20} /> توقف موقت
                  </>
                ) : (
                  <>
                    <Play size={20} /> {totalSecondsRemaining < durationMinutes * 60 ? 'ادامه تمرین' : 'شروع تمرین ۱۵ دقیقه'}
                  </>
                )}
              </button>

              <button
                className={styles.iconControlBtn}
                onClick={skipMovement}
                aria-label="حرکت بعدی"
                title="رفتن به حرکت بعدی"
                disabled={!isActive}
              >
                <SkipForward size={20} />
              </button>

              <button
                className={`${styles.iconControlBtn} ${vibrationEnabled ? styles.iconControlActive : ''}`}
                onClick={() => {
                  const v = !vibrationEnabled;
                  setVibrationEnabled(v);
                  saveProfile({ vibrationEnabled: v });
                }}
                aria-label={vibrationEnabled ? 'خاموش کردن ویبره' : 'روشن کردن ویبره'}
                title={vibrationEnabled ? 'ویبره مربی فعال است' : 'ویبره خاموش'}
              >
                <Vibrate size={20} />
              </button>

              <button
                className={styles.iconControlBtn}
                onClick={resetWorkout}
                aria-label="بازنشانی تمرین"
                title="شروع مجدد از ابتدا"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </section>

          {/* Details & Movement List Column */}
          <div className={styles.detailsCol}>
            {/* Scientific Benefits */}
            <div className={styles.infoCard}>
              <div className={styles.infoCardHead}>
                <Sparkles size={18} />
                <span>فواید علمی تمرین امروز</span>
              </div>
              <ul className={styles.benefitsList}>
                {routine.benefits.map((b, i) => (
                  <li key={i} className={styles.benefitItem}>
                    <CheckCircle2 size={16} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Science Physiology Note */}
            <div className={styles.infoCard}>
              <div className={styles.infoCardHead}>
                <HeartPulse size={18} />
                <span>فیزیولوژی چربی‌سوزی و قلب</span>
              </div>
              <p className={styles.scienceText}>{routine.scienceNote}</p>
            </div>

            {/* Movements List in Today's Circuit */}
            <div className={styles.infoCard}>
              <div className={styles.infoCardHead}>
                <Dumbbell size={18} />
                <span>حرکات مدار امروز ({routine.movements.length} حرکت)</span>
              </div>
              <div className={styles.movementsList}>
                {routine.movements.map((m, idx) => (
                  <div key={idx} className={styles.movementRow}>
                    <div className={styles.movementRowHeader}>
                      <strong>{idx + 1}. {m.persianName}</strong>
                      <span
                        className={`${styles.intensityTag} ${
                          m.intensity === 'low'
                            ? styles.intensityLow
                            : m.intensity === 'moderate'
                            ? styles.intensityModerate
                            : styles.intensityHigh
                        }`}
                      >
                        {m.intensity === 'low' ? 'ملایم' : m.intensity === 'moderate' ? 'متوسط' : 'شدید'}
                      </span>
                    </div>
                    <div className={styles.muscleTags}>
                      {m.targetMuscles.map((muscle, mIdx) => (
                        <span key={mIdx} className={styles.muscleTag}>{muscle}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Completion Screen */
        <div className={styles.completionScreen}>
          <div className={styles.completionTrophy}>
            <Trophy size={46} strokeWidth={1.5} />
          </div>
          <h2 className={styles.completionTitle}>عالی بود! تمرین امروز با قدرت تمام شد</h2>
          <p className={styles.completionText}>
            به خودتان افتخار کنید! شما ۱۵ دقیقه به تقویت عضلات قلب، سوزاندن چربی و آزادسازی دوپامین و انرژی نشاط‌آور پرداختید.
          </p>

          <div className={styles.completionStats}>
            <div className={styles.compStatBox}>
              <strong>{profile.streak}</strong>
              <span>روز پیوستگی</span>
            </div>
            <div className={styles.compStatBox}>
              <strong>{caloriesBurnedLive || Math.round((durationMinutes / 15) * routine.calorieBurnPer15Min)}</strong>
              <span>کیلوکالری سوزانده‌شده</span>
            </div>
            <div className={styles.compStatBox}>
              <strong>{profile.totalMinutes}</strong>
              <span>دقیقه ورزش ثبت‌شده</span>
            </div>
          </div>

          <button className={styles.finishActionBtn} onClick={resetWorkout}>
            یک دور دیگر یا بازگشت به خانه <ArrowLeft size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

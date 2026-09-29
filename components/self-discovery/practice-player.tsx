'use client';

import { useState, useEffect } from 'react';
import {
  Play, Pause, RotateCcw, Check, X, ArrowLeft, ArrowRight,
  Sparkles, Feather, Volume2, VolumeX, Sun, Heart, Flame
} from 'lucide-react';
import type { DailyPracticeItem } from '@/lib/self-discovery/types';

interface PracticePlayerProps {
  practice: DailyPracticeItem;
  onComplete: () => void;
  onClose: () => void;
}

export default function PracticePlayer({
  practice,
  onComplete,
  onClose,
}: PracticePlayerProps) {
  const totalSeconds = practice.durationMinutes * 60;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'rest'>('inhale');

  // Breathing pulse timer (4s inhale, 4s hold, 4s exhale, 2s rest)
  useEffect(() => {
    if (!isRunning || isFinished) return;

    const breathInterval = setInterval(() => {
      setBreathPhase(prev => {
        if (prev === 'inhale') return 'hold';
        if (prev === 'hold') return 'exhale';
        if (prev === 'exhale') return 'rest';
        return 'inhale';
      });
    }, 4000);

    return () => clearInterval(breathInterval);
  }, [isRunning, isFinished]);

  // Main countdown timer
  useEffect(() => {
    if (!isRunning || isFinished) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsRunning(false);
          setIsFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, isFinished]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPct = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  const breathLabels = {
    inhale: 'دم عمیق و دریافت نور…',
    hold: 'درنگ در حضور و سکون…',
    exhale: 'بازدم آرام و رهاسازی تنش…',
    rest: 'سکوت دل و حضور در اکنون…',
  };

  if (isFinished) {
    return (
      <div className="sd-player-overlay" dir="rtl">
        <div className="sd-player-card sd-player-finish-card">
          <div className="sd-finish-badge">
            <Sparkles size={44} className="sd-finish-sparkle" />
          </div>
          <h2>تمرین با موفقیت و آرامش انجام شد</h2>
          <p className="sd-finish-sub">« {practice.title} »</p>

          <div className="sd-finish-insight">
            <Feather size={20} />
            <p>« {practice.contemplation} »</p>
          </div>

          <div className="sd-finish-stats">
            <div className="sd-fstat">
              <Sparkles size={20} />
              <strong>+۱۵ XP</strong>
              <span>رشد معنوی</span>
            </div>
            <div className="sd-fstat">
              <Sun size={20} />
              <strong>{practice.durationMinutes} دقیقه</strong>
              <span>حضور در لحظه</span>
            </div>
          </div>

          <div className="sd-finish-actions">
            <button
              className="sd-btn sd-btn-gold sd-btn-large"
              onClick={onComplete}
            >
              <Check size={18} /> ثبت دستاورد و پایان تمرین
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sd-player-overlay" dir="rtl">
      <div className="sd-player-card">
        {/* Top Bar */}
        <div className="sd-player-header">
          <div className="sd-player-badge">
            <span>{practice.icon}</span>
            <span>{practice.categoryLabel}</span>
          </div>
          <button className="sd-session-close" onClick={onClose} aria-label="بستن">
            <X size={18} />
          </button>
        </div>

        {/* Practice Title & Objective */}
        <div className="sd-player-title-section">
          <h2>{practice.title}</h2>
          <p>{practice.objective}</p>
        </div>

        {/* Interactive Breathing & Aura Visualizer */}
        <div className="sd-zen-visualizer-container">
          <div className={`sd-zen-aura-ring ${breathPhase} ${isRunning ? 'active' : ''}`}>
            <div className="sd-zen-inner-core">
              <span className="sd-zen-timer-digits">{formattedTime}</span>
              <span className="sd-zen-breath-caption">{isRunning ? breathLabels[breathPhase] : 'آماده برای آغاز حضور'}</span>
            </div>
          </div>
        </div>

        {/* Play / Pause / Reset Controls */}
        <div className="sd-player-controls-row">
          <button
            className="sd-ctrl-btn secondary"
            onClick={() => {
              setIsRunning(false);
              setTimeLeft(totalSeconds);
            }}
            title="شروع مجدد تایمر"
          >
            <RotateCcw size={18} />
          </button>

          <button
            className="sd-ctrl-btn primary"
            onClick={() => setIsRunning(!isRunning)}
          >
            {isRunning ? <Pause size={24} /> : <Play size={24} style={{ marginRight: -2 }} />}
          </button>

          <button
            className="sd-ctrl-btn secondary"
            onClick={() => setIsFinished(true)}
            title="پایان زودهنگام تمرین"
          >
            <Check size={18} />
          </button>
        </div>

        {/* Guided Step Carousel */}
        <div className="sd-player-step-box">
          <div className="sd-step-box-header">
            <span>گام {currentStepIdx + 1} از {practice.steps.length}</span>
            <div className="sd-step-arrows">
              <button
                className="sd-step-nav-btn"
                disabled={currentStepIdx === 0}
                onClick={() => setCurrentStepIdx(currentStepIdx - 1)}
              >
                <ArrowRight size={14} /> قبلی
              </button>
              <button
                className="sd-step-nav-btn"
                disabled={currentStepIdx === practice.steps.length - 1}
                onClick={() => setCurrentStepIdx(currentStepIdx + 1)}
              >
                بعدی <ArrowLeft size={14} />
              </button>
            </div>
          </div>
          <p className="sd-step-box-content">{practice.steps[currentStepIdx]}</p>
        </div>

        {/* Bottom Contemplation Quote */}
        <div className="sd-player-contemplation">
          <Feather size={14} />
          <span>{practice.contemplation}</span>
        </div>
      </div>
    </div>
  );
}

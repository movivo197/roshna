'use client';

import { useState } from 'react';
import {
  Check, ArrowLeft, ArrowRight, Sparkles, BookOpen,
  HelpCircle, Compass, Heart, Feather, RefreshCw, Star,
  Sliders, ShieldCheck, Flame, X
} from 'lucide-react';
import type { DailySession, Activity, QuizOption } from '@/lib/self-discovery/types';
import { EMOTIONS, DIVINE_NAMES } from '@/lib/self-discovery/content';
import type { EmotionId } from '@/lib/self-discovery/state';

interface SessionRunnerProps {
  session: DailySession;
  onComplete: (sessionXp: number, summary: string) => void;
  onClose: () => void;
  onSaveJournal: (prompt: string, text: string, emotion?: EmotionId) => void;
}

export default function SessionRunner({
  session,
  onComplete,
  onClose,
  onSaveJournal,
}: SessionRunnerProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [earnedXp, setEarnedXp] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Activity-specific state
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionId | null>(null);
  const [emotionIntensity, setEmotionIntensity] = useState(3);
  const [reflectionText, setReflectionText] = useState('');
  const [quizAnswered, setQuizAnswered] = useState<number | null>(null);
  const [multiSelected, setMultiSelected] = useState<string[]>([]);
  const [sliderValue, setSliderValue] = useState(50);
  const [stepCompleted, setStepCompleted] = useState(false);
  const [practiceDone, setPracticeDone] = useState(false);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  const currentActivity: Activity | undefined = session.activities[stepIndex];
  const totalSteps = session.activities.length;
  const progressPct = ((stepIndex + (isFinished ? 1 : 0)) / totalSteps) * 100;

  function resetActivityState() {
    setSelectedEmotion(null);
    setEmotionIntensity(3);
    setReflectionText('');
    setQuizAnswered(null);
    setMultiSelected([]);
    setSliderValue(50);
    setStepCompleted(false);
    setPracticeDone(false);
    setSelectedValues([]);
  }

  function handleNextStep(stepXp = 0) {
    const nextXp = earnedXp + stepXp;
    setEarnedXp(nextXp);

    if (stepIndex < totalSteps - 1) {
      resetActivityState();
      setStepIndex(stepIndex + 1);
    } else {
      setIsFinished(true);
    }
  }

  if (isFinished) {
    return (
      <div className="sd-session-modal" dir="rtl">
        <div className="sd-session-card sd-session-finish">
          <div className="sd-finish-badge">
            <Sparkles size={40} className="sd-finish-sparkle" />
          </div>
          <h2>مسیر امروز با موفقیت کامل شد!</h2>
          <p className="sd-finish-sub">{session.title} — {session.dayLabel}</p>

          <div className="sd-finish-insight">
            <div className="sd-insight-quote">« {session.completionInsight} »</div>
          </div>

          <div className="sd-finish-stats">
            <div className="sd-fstat">
              <Sparkles size={20} />
              <strong>+{earnedXp + 30} XP</strong>
              <span>امتیاز رشد</span>
            </div>
            <div className="sd-fstat">
              <Flame size={20} />
              <strong>+۱ روز</strong>
              <span>تداوم حضور</span>
            </div>
            <div className="sd-fstat">
              <Check size={20} />
              <strong>{totalSteps}</strong>
              <span>گام کامل‌شده</span>
            </div>
          </div>

          <div className="sd-finish-actions">
            <button
              className="sd-btn sd-btn-gold"
              onClick={() => onComplete(earnedXp + 30, session.completionInsight)}
            >
              <Check size={18} /> ثبت دستاورد و بازگشت
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentActivity) return null;

  return (
    <div className="sd-session-modal" dir="rtl">
      <div className="sd-session-card">
        {/* Top Header */}
        <div className="sd-session-header">
          <button className="sd-session-close" onClick={onClose} aria-label="خروج از جلسه">
            <X size={18} />
          </button>
          <div className="sd-session-meta">
            <span className="sd-session-badge">{session.dayLabel}</span>
            <span className="sd-session-title-inline">{session.title}</span>
          </div>
          <div className="sd-session-step-count">
            {stepIndex + 1} از {totalSteps}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="sd-session-progress-track">
          <div className="sd-session-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>

        {/* Activity Content Area */}
        <div className="sd-activity-container">
          <div className="sd-activity-type-label">
            <Compass size={14} />
            <span>{currentActivity.title}</span>
            <span className="sd-activity-xp">+{currentActivity.xp} XP</span>
          </div>

          {/* 1. LESSON ACTIVITY */}
          {currentActivity.type === 'lesson' && (
            <div className="sd-act-lesson">
              <div className="sd-act-body">
                <p>{currentActivity.body}</p>
              </div>
              {currentActivity.insight && (
                <div className="sd-act-insight-box">
                  <Sparkles size={16} />
                  <span>{currentActivity.insight}</span>
                </div>
              )}
              <div className="sd-act-actions">
                <button
                  className="sd-btn sd-btn-gold"
                  onClick={() => handleNextStep(currentActivity.xp)}
                >
                  فهمیدم، گام بعد <ArrowLeft size={16} />
                </button>
              </div>
            </div>
          )}

          {/* 2. EMOTION CHECK-IN ACTIVITY */}
          {currentActivity.type === 'emotionCheckin' && (
            <div className="sd-act-emotion">
              <p className="sd-act-subtext">همین الان چه حال یا احساسی در تو جریان دارد؟</p>
              <div className="sd-emotions-grid">
                {EMOTIONS.map(em => {
                  const isSelected = selectedEmotion === em.id;
                  return (
                    <button
                      key={em.id}
                      className={`sd-emotion-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedEmotion(em.id as EmotionId)}
                    >
                      <span className="sd-em-emoji">{em.emoji}</span>
                      <span className="sd-em-label">{em.label}</span>
                    </button>
                  );
                })}
              </div>

              {selectedEmotion && (
                <div className="sd-emotion-intensity-box">
                  <div className="sd-intensity-label">
                    <span>شدت احساس:</span>
                    <strong>{emotionIntensity} از ۵</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={emotionIntensity}
                    onChange={e => setEmotionIntensity(Number(e.target.value))}
                    className="sd-slider-input"
                  />
                </div>
              )}

              <div className="sd-act-actions">
                <button
                  className="sd-btn sd-btn-gold"
                  disabled={!selectedEmotion}
                  onClick={() => handleNextStep(currentActivity.xp)}
                >
                  ثبت احساس و ادامه <ArrowLeft size={16} />
                </button>
              </div>
            </div>
          )}

          {/* 3. QUIZ ACTIVITY */}
          {currentActivity.type === 'quiz' && (
            <div className="sd-act-quiz">
              <h3 className="sd-quiz-q">{currentActivity.question}</h3>
              <div className="sd-quiz-options">
                {currentActivity.options.map((opt: QuizOption, idx: number) => {
                  const isChosen = quizAnswered === idx;
                  const showFeedback = quizAnswered !== null;
                  let optClass = 'sd-quiz-opt';
                  if (showFeedback) {
                    if (opt.correct) optClass += ' correct';
                    else if (isChosen) optClass += ' wrong';
                  } else if (isChosen) {
                    optClass += ' selected';
                  }

                  return (
                    <button
                      key={idx}
                      className={optClass}
                      disabled={showFeedback}
                      onClick={() => setQuizAnswered(idx)}
                    >
                      <span className="sd-opt-num">{idx + 1}</span>
                      <span className="sd-opt-text">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {quizAnswered !== null && (
                <div className="sd-quiz-explanation">
                  <p>{currentActivity.options[quizAnswered]?.explanation}</p>
                </div>
              )}

              <div className="sd-act-actions">
                <button
                  className="sd-btn sd-btn-gold"
                  disabled={quizAnswered === null}
                  onClick={() => handleNextStep(currentActivity.xp)}
                >
                  ادامه مسیر <ArrowLeft size={16} />
                </button>
              </div>
            </div>
          )}

          {/* 4. REFLECTION & JOURNAL PROMPT ACTIVITY */}
          {(currentActivity.type === 'reflection' || currentActivity.type === 'journalPrompt') && (
            <div className="sd-act-reflection">
              <div className="sd-prompt-card">
                <Feather size={20} className="sd-prompt-feather" />
                <p className="sd-prompt-content">{currentActivity.prompt}</p>
              </div>
              <textarea
                className="sd-act-textarea"
                rows={4}
                placeholder={currentActivity.placeholder || 'اینجا بنویس. فقط برای خودت، بدون قضاوت…'}
                value={reflectionText}
                onChange={e => setReflectionText(e.target.value)}
              />
              <div className="sd-act-actions">
                <button
                  className="sd-btn sd-btn-gold"
                  onClick={() => {
                    if (reflectionText.trim()) {
                      onSaveJournal(currentActivity.prompt, reflectionText.trim());
                    }
                    handleNextStep(currentActivity.xp);
                  }}
                >
                  {reflectionText.trim() ? 'ثبت در دفتر و گام بعد' : 'رد کردن این گام'}{' '}
                  <ArrowLeft size={16} />
                </button>
              </div>
            </div>
          )}

          {/* 5. MULTI-CHOICE ACTIVITY */}
          {currentActivity.type === 'multiChoice' && (
            <div className="sd-act-multichoice">
              <h3 className="sd-mc-question">{currentActivity.question}</h3>
              <p className="sd-mc-hint">
                حداقل {currentActivity.minSelect} و حداکثر {currentActivity.maxSelect} مورد انتخاب کن
              </p>
              <div className="sd-mc-choices">
                {currentActivity.choices.map((choice, i) => {
                  const isSelected = multiSelected.includes(choice);
                  return (
                    <button
                      key={i}
                      className={`sd-mc-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        if (isSelected) {
                          setMultiSelected(multiSelected.filter(c => c !== choice));
                        } else if (multiSelected.length < currentActivity.maxSelect) {
                          setMultiSelected([...multiSelected, choice]);
                        }
                      }}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>
              {multiSelected.length >= currentActivity.minSelect && (
                <div className="sd-act-insight-box">
                  <Sparkles size={16} />
                  <span>{currentActivity.insight}</span>
                </div>
              )}
              <div className="sd-act-actions">
                <button
                  className="sd-btn sd-btn-gold"
                  disabled={multiSelected.length < currentActivity.minSelect}
                  onClick={() => handleNextStep(currentActivity.xp)}
                >
                  تأیید و ادامه <ArrowLeft size={16} />
                </button>
              </div>
            </div>
          )}

          {/* 6. SLIDER ACTIVITY */}
          {currentActivity.type === 'slider' && (
            <div className="sd-act-slider">
              <h3 className="sd-slider-q">{currentActivity.question}</h3>
              <div className="sd-spectrum-labels">
                <span>{currentActivity.leftLabel}</span>
                <span>{currentActivity.rightLabel}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderValue}
                onChange={e => setSliderValue(Number(e.target.value))}
                className="sd-slider-input"
              />
              <div className="sd-act-insight-box">
                <Sparkles size={16} />
                <span>{currentActivity.insight}</span>
              </div>
              <div className="sd-act-actions">
                <button
                  className="sd-btn sd-btn-gold"
                  onClick={() => handleNextStep(currentActivity.xp)}
                >
                  ثبت نظر و ادامه <ArrowLeft size={16} />
                </button>
              </div>
            </div>
          )}

          {/* 7. PRACTICE ACTIVITY */}
          {currentActivity.type === 'practice' && (
            <div className="sd-act-practice">
              <div className="sd-practice-steps">
                {currentActivity.steps.map((st, i) => (
                  <div key={i} className="sd-practice-step-item">
                    <span className="sd-pstep-num">{i + 1}</span>
                    <p>{st}</p>
                  </div>
                ))}
              </div>
              <div className="sd-act-actions">
                <button
                  className={`sd-btn ${practiceDone ? 'sd-btn-gold' : 'sd-btn-outline'}`}
                  onClick={() => setPracticeDone(true)}
                >
                  {practiceDone ? <Check size={16} /> : null} {currentActivity.completionLabel}
                </button>
                {practiceDone && (
                  <button
                    className="sd-btn sd-btn-gold"
                    onClick={() => handleNextStep(currentActivity.xp)}
                  >
                    گام بعد <ArrowLeft size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 8. KNOWLEDGE CARD ACTIVITY */}
          {currentActivity.type === 'knowledgeCard' && (
            <div className="sd-act-kcard">
              <div className="sd-kcard-box">
                <span className="sd-kcard-tag">{currentActivity.tradition || currentActivity.language || 'مفهوم معرفتی'}</span>
                <h3>{currentActivity.concept}</h3>
                <p>{currentActivity.body}</p>
                {currentActivity.reflection && (
                  <div className="sd-kcard-reflection">
                    <strong>تأمل:</strong> {currentActivity.reflection}
                  </div>
                )}
              </div>
              <div className="sd-act-actions">
                <button
                  className="sd-btn sd-btn-gold"
                  onClick={() => handleNextStep(currentActivity.xp)}
                >
                  آموختم <ArrowLeft size={16} />
                </button>
              </div>
            </div>
          )}

          {/* 9. DIVINE NAME ACTIVITY */}
          {currentActivity.type === 'divineName' && (
            <div className="sd-act-divine">
              {(() => {
                const dn = DIVINE_NAMES.find(n => n.id === currentActivity.nameId) || DIVINE_NAMES[0];
                return (
                  <div className="sd-divine-spotlight">
                    <div className="sd-divine-title-wrap">
                      <span className="sd-divine-tradition">{dn.tradition} · {dn.language}</span>
                      <h2 className="sd-divine-name">{dn.originalScript || dn.name}</h2>
                      <span className="sd-divine-trans">{dn.transliteration} — {dn.literalMeaning}</span>
                    </div>
                    <p className="sd-divine-expl">{dn.shortExplanation}</p>
                    <div className="sd-divine-card-ref">
                      <strong>تأمل امروز:</strong>
                      <p>{dn.reflection}</p>
                    </div>
                    <div className="sd-divine-card-prac">
                      <strong>تمرین عملی:</strong>
                      <p>{dn.practice}</p>
                    </div>
                  </div>
                );
              })()}
              <div className="sd-act-actions">
                <button
                  className="sd-btn sd-btn-gold"
                  onClick={() => handleNextStep(currentActivity.xp)}
                >
                  دریافت معرفت و گام بعد <ArrowLeft size={16} />
                </button>
              </div>
            </div>
          )}

          {/* 10. VALUE CHOICE ACTIVITY */}
          {currentActivity.type === 'valueChoice' && (
            <div className="sd-act-vchoice">
              <p className="sd-act-subtext">از میان کارت‌های زیر، {currentActivity.selectCount} ارزش مهم‌تر را انتخاب کن:</p>
              <div className="sd-vchoice-grid">
                {currentActivity.cards.map((card, i) => {
                  const isSel = selectedValues.includes(card);
                  return (
                    <button
                      key={i}
                      className={`sd-vcard-btn ${isSel ? 'selected' : ''}`}
                      onClick={() => {
                        if (isSel) setSelectedValues(selectedValues.filter(v => v !== card));
                        else if (selectedValues.length < currentActivity.selectCount) {
                          setSelectedValues([...selectedValues, card]);
                        }
                      }}
                    >
                      {card}
                    </button>
                  );
                })}
              </div>
              {selectedValues.length === currentActivity.selectCount && (
                <div className="sd-act-insight-box">
                  <Sparkles size={16} />
                  <span>{currentActivity.insight}</span>
                </div>
              )}
              <div className="sd-act-actions">
                <button
                  className="sd-btn sd-btn-gold"
                  disabled={selectedValues.length < currentActivity.selectCount}
                  onClick={() => handleNextStep(currentActivity.xp)}
                >
                  تأیید ارزش‌ها <ArrowLeft size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

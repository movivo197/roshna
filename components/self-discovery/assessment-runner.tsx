'use client';

import { useState } from 'react';
import {
  HelpCircle, Check, ArrowLeft, ArrowRight, Sparkles,
  ShieldCheck, AlertTriangle, RotateCcw, BarChart2, Star
} from 'lucide-react';
import type { Assessment, AssessmentQuestion } from '@/lib/self-discovery/types';
import type { AssessmentResult } from '@/lib/self-discovery/state';

interface AssessmentRunnerProps {
  assessment: Assessment;
  onComplete: (result: AssessmentResult) => void;
  onClose: () => void;
}

export default function AssessmentRunner({
  assessment,
  onComplete,
  onClose,
}: AssessmentRunnerProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalResult, setFinalResult] = useState<AssessmentResult | null>(null);

  const q: AssessmentQuestion | undefined = assessment.questions[currentIdx];
  const totalQuestions = assessment.questions.length;

  function handleAnswer(val: number | string) {
    if (!q) return;
    const nextAnswers = { ...answers, [q.id]: val };
    setAnswers(nextAnswers);

    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      calculateAndFinish(nextAnswers);
    }
  }

  function calculateAndFinish(allAnswers: Record<string, number | string>) {
    // Calculate dimension scores
    const dimensionScores: Record<string, number> = {};
    const dimensionCounts: Record<string, number> = {};

    assessment.dimensions.forEach(d => {
      dimensionScores[d.id] = 0;
      dimensionCounts[d.id] = 0;
    });

    assessment.questions.forEach(question => {
      if (question.dimension && allAnswers[question.id] !== undefined) {
        const val = Number(allAnswers[question.id]);
        if (!isNaN(val)) {
          dimensionScores[question.dimension] = (dimensionScores[question.dimension] || 0) + val;
          dimensionCounts[question.dimension] = (dimensionCounts[question.dimension] || 0) + 1;
        }
      }
    });

    // Normalize to 0-100%
    const normalized: Record<string, number> = {};
    assessment.dimensions.forEach(d => {
      const count = dimensionCounts[d.id] || 1;
      const raw = dimensionScores[d.id] || 0;
      normalized[d.id] = Math.min(100, Math.max(15, Math.round((raw / (count * 5)) * 100)));
    });

    const result: AssessmentResult = {
      assessmentId: assessment.id,
      completedAt: new Date().toISOString(),
      scores: normalized,
      responses: allAnswers,
    };

    setFinalResult(result);
    setIsCompleted(true);
    onComplete(result);
  }

  if (isCompleted && finalResult) {
    return (
      <div className="sd-assessment-view" dir="rtl">
        <div className="sd-ass-result-card">
          <div className="sd-ass-res-header">
            <span className="sd-pill-gold">تحلیل چندبُعدی نتایج</span>
            <h2>{assessment.title}</h2>
            <p className="sd-ass-disclaimer">
              <ShieldCheck size={16} /> {assessment.safetyNote}
            </p>
          </div>

          {/* Dimension Bars */}
          <div className="sd-dimension-bars">
            {assessment.dimensions.map(dim => {
              const score = finalResult.scores[dim.id] || 50;
              return (
                <div key={dim.id} className="sd-dim-row">
                  <div className="sd-dim-meta">
                    <strong>{dim.label}</strong>
                    <span>{score}٪</span>
                  </div>
                  <div className="sd-dim-track">
                    <div className="sd-dim-fill" style={{ width: `${score}%` }} />
                  </div>
                  <div className="sd-dim-cards">
                    <div className="sd-dim-card strength">
                      <span className="sd-dim-badge">نقطه قوت:</span>
                      <p>{dim.strength}</p>
                    </div>
                    <div className="sd-dim-card watchout">
                      <span className="sd-dim-badge">نقطه توجه:</span>
                      <p>{dim.watchout}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="sd-ass-actions">
            <button className="sd-btn sd-btn-gold" onClick={onClose}>
              <Check size={16} /> ثبت در نقشه من و بازگشت
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!q) return null;

  return (
    <div className="sd-assessment-view" dir="rtl">
      <div className="sd-ass-card">
        {/* Header */}
        <div className="sd-ass-header">
          <div className="sd-ass-meta">
            <span className="sd-pill-gold">{assessment.title}</span>
            <span className="sd-ass-count">
              سؤال {currentIdx + 1} از {totalQuestions}
            </span>
          </div>
          <button className="sd-text-btn" onClick={onClose}>
            انصراف
          </button>
        </div>

        {/* Progress track */}
        <div className="sd-ass-track">
          <div
            className="sd-ass-fill"
            style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }}
          />
        </div>

        {/* Question Text */}
        <div className="sd-ass-question-body">
          <h3 className="sd-ass-question-text">{q.text}</h3>

          {/* 1. LIKERT SCALE */}
          {q.type === 'likert' && (
            <div className="sd-likert-options">
              {[
                { label: 'کاملاً مخالفم', score: 1 },
                { label: 'مخالفم', score: 2 },
                { label: 'نظری ندارم / خنثی', score: 3 },
                { label: 'موافقم', score: 4 },
                { label: 'کاملاً موافقم', score: 5 },
              ].map(opt => (
                <button
                  key={opt.score}
                  className="sd-likert-btn"
                  onClick={() => handleAnswer(opt.score)}
                >
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* 2. BINARY CHOICE */}
          {q.type === 'binary' && q.options && (
            <div className="sd-binary-options">
              {q.options.map((opt, oi) => (
                <button
                  key={oi}
                  className="sd-binary-btn"
                  onClick={() => handleAnswer(oi === 0 ? 5 : 1)}
                >
                  <span>{opt}</span>
                </button>
              ))}
            </div>
          )}

          {/* 3. SCENARIO CHOICE */}
          {q.type === 'scenario' && q.options && (
            <div className="sd-scenario-options">
              {q.options.map((opt, oi) => (
                <button
                  key={oi}
                  className="sd-scenario-btn"
                  onClick={() => handleAnswer(oi + 1)}
                >
                  <span className="sd-opt-num">{oi + 1}</span>
                  <span>{opt}</span>
                </button>
              ))}
            </div>
          )}

          {/* 4. SLIDER */}
          {q.type === 'slider' && (
            <div className="sd-ass-slider-box">
              <div className="sd-spectrum-labels">
                <span>بیشتر منطقی و تحلیلی</span>
                <span>بیشتر شهودی و احساسی</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                defaultValue="3"
                id="ass-slider"
                className="sd-slider-input"
              />
              <button
                className="sd-btn sd-btn-gold"
                style={{ marginTop: 20 }}
                onClick={() => {
                  const val = Number((document.getElementById('ass-slider') as HTMLInputElement)?.value || 3);
                  handleAnswer(val);
                }}
              >
                ثبت پاسخ و ادامه <ArrowLeft size={16} />
              </button>
            </div>
          )}

          {/* 5. PICK 3 */}
          {q.type === 'pick3' && q.options && (
            <div className="sd-pick3-box">
              <div className="sd-pick3-grid">
                {q.options.map((opt, oi) => (
                  <button
                    key={oi}
                    className="sd-mc-chip"
                    onClick={() => handleAnswer(oi + 1)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

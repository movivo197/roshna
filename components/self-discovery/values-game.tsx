'use client';

import { useState } from 'react';
import {
  Compass, Check, Sparkles, ArrowLeft, ArrowRight,
  RotateCcw, ShieldCheck, Heart, Star, Award
} from 'lucide-react';
import { VALUE_CARDS } from '@/lib/self-discovery/content';
import type { ValueCard } from '@/lib/self-discovery/types';

interface ValuesGameProps {
  currentValues: string[];
  onSaveValues: (values: string[]) => void;
  onClose?: () => void;
}

type Stage = 1 | 2 | 3 | 4 | 'result';

export default function ValuesGame({
  currentValues,
  onSaveValues,
  onClose,
}: ValuesGameProps) {
  const [stage, setStage] = useState<Stage>(1);

  // Stage 1: Select 10 from 30
  const [stage1Selected, setStage1Selected] = useState<string[]>([]);
  // Stage 2: Select 5 from 10
  const [stage2Selected, setStage2Selected] = useState<string[]>([]);
  // Stage 3: Select 3 from 5
  const [stage3Selected, setStage3Selected] = useState<string[]>([]);
  // Stage 4: Ordered top 3
  const [finalOrdered, setFinalOrdered] = useState<string[]>([]);

  function toggleStage1(id: string) {
    if (stage1Selected.includes(id)) {
      setStage1Selected(stage1Selected.filter(v => v !== id));
    } else if (stage1Selected.length < 10) {
      setStage1Selected([...stage1Selected, id]);
    }
  }

  function toggleStage2(id: string) {
    if (stage2Selected.includes(id)) {
      setStage2Selected(stage2Selected.filter(v => v !== id));
    } else if (stage2Selected.length < 5) {
      setStage2Selected([...stage2Selected, id]);
    }
  }

  function toggleStage3(id: string) {
    if (stage3Selected.includes(id)) {
      setStage3Selected(stage3Selected.filter(v => v !== id));
    } else if (stage3Selected.length < 3) {
      setStage3Selected([...stage3Selected, id]);
    }
  }

  function handleOrderPick(id: string) {
    if (finalOrdered.includes(id)) {
      setFinalOrdered(finalOrdered.filter(v => v !== id));
    } else if (finalOrdered.length < 3) {
      setFinalOrdered([...finalOrdered, id]);
    }
  }

  function completeGame() {
    onSaveValues(finalOrdered);
    setStage('result');
  }

  function resetGame() {
    setStage(1);
    setStage1Selected([]);
    setStage2Selected([]);
    setStage3Selected([]);
    setFinalOrdered([]);
  }

  return (
    <div className="sd-values-game" dir="rtl">
      {/* Header */}
      <div className="sd-vg-header">
        <span className="sd-pill-gold"><Compass size={14} /> آزمایشگاه ارزش‌ها</span>
        <h2>قطب‌نمای ارزش‌های واقعی من</h2>
        <p>
          ارزش‌ها ستون‌های هویت و انتخاب‌های تو هستند. در این تمرین تعاملی، طی ۴ گام عمیق، ۳ ارزش بنیادی زندگی‌ات را کشف می‌کنی.
        </p>

        {stage !== 'result' && (
          <div className="sd-vg-stepper">
            <div className={`sd-step-dot ${stage >= 1 ? 'active' : ''}`}>۱. انتخاب ۱۰</div>
            <div className={`sd-step-dot ${stage >= 2 ? 'active' : ''}`}>۲. غربال به ۵</div>
            <div className={`sd-step-dot ${stage >= 3 ? 'active' : ''}`}>۳. گزینش ۳</div>
            <div className={`sd-step-dot ${stage >= 4 ? 'active' : ''}`}>۴. اولویت‌بندی</div>
          </div>
        )}
      </div>

      {/* ── STAGE 1: PICK 10 ── */}
      {stage === 1 && (
        <div className="sd-vg-stage">
          <div className="sd-stage-instruction">
            <h3>گام اول: ۱۰ ارزشی که برایت معنادار هستند را انتخاب کن</h3>
            <span className="sd-stage-counter">{stage1Selected.length} از ۱۰ مورد انتخاب شده</span>
          </div>

          <div className="sd-cards-pool">
            {VALUE_CARDS.map(card => {
              const isSelected = stage1Selected.includes(card.label);
              return (
                <button
                  key={card.id}
                  className={`sd-value-card-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleStage1(card.label)}
                >
                  <span className="sd-vc-icon">{card.icon}</span>
                  <span className="sd-vc-label">{card.label}</span>
                  {isSelected && <Check size={14} className="sd-vc-check" />}
                </button>
              );
            })}
          </div>

          <div className="sd-stage-actions">
            <button
              className="sd-btn sd-btn-gold"
              disabled={stage1Selected.length !== 10}
              onClick={() => setStage(2)}
            >
              رفتن به گام دوم (غربال به ۵ مورد) <ArrowLeft size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── STAGE 2: PICK 5 FROM 10 ── */}
      {stage === 2 && (
        <div className="sd-vg-stage">
          <div className="sd-stage-instruction">
            <h3>گام دوم: اکنون دایره را تنگ‌تر کن؛ از میان این ۱۰ ارزش، ۵ مورد حیاتی‌تر را برگزین</h3>
            <span className="sd-stage-counter">{stage2Selected.length} از ۵ مورد انتخاب شده</span>
          </div>

          <div className="sd-cards-pool">
            {stage1Selected.map(label => {
              const isSelected = stage2Selected.includes(label);
              const card = VALUE_CARDS.find(c => c.label === label);
              return (
                <button
                  key={label}
                  className={`sd-value-card-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleStage2(label)}
                >
                  <span className="sd-vc-icon">{card?.icon || '💎'}</span>
                  <span className="sd-vc-label">{label}</span>
                  {isSelected && <Check size={14} className="sd-vc-check" />}
                </button>
              );
            })}
          </div>

          <div className="sd-stage-actions">
            <button className="sd-btn sd-btn-outline" onClick={() => setStage(1)}>
              <ArrowRight size={16} /> بازگشت به گام اول
            </button>
            <button
              className="sd-btn sd-btn-gold"
              disabled={stage2Selected.length !== 5}
              onClick={() => setStage(3)}
            >
              رفتن به گام سوم (انتخاب ۳ مورد) <ArrowLeft size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── STAGE 3: PICK 3 FROM 5 ── */}
      {stage === 3 && (
        <div className="sd-vg-stage">
          <div className="sd-stage-instruction">
            <h3>گام سوم: سخت‌ترین تصمیم؛ کدام ۳ ارزش غیرقابل مذاکره‌ترین ارزش‌های زندگی تواند؟</h3>
            <span className="sd-stage-counter">{stage3Selected.length} از ۳ مورد انتخاب شده</span>
          </div>

          <div className="sd-cards-pool">
            {stage2Selected.map(label => {
              const isSelected = stage3Selected.includes(label);
              const card = VALUE_CARDS.find(c => c.label === label);
              return (
                <button
                  key={label}
                  className={`sd-value-card-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleStage3(label)}
                >
                  <span className="sd-vc-icon">{card?.icon || '💎'}</span>
                  <span className="sd-vc-label">{label}</span>
                  {isSelected && <Check size={14} className="sd-vc-check" />}
                </button>
              );
            })}
          </div>

          <div className="sd-stage-actions">
            <button className="sd-btn sd-btn-outline" onClick={() => setStage(2)}>
              <ArrowRight size={16} /> بازگشت به ۵ مورد
            </button>
            <button
              className="sd-btn sd-btn-gold"
              disabled={stage3Selected.length !== 3}
              onClick={() => setStage(4)}
            >
              رفتن به گام چهارم (اولویت‌بندی) <ArrowLeft size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── STAGE 4: RANK 1, 2, 3 ── */}
      {stage === 4 && (
        <div className="sd-vg-stage">
          <div className="sd-stage-instruction">
            <h3>گام چهارم: به ترتیب، ارزش شماره ۱، ۲ و ۳ را کلیک کن</h3>
            <span className="sd-stage-counter">
              {finalOrdered.length === 3 ? 'رتبه‌بندی کامل شد' : `انتخاب رتبه ${finalOrdered.length + 1}`}
            </span>
          </div>

          <div className="sd-cards-pool">
            {stage3Selected.map(label => {
              const rankIdx = finalOrdered.indexOf(label);
              const isRanked = rankIdx !== -1;
              const card = VALUE_CARDS.find(c => c.label === label);
              return (
                <button
                  key={label}
                  className={`sd-value-card-btn ${isRanked ? 'selected' : ''}`}
                  onClick={() => handleOrderPick(label)}
                >
                  <span className="sd-vc-icon">{card?.icon || '💎'}</span>
                  <span className="sd-vc-label">{label}</span>
                  {isRanked && (
                    <span className="sd-rank-badge">رتبه {rankIdx + 1}</span>
                  )}
                </button>
              );
            })}
          </div>

          {finalOrdered.length > 0 && (
            <div className="sd-ordered-preview">
              {finalOrdered.map((val, idx) => (
                <div key={val} className="sd-order-item">
                  <span className="sd-order-idx">{idx + 1}</span>
                  <span>{val}</span>
                </div>
              ))}
            </div>
          )}

          <div className="sd-stage-actions">
            <button className="sd-btn sd-btn-outline" onClick={() => setFinalOrdered([])}>
              <RotateCcw size={16} /> چینش مجدد
            </button>
            <button
              className="sd-btn sd-btn-gold"
              disabled={finalOrdered.length !== 3}
              onClick={completeGame}
            >
              <Check size={16} /> ثبت نهایی در قطب‌نمای من (+۲۰ XP)
            </button>
          </div>
        </div>
      )}

      {/* ── STAGE: RESULT ── */}
      {stage === 'result' && (
        <div className="sd-vg-result">
          <div className="sd-result-badge">
            <Compass size={40} className="sd-finish-sparkle" />
          </div>
          <h2>قطب‌نمای ارزش‌های تو مشخص شد!</h2>
          <p className="sd-result-desc">
            این سه ارزش، راهنمای تصمیم‌های بزرگ و کوچک تو در کار، رابطه، اوقات فراغت و سبک زندگی هستند:
          </p>

          <div className="sd-compass-pillars">
            {finalOrdered.map((val, i) => {
              const card = VALUE_CARDS.find(c => c.label === val);
              return (
                <div key={val} className="sd-compass-pillar">
                  <span className="sd-pillar-rank">رتبه {i + 1}</span>
                  <div className="sd-pillar-icon">{card?.icon || '⭐'}</div>
                  <strong className="sd-pillar-title">{val}</strong>
                </div>
              );
            })}
          </div>

          <div className="sd-result-insight">
            <Sparkles size={18} />
            <p>
              هر زمان بر سر دوراهی ماندی، از خودت بپرس: «کدام انتخاب با این ۳ ارزش بنیادی هماهنگ‌تر است؟»
            </p>
          </div>

          <div className="sd-stage-actions">
            <button className="sd-btn sd-btn-outline" onClick={resetGame}>
              <RotateCcw size={16} /> تکرار آزمون ارزش‌ها
            </button>
            {onClose && (
              <button className="sd-btn sd-btn-gold" onClick={onClose}>
                مشاهده در نقشه من
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

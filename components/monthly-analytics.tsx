'use client';

import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  Calendar,
  Sparkles,
  Heart,
  Focus,
  CheckCircle2,
  Flame,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Share2,
  Bot,
  Brain,
  Zap,
  Info,
  ChevronLeft,
  PieChart,
  BarChart3,
  Activity,
  Smile,
  Frown,
  Meh,
  SunMedium
} from 'lucide-react';
import { faNumber as n, lastDays, shiftDay, dayKey, WHEEL_AREAS, type GrowthData } from '@/lib/growth-data';
import type { Destination } from '@/lib/product';

interface MonthlyAnalyticsProps {
  data: GrowthData;
  go?: (dest: Destination) => void;
  notify?: (msg: string) => void;
  today?: string;
}

const MOOD_META = [
  { val: 1, label: 'سنگین و ابری', emoji: '😔', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  { val: 2, label: 'کمی بی‌رمق', emoji: '😕', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' },
  { val: 3, label: 'معمولی و آرام', emoji: '😐', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)' },
  { val: 4, label: 'خوب و پرانرژی', emoji: '🙂', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  { val: 5, label: 'عالی و شکوفا', emoji: '😄', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
];

export default function MonthlyAnalytics({
  data,
  go,
  notify,
  today = dayKey(),
}: MonthlyAnalyticsProps) {
  const [rangeDays, setRangeDays] = useState<number>(30);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Time Series Range
  const dateRange = useMemo(() => {
    return lastDays(rangeDays, today);
  }, [rangeDays, today]);

  // Prior period for trend comparison
  const priorRange = useMemo(() => {
    const startOfPrior = shiftDay(dateRange[0], -1);
    return lastDays(rangeDays, startOfPrior);
  }, [dateRange, rangeDays]);

  // ── Metrics Calculation ──
  const metrics = useMemo(() => {
    // Current period
    const curTasks = data.tasks.filter(t => dateRange.includes(t.date));
    const curDoneTasks = curTasks.filter(t => t.done).length;
    const curTaskTotal = curTasks.length;

    const curFocusRecords = data.focus.filter(f => dateRange.includes(f.date));
    const curFocusMinutes = curFocusRecords.reduce((acc, f) => acc + f.minutes, 0);

    const curJournal = data.journal.filter(j => dateRange.includes(j.date));
    const curMoodAvg = curJournal.length
      ? curJournal.reduce((s, j) => s + j.mood, 0) / curJournal.length
      : 0;

    let habitCheckins = 0;
    let habitTotalPossibilities = data.habits.length * dateRange.length;
    data.habits.forEach(h => {
      h.days.forEach(d => {
        if (dateRange.includes(d)) habitCheckins++;
      });
    });
    const habitConsistency = habitTotalPossibilities > 0
      ? Math.round((habitCheckins / habitTotalPossibilities) * 100)
      : 0;

    // Prior period comparison
    const priorJournal = data.journal.filter(j => priorRange.includes(j.date));
    const priorMoodAvg = priorJournal.length
      ? priorJournal.reduce((s, j) => s + j.mood, 0) / priorJournal.length
      : 0;

    const priorFocusRecords = data.focus.filter(f => priorRange.includes(f.date));
    const priorFocusMinutes = priorFocusRecords.reduce((acc, f) => acc + f.minutes, 0);

    const priorTasks = data.tasks.filter(t => priorRange.includes(t.date));
    const priorDoneTasks = priorTasks.filter(t => t.done).length;

    const moodDiff = priorMoodAvg > 0 ? Number((curMoodAvg - priorMoodAvg).toFixed(1)) : 0;
    const focusDiffPct = priorFocusMinutes > 0
      ? Math.round(((curFocusMinutes - priorFocusMinutes) / priorFocusMinutes) * 100)
      : 0;
    const taskDiffPct = priorDoneTasks > 0
      ? Math.round(((curDoneTasks - priorDoneTasks) / priorDoneTasks) * 100)
      : 0;

    return {
      curDoneTasks,
      curTaskTotal,
      taskCompletionRate: curTaskTotal > 0 ? Math.round((curDoneTasks / curTaskTotal) * 100) : 0,
      curFocusMinutes,
      curFocusHours: Number((curFocusMinutes / 60).toFixed(1)),
      curMoodAvg: Number(curMoodAvg.toFixed(1)),
      journalCount: curJournal.length,
      habitCheckins,
      habitConsistency,
      moodDiff,
      focusDiffPct,
      taskDiffPct,
    };
  }, [data, dateRange, priorRange]);

  // ── Daily Mood & Focus Timeline Series ──
  const timelineSeries = useMemo(() => {
    return dateRange.map(d => {
      const journalForDay = data.journal.filter(j => j.date === d);
      const mood = journalForDay.length
        ? journalForDay.reduce((s, j) => s + j.mood, 0) / journalForDay.length
        : null;
      const notes = journalForDay.map(j => j.text).filter(Boolean);
      const gratitudes = journalForDay.map(j => j.gratitude).filter(Boolean);

      const focusMin = data.focus.filter(f => f.date === d).reduce((s, f) => s + f.minutes, 0);
      const tasksDone = data.tasks.filter(t => t.date === d && t.done).length;
      const habitsDone = data.habits.filter(h => h.days.includes(d)).map(h => h.title);

      return {
        date: d,
        mood,
        focusMin,
        tasksDone,
        habitsDone,
        notes,
        gratitudes,
      };
    });
  }, [data, dateRange]);

  // ── Habit-Mood Synergy (Correlation Analysis) ──
  const habitSynergies = useMemo(() => {
    if (!data.habits.length || !data.journal.length) return [];

    return data.habits.map(habit => {
      const activeDays = habit.days.filter(d => dateRange.includes(d));
      const inactiveDays = dateRange.filter(d => !habit.days.includes(d));

      const activeJournals = data.journal.filter(j => activeDays.includes(j.date));
      const inactiveJournals = data.journal.filter(j => inactiveDays.includes(j.date));

      const activeAvg = activeJournals.length
        ? activeJournals.reduce((s, j) => s + j.mood, 0) / activeJournals.length
        : null;
      const inactiveAvg = inactiveJournals.length
        ? inactiveJournals.reduce((s, j) => s + j.mood, 0) / inactiveJournals.length
        : null;

      let boostScore = 0;
      if (activeAvg !== null && inactiveAvg !== null) {
        boostScore = Number((activeAvg - inactiveAvg).toFixed(2));
      }

      return {
        id: habit.id,
        title: habit.title,
        color: habit.color,
        activeCount: activeDays.length,
        activeAvg: activeAvg !== null ? Number(activeAvg.toFixed(1)) : null,
        inactiveAvg: inactiveAvg !== null ? Number(inactiveAvg.toFixed(1)) : null,
        boostScore,
      };
    }).sort((a, b) => b.boostScore - a.boostScore);
  }, [data, dateRange]);

  // ── Life Wheel Analysis ──
  const wheelAnalysis = useMemo(() => {
    const scores = WHEEL_AREAS.map(area => ({
      area,
      score: data.wheel[area] ?? 5,
    }));
    const sorted = [...scores].sort((a, b) => b.score - a.score);
    const topPillars = sorted.slice(0, 2);
    const growthFocus = sorted.slice(-2);
    const avgScore = Number((scores.reduce((s, a) => s + a.score, 0) / scores.length).toFixed(1));

    return {
      scores,
      topPillars,
      growthFocus,
      avgScore,
    };
  }, [data.wheel]);

  // ── Smart Dynamic Growth Prescription ──
  const prescription = useMemo(() => {
    const { curMoodAvg, curFocusMinutes, taskCompletionRate, habitConsistency } = metrics;
    const items: { title: string; desc: string; tag: string; type: 'mind' | 'focus' | 'habit' }[] = [];

    // 1. Mind & Emotional State Insight
    if (curMoodAvg >= 4.0) {
      items.push({
        title: 'شتاب مثبت و شکوفایی ذهنی',
        desc: 'حال روانی شما در سطح عالی و پرانرژی ارزیابی شده است. این زمان بهترین فرصت برای بازخوانی درس‌ها و تثبیت تصمیم‌های بزرگ در آینه شخصی است.',
        tag: 'تعادل عاطفی عالی',
        type: 'mind',
      });
    } else if (curMoodAvg >= 2.8) {
      items.push({
        title: 'ثبات و حرکت پیوسته',
        desc: 'وضعیت عاطفی شما در محدوده متعادل قرار دارد. افزودن مکث‌های کوتاه تنفسی (گجت ۴-۷-۸ یا مدیتیشن روزانه) انرژی ذهنی شما را به مراتب ارتقا می‌دهد.',
        tag: 'پایداری آرام',
        type: 'mind',
      });
    } else {
      items.push({
        title: 'نیاز به مهربانی با خود و بازیابی انرژی',
        desc: 'فشارهای ذهنی اخیر نشان می‌دهد که نیاز به کاهش حجم وظایف، استراحت عمیق‌تر و شنیدن اصوات آرامش‌بخش رادیو لوفای دارید.',
        tag: 'خودمراقبتی فوری',
        type: 'mind',
      });
    }

    // 2. Focus & Productivity Insight
    if (curFocusMinutes >= 600) {
      items.push({
        title: 'تسلط بر کار عمیق و تمرکز متمرکز',
        desc: `ثبت بیش از ${n(metrics.curFocusHours)} ساعت تمرکز خالص نشان از قدرت بالای توجه شما دارد. حتماً بین بلوک‌های ۵۰ دقیقه‌ای استراحت فعال ۵ دقیقه‌ای داشته باشید.`,
        tag: 'عملکرد برتر',
        type: 'focus',
      });
    } else {
      items.push({
        title: 'گسترش بازه‌های کار عمیق',
        desc: 'پیشنهاد می‌شود هر روز حداقل یک بلوک ۲۵ دقیقه‌ای تمرکز (پومودورو) بدون اعلان و شبکه برای مهم‌ترین اولویت روزانه خود اختصاص دهید.',
        tag: 'بهینه‌سازی تمرکز',
        type: 'focus',
      });
    }

    // 3. Habit & Routine Insight
    const topHabit = habitSynergies.find(h => h.boostScore > 0);
    if (topHabit) {
      items.push({
        title: `اثر شگفت‌انگیز عادت «${topHabit.title}»`,
        desc: `تحلیل داده‌ها نشان می‌دهد روزهایی که عادت «${topHabit.title}» را انجام داده‌اید، میانگین حال روحی شما ${n(Math.abs(topHabit.boostScore))} نمره بالاتر بوده است! به تثبیت این عادت طلایی ادامه دهید.`,
        tag: 'محرک رشد شخصی',
        type: 'habit',
      });
    } else if (habitConsistency >= 60) {
      items.push({
        title: 'پیوستگی منظم در عادت‌های پایدار',
        desc: `نرخ تداوم ${n(habitConsistency)}٪ در عادت‌ها نشان‌دهنده تعهد عمیق شما به رشد تدریجی است. قانون «حتی ۲ دقیقه در روزهای سخت» را حفظ کنید.`,
        tag: 'زنجیره عادت مستحکم',
        type: 'habit',
      });
    } else {
      items.push({
        title: 'ساده‌سازی عادت‌ها برای پایداری',
        desc: 'اگر پیوستگی عادت‌ها افت کرده، مقیاس عادت را بسیار کوچک کنید تا مقاومت ذهنی شکسته شود (مثلاً ۱ صفحه کتاب یا ۱ لیوان آب).',
        tag: 'تکنیک شروع خرد',
        type: 'habit',
      });
    }

    return items;
  }, [metrics, habitSynergies]);

  // Selected Day Details
  const selectedDayInfo = useMemo(() => {
    if (!selectedDay) return null;
    return timelineSeries.find(t => t.date === selectedDay) || null;
  }, [selectedDay, timelineSeries]);

  // Export report
  const handleExportSummary = () => {
    const reportText = `📊 گزارش تحلیلی رشد و حال روان - روشنا
📅 دوره: ${n(rangeDays)} روز اخیر (تا ${today})
👤 کاربر: ${data.profile.name || 'همراه روشنا'}

🌟 خلاصه عملکرد:
• میانگین شاخص خلق‌وخو: ${n(metrics.curMoodAvg)} از ۵
• کل زمان تمرکز عمیق: ${n(metrics.curFocusHours)} ساعت (${n(metrics.curFocusMinutes)} دقیقه)
• کارهای انجام‌شده: ${n(metrics.curDoneTasks)} از ${n(metrics.curTaskTotal)} (${n(metrics.taskCompletionRate)}٪)
• تداوم در عادات: ${n(metrics.habitConsistency)}٪
• تعداد یادداشت‌های خودشناسی: ${n(metrics.journalCount)}

🌱 ستون‌های برتر زندگی:
${wheelAnalysis.topPillars.map(p => `• ${p.area}: ${n(p.score)} از ۱۰`).join('\n')}

💡 نسخه و راهکار رشد:
${prescription.map(p => `• ${p.title}: ${p.desc}`).join('\n\n')}

روشنا | زندگی، به سبک تو`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roshana-growth-analytics-${today}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    if (notify) notify('گزارش تحلیلی ماهانه دانلود شد.');
  };

  return (
    <div className="an-root" dir="rtl">
      {/* ── Top Header & Range Switcher ── */}
      <div className="an-header">
        <div className="an-title-group">
          <div className="an-eyebrow">
            <span className="an-dot" />
            مرکز داده‌کاوی و تحلیل پیشرفته رشد
          </div>
          <h1>
            دیدبان جامع <span className="an-gradient-text">خلق‌و‌خو و بهره‌وری</span>
          </h1>
          <p>
            بررسی الگوهای ذهنی، همبستگی عادت‌ها با حال خوب و نسخه تحلیلی رشد در بازه {n(rangeDays)} روزه
          </p>
        </div>

        <div className="an-header-actions">
          <div className="an-range-selector" role="group" aria-label="انتخاب بازه زمانی">
            {[
              { days: 7, label: '۷ روز' },
              { days: 14, label: '۱۴ روز' },
              { days: 30, label: '۳۰ روز' },
              { days: 90, label: '۹۰ روز' },
            ].map(item => (
              <button
                key={item.days}
                className={`an-range-btn ${rangeDays === item.days ? 'active' : ''}`}
                onClick={() => {
                  setRangeDays(item.days);
                  setSelectedDay(null);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button className="an-btn-secondary" onClick={handleExportSummary}>
            <Download size={16} />
            خروجی گزارش
          </button>
        </div>
      </div>

      {/* ── 4 Primary Metric Cards ── */}
      <div className="an-stats-grid">
        {/* Metric 1: Mood Index */}
        <div className="an-stat-card">
          <div className="an-stat-head">
            <span className="an-stat-icon mood">
              <Smile size={22} />
            </span>
            <span className="an-stat-tag">
              {metrics.moodDiff > 0 ? (
                <span className="an-trend positive">
                  <ArrowUpRight size={13} /> +{n(metrics.moodDiff)}
                </span>
              ) : metrics.moodDiff < 0 ? (
                <span className="an-trend negative">
                  <ArrowDownRight size={13} /> {n(metrics.moodDiff)}
                </span>
              ) : (
                <span className="an-trend neutral">پایدار</span>
              )}
            </span>
          </div>
          <div className="an-stat-body">
            <div className="an-stat-val">
              <strong>{metrics.curMoodAvg > 0 ? n(metrics.curMoodAvg) : '—'}</strong>
              <small>/ ۵</small>
            </div>
            <div className="an-stat-label">شاخص میانگین خلق‌وخو</div>
            <div className="an-stat-sub">
              {metrics.curMoodAvg >= 4 ? 'سرشار از آرامش و انگیزه' : metrics.curMoodAvg >= 2.5 ? 'متعادل و پایدار' : 'نیازمند بازیابی انرژی'}
            </div>
          </div>
        </div>

        {/* Metric 2: Deep Work / Focus */}
        <div className="an-stat-card">
          <div className="an-stat-head">
            <span className="an-stat-icon focus">
              <Focus size={22} />
            </span>
            <span className="an-stat-tag">
              {metrics.focusDiffPct !== 0 && (
                <span className={`an-trend ${metrics.focusDiffPct > 0 ? 'positive' : 'neutral'}`}>
                  {metrics.focusDiffPct > 0 ? `+${n(metrics.focusDiffPct)}٪` : `${n(metrics.focusDiffPct)}٪`}
                </span>
              )}
            </span>
          </div>
          <div className="an-stat-body">
            <div className="an-stat-val">
              <strong>{n(metrics.curFocusHours)}</strong>
              <small>ساعت</small>
            </div>
            <div className="an-stat-label">زمان تمرکز عمیق</div>
            <div className="an-stat-sub">{n(metrics.curFocusMinutes)} دقیقه کار خالص پومودورو</div>
          </div>
        </div>

        {/* Metric 3: Task Execution Rate */}
        <div className="an-stat-card">
          <div className="an-stat-head">
            <span className="an-stat-icon tasks">
              <CheckCircle2 size={22} />
            </span>
            <span className="an-stat-tag">
              <span className="an-trend positive">{n(metrics.curDoneTasks)} انجام‌شده</span>
            </span>
          </div>
          <div className="an-stat-body">
            <div className="an-stat-val">
              <strong>{n(metrics.taskCompletionRate)}</strong>
              <small>٪</small>
            </div>
            <div className="an-stat-label">نرخ تسخیر وظایف</div>
            <div className="an-stat-sub">از مجموع {n(metrics.curTaskTotal)} برنامه ثبت‌شده</div>
          </div>
        </div>

        {/* Metric 4: Habit Consistency */}
        <div className="an-stat-card">
          <div className="an-stat-head">
            <span className="an-stat-icon habits">
              <Flame size={22} />
            </span>
            <span className="an-stat-tag">
              <span className="an-trend positive">{n(metrics.habitCheckins)} تیک موفق</span>
            </span>
          </div>
          <div className="an-stat-body">
            <div className="an-stat-val">
              <strong>{n(metrics.habitConsistency)}</strong>
              <small>٪</small>
            </div>
            <div className="an-stat-label">تداوم در عادت‌های کوچک</div>
            <div className="an-stat-sub">در سراسر {n(data.habits.length)} روتین فعال</div>
          </div>
        </div>
      </div>

      {/* ── Main Analytical Grid ── */}
      <div className="an-grid-2col">
        {/* Left: Mood Waveform & Energy Chart */}
        <div className="an-card an-chart-card">
          <div className="an-card-head">
            <div>
              <h2>
                <Activity size={20} /> نمودار موجی حال روان و انرژی ذهن
              </h2>
              <p>روند نوسانات عاطفی در طول {n(rangeDays)} روز گذشته (برای جزییات روی روزها بزنید)</p>
            </div>
            <div className="an-chart-legend">
              <span className="an-legend-item">
                <i style={{ background: '#8b5cf6' }} /> حال روحی (۱ تا ۵)
              </span>
            </div>
          </div>

          {/* SVG Waveform Chart */}
          <div className="an-wave-container">
            <svg
              className="an-wave-svg"
              viewBox={`0 0 ${Math.max(600, timelineSeries.length * 28)} 220`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="moodWaveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.45" />
                  <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[1, 2, 3, 4, 5].map(lvl => {
                const y = 200 - (lvl / 5) * 160;
                return (
                  <g key={lvl} className="an-grid-line">
                    <line x1="0" y1={y} x2="100%" y2={y} stroke="var(--line)" strokeDasharray="4 4" />
                    <text x="10" y={y + 4} fill="var(--muted)" fontSize="10">
                      {MOOD_META.find(m => m.val === lvl)?.emoji} {n(lvl)}
                    </text>
                  </g>
                );
              })}

              {/* Wave Area and Line */}
              {(() => {
                const widthPerPoint = Math.max(600, timelineSeries.length * 28) / (timelineSeries.length - 1 || 1);
                const points = timelineSeries.map((item, idx) => {
                  const x = idx * widthPerPoint;
                  const moodVal = item.mood ?? 3;
                  const y = 200 - (moodVal / 5) * 160;
                  return { x, y, item };
                });

                if (points.length < 2) return null;

                // Create SVG path
                const linePath = points.reduce((acc, p, i) => {
                  if (i === 0) return `M ${p.x} ${p.y}`;
                  const prev = points[i - 1];
                  const cx = (prev.x + p.x) / 2;
                  return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
                }, '');

                const first = points[0];
                const last = points[points.length - 1];
                const areaPath = `${linePath} L ${last.x} 200 L ${first.x} 200 Z`;

                return (
                  <>
                    <path d={areaPath} fill="url(#moodWaveGrad)" />
                    <path d={linePath} fill="none" stroke="#8b5cf6" strokeWidth="3.5" strokeLinecap="round" />

                    {/* Interactive dots */}
                    {points.map((p, idx) => {
                      const isSelected = selectedDay === p.item.date;
                      return (
                        <g
                          key={p.item.date}
                          className={`an-wave-dot ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => setSelectedDay(p.item.date)}
                          style={{ cursor: 'pointer' }}
                        >
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={isSelected ? 7 : p.item.mood ? 4.5 : 2.5}
                            fill={p.item.mood ? '#8b5cf6' : 'var(--line)'}
                            stroke="var(--surface)"
                            strokeWidth={isSelected ? 3 : 2}
                          />
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </div>

          {/* Selected Day Inspector Panel */}
          {selectedDayInfo ? (
            <div className="an-day-inspector">
              <div className="an-inspector-head">
                <div className="an-insp-title">
                  <Calendar size={15} />
                  <span>{new Date(`${selectedDayInfo.date}T12:00:00`).toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </div>
                <div className="an-insp-mood">
                  {selectedDayInfo.mood ? (
                    <span className="an-mood-badge">
                      {MOOD_META.find(m => m.val === Math.round(selectedDayInfo.mood!))?.emoji}{' '}
                      {MOOD_META.find(m => m.val === Math.round(selectedDayInfo.mood!))?.label} ({n(Number(selectedDayInfo.mood.toFixed(1)))})
                    </span>
                  ) : (
                    <span className="an-mood-badge muted">ثبت نشده</span>
                  )}
                </div>
              </div>

              <div className="an-inspector-stats">
                <div className="an-insp-metric">
                  <Focus size={14} />
                  <span>تمرکز: {n(selectedDayInfo.focusMin)} دقیقه</span>
                </div>
                <div className="an-insp-metric">
                  <CheckCircle2 size={14} />
                  <span>کارهای انجام‌شده: {n(selectedDayInfo.tasksDone)}</span>
                </div>
                <div className="an-insp-metric">
                  <Flame size={14} />
                  <span>عادات: {n(selectedDayInfo.habitsDone.length)} مورد</span>
                </div>
              </div>

              {selectedDayInfo.notes.length > 0 && (
                <div className="an-insp-notes">
                  <small>بخشی از یادداشت این روز:</small>
                  <p>«{selectedDayInfo.notes[0]}»</p>
                </div>
              )}
            </div>
          ) : (
            <div className="an-chart-hint">
              <Info size={14} /> برای مشاهده جزییات هر روز، روی نقاط نمودار بالا کلیک کنید.
            </div>
          )}
        </div>

        {/* Right: Habit-Mood Synergy Matrix */}
        <div className="an-card an-synergy-card">
          <div className="an-card-head">
            <div>
              <h2>
                <Brain size={20} /> ماتریس همبستگی عادات و حال خوب
              </h2>
              <p>کدام عادت‌ها بیشترین تأثیر مثبت را در شادابی و آرامش شما داشته‌اند؟</p>
            </div>
            <span className="an-chip-gold">تحلیل الگو</span>
          </div>

          <div className="an-synergy-list">
            {habitSynergies.length > 0 ? (
              habitSynergies.map(h => (
                <div key={h.id} className="an-synergy-item">
                  <div className="an-syn-info">
                    <span className="an-syn-bullet" style={{ background: h.color }} />
                    <strong>{h.title}</strong>
                    <small>
                      {n(h.activeCount)} روز اجرا · میانگین حال:{' '}
                      {h.activeAvg ? n(h.activeAvg) : '—'}
                    </small>
                  </div>

                  <div className="an-syn-impact">
                    {h.boostScore > 0 ? (
                      <span className="an-boost positive">
                        <ArrowUpRight size={13} /> +{n(h.boostScore)} ارتقای روحیه
                      </span>
                    ) : h.boostScore < 0 ? (
                      <span className="an-boost neutral">بی‌اثر / خنثی</span>
                    ) : (
                      <span className="an-boost neutral">داده ناکافی</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="an-empty-state">
                <Flame size={32} />
                <p>با ثبت منظم عادت‌ها و یادداشت‌های روزانه، همبستگی‌های هوشمند اینجا شکل می‌گیرند.</p>
              </div>
            )}
          </div>

          <div className="an-synergy-foot">
            <Zap size={15} />
            <span>
              نکته علمی: عادت‌های پایدار با ترشح دوپامین و کاهش کورتیزول، ثبات عاطفی را تقویت می‌کنند.
            </span>
          </div>
        </div>
      </div>

      {/* ── Life Wheel Radar & Balance Section ── */}
      <div className="an-grid-2col" style={{ marginTop: '24px' }}>
        {/* Left: 8 Life Pillars Breakdown */}
        <div className="an-card">
          <div className="an-card-head">
            <div>
              <h2>
                <PieChart size={20} /> تعادل در ۸ ستون چرخه زندگی
              </h2>
              <p>میانگین رضایت شخصی در تمام ابعاد زیست شما ({n(wheelAnalysis.avgScore)} از ۱۰)</p>
            </div>
            {go && (
              <button className="an-text-btn" onClick={() => go('wheel')}>
                ویرایش چرخه <ChevronLeft size={14} />
              </button>
            )}
          </div>

          <div className="an-wheel-bars">
            {wheelAnalysis.scores.map((item, idx) => (
              <div key={item.area} className="an-wheel-row">
                <div className="an-wheel-label">
                  <span>{item.area}</span>
                  <strong>{n(item.score)}/۱۰</strong>
                </div>
                <div className="an-bar-track">
                  <div
                    className="an-bar-fill"
                    style={{
                      width: `${(item.score / 10) * 100}%`,
                      background:
                        item.score >= 8
                          ? 'linear-gradient(90deg, #10b981, #059669)'
                          : item.score >= 5
                          ? 'linear-gradient(90deg, #3b82f6, #6366f1)'
                          : 'linear-gradient(90deg, #f59e0b, #ef4444)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="an-wheel-insights">
            <div className="an-wi-card pillar">
              <small>ستون‌های قدرت شما</small>
              <strong>{wheelAnalysis.topPillars.map(p => p.area).join(' · ')}</strong>
            </div>
            <div className="an-wi-card growth">
              <small>کانون توجه و رشد</small>
              <strong>{wheelAnalysis.growthFocus.map(p => p.area).join(' · ')}</strong>
            </div>
          </div>
        </div>

        {/* Right: AI & Clinical Growth Prescription */}
        <div className="an-card an-prescription-card">
          <div className="an-card-head">
            <div>
              <h2>
                <Sparkles size={20} /> نسخه تحلیلی و راهکارهای رشد شخصی
              </h2>
              <p>سنتز هوشمند داده‌های رفتاری شما و توصیه‌های اقدام‌محور</p>
            </div>
            <span className="an-badge-ai">تحلیل هوشمند</span>
          </div>

          <div className="an-presc-list">
            {prescription.map((item, idx) => (
              <div key={idx} className="an-presc-item">
                <div className="an-presc-head">
                  <span className={`an-presc-type ${item.type}`}>
                    {item.type === 'mind' ? <Heart size={14} /> : item.type === 'focus' ? <Focus size={14} /> : <Flame size={14} />}
                  </span>
                  <strong>{item.title}</strong>
                  <span className="an-presc-tag">{item.tag}</span>
                </div>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>

          {go && (
            <div className="an-presc-action">
              <button className="an-btn-mentor" onClick={() => go('mentor')}>
                <Bot size={17} />
                گفتگوی تکمیلی با مربی هوش مصنوعی درباره این گزارش
                <ChevronLeft size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

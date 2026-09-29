'use client';

import { useState } from 'react';
import {
  Globe, BookOpen, Star, Bookmark, Check, Sparkles,
  Search, Filter, ChevronLeft, Volume2, HelpCircle, Layers,
  Compass, ArrowLeft, Heart, Flame, Sun, ShieldCheck, Feather, Play
} from 'lucide-react';
import { DIVINE_NAMES, DIVINE_THEMES, DAILY_PRACTICES } from '@/lib/self-discovery/content';
import type { DivineName, ThemeEntry, DailyPracticeItem, PracticeCategory } from '@/lib/self-discovery/types';
import PracticePlayer from './practice-player';

interface DivineAtlasProps {
  savedIds: string[];
  learnedIds: string[];
  onToggleSave: (id: string) => void;
  onMarkLearned: (id: string) => void;
  onAddXp: (xp: number) => void;
}

type AtlasTab = 'names' | 'practices' | 'themes' | 'languages' | 'minigame';

export default function DivineAtlas({
  savedIds,
  learnedIds,
  onToggleSave,
  onMarkLearned,
  onAddXp,
}: DivineAtlasProps) {
  const [activeTab, setActiveTab] = useState<AtlasTab>('names');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTradition, setSelectedTradition] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Practices filtering and state
  const [selectedPracticeCat, setSelectedPracticeCat] = useState<string>('all');
  const [completedPractices, setCompletedPractices] = useState<string[]>([]);
  const [activePracticeModal, setActivePracticeModal] = useState<DailyPracticeItem | null>(null);

  // Mini-game state
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizStep, setQuizStep] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);

  const miniGameQuestions = [
    {
      q: 'واژه «Deus» متعلق به کدام ریشه زبانی و سنّت است؟',
      options: ['لاتین', 'یونانی', 'سانسکریت', 'عبری'],
      correct: 0,
      note: 'Deus در زبان لاتین ریشه هندواروپایی با Theos و Deva دارد و در مسیحیت غربی به کار رفته است.',
    },
    {
      q: 'کدام عبارت در آیین سیک به معنای «شگفت‌انگیز — سرور روشنگر» است؟',
      options: ['Brahman', 'Waheguru', 'Elohim', 'Ahura Mazda'],
      correct: 1,
      note: 'Waheguru از دو بخش Wahe (شگفتی) و Guru (معلم روشنگر) در پنجابی تشکیل شده است.',
    },
    {
      q: 'در زبان یونانی عهد جدید و متون باستان، واژه «Theos» به چه معناست؟',
      options: ['خرد مطلق', 'کلام نخستین', 'خدا', 'نور ازلی'],
      correct: 2,
      note: 'Theos واژه یونانی برای خداست و ریشه در زبان باستان دارد.',
    },
    {
      q: 'کلمه «خدا» در ریشه‌شناسی فارسی به چه معنایی اشاره دارد؟',
      options: ['آفریننده کائنات', 'آنکه خودش و ذاتاً هست', 'بسیار مهربان', 'سرور آسمان‌ها'],
      correct: 1,
      note: '«خدا» از «خود» و «آ» ساخته شده؛ یعنی آنکه ذاتاً وجود دارد.',
    },
    {
      q: 'واژه «تائو» (Tao) در حکمت کهن چین و دائو ده جینگ به چه معناست؟',
      options: ['«راه» و اصل جاری هستی', 'پادشاه آسمان‌ها', 'روح کوهستان', 'آتش مقدس'],
      correct: 0,
      note: 'تائو اصل ناپیدا و هماهنگ‌کننده کائنات است که بدون زورآزمایی، همه‌چیز را حیات می‌بخشد.',
    },
    {
      q: 'در آموزه‌های زرتشتی، صفت «اشا وهیشته» (اردیبهشت) بر چه اصلی دلالت دارد؟',
      options: ['بهترین راستی و دادگری کیهانی', 'ثروت بی‌پایان', 'پیروزی در جنگ', 'خواب عمیق'],
      correct: 0,
      note: 'اشا وهیشته قانون ازلی راستی، نظم و عدل در جهان است که در برابر دروغ قرار دارد.',
    },
  ];

  // Unique traditions and languages for filtering
  const traditions = ['all', ...Array.from(new Set(DIVINE_NAMES.map(n => n.tradition)))];
  const languages = ['all', ...Array.from(new Set(DIVINE_NAMES.map(n => n.language)))];

  // Filtered names
  const filteredNames = DIVINE_NAMES.filter(n => {
    const matchesSearch =
      n.name.includes(searchQuery) ||
      n.transliteration.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.literalMeaning.includes(searchQuery) ||
      n.shortExplanation.includes(searchQuery);
    const matchesTradition = selectedTradition === 'all' || n.tradition === selectedTradition;
    const matchesLanguage = selectedLanguage === 'all' || n.language === selectedLanguage;
    return matchesSearch && matchesTradition && matchesLanguage;
  });

  // Filtered practices
  const filteredPractices = DAILY_PRACTICES.filter(p => {
    return selectedPracticeCat === 'all' || p.category === selectedPracticeCat;
  });

  function handleCompletePractice(id: string) {
    if (!completedPractices.includes(id)) {
      setCompletedPractices([...completedPractices, id]);
      onAddXp(15);
    }
  }

  return (
    <div className="sd-atlas-root" dir="rtl">
      {/* Atlas Header */}
      <div className="sd-atlas-hero">
        <div className="sd-atlas-hero-content">
          <span className="sd-eyebrow"><Globe size={14} /> اطلس معرفت و ادیان جهان</span>
          <h2>نام‌ها، زبان‌ها، سنت‌ها و تمرینات اتصال الهی</h2>
          <p>
            گنجینه‌ای جهانی و محترمانه از مفاهیم الهی، حکمت ملل، ادیان توحیدی و سنن کهن معنوی، همراه با تمرینات روزمره خودآگاهی و درست‌زیستن.
          </p>
        </div>

        {/* Atlas Sub-Navigation */}
        <div className="sd-atlas-nav">
          <button
            className={`sd-atlas-tab ${activeTab === 'names' ? 'active' : ''}`}
            onClick={() => setActiveTab('names')}
          >
            <BookOpen size={16} /> اسماء و مفاهیم ({DIVINE_NAMES.length})
          </button>
          <button
            className={`sd-atlas-tab ${activeTab === 'practices' ? 'active' : ''}`}
            onClick={() => setActiveTab('practices')}
          >
            <Sun size={16} /> تمرینات وحدت و درست‌زیستن ({DAILY_PRACTICES.length})
          </button>
          <button
            className={`sd-atlas-tab ${activeTab === 'themes' ? 'active' : ''}`}
            onClick={() => setActiveTab('themes')}
          >
            <Layers size={16} /> مضامین تطبیقی
          </button>
          <button
            className={`sd-atlas-tab ${activeTab === 'languages' ? 'active' : ''}`}
            onClick={() => setActiveTab('languages')}
          >
            <Globe size={16} /> خدا در زبان‌ها
          </button>
          <button
            className={`sd-atlas-tab ${activeTab === 'minigame' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('minigame');
              setQuizScore(null);
              setQuizStep(0);
              setSelectedOpt(null);
            }}
          >
            <Sparkles size={16} /> مینی‌گیم زبانی
          </button>
        </div>
      </div>

      {/* ── TAB 1: NAMES EXPLORER ── */}
      {activeTab === 'names' && (
        <div className="sd-atlas-names-view">
          {/* Search and Filters */}
          <div className="sd-atlas-filters-bar">
            <div className="sd-search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="جست‌وجو در میان نام‌ها، معانی، سنت‌ها یا زبان‌ها…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="sd-filter-group">
              <select
                value={selectedTradition}
                onChange={e => setSelectedTradition(e.target.value)}
                className="sd-select"
              >
                <option value="all">همه سنت‌ها ({DIVINE_NAMES.length})</option>
                {traditions.filter(t => t !== 'all').map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <select
                value={selectedLanguage}
                onChange={e => setSelectedLanguage(e.target.value)}
                className="sd-select"
              >
                <option value="all">همه زبان‌ها</option>
                {languages.filter(l => l !== 'all').map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="sd-names-grid">
            {filteredNames.map(item => {
              const isExpanded = expandedCardId === item.id;
              const isSaved = savedIds.includes(item.id);
              const isLearned = learnedIds.includes(item.id);

              return (
                <article
                  key={item.id}
                  className={`sd-name-card ${isExpanded ? 'expanded' : ''} ${isLearned ? 'learned' : ''}`}
                >
                  <div className="sd-name-card-top">
                    <div className="sd-name-meta-tags">
                      <span className="sd-pill-tradition">{item.tradition}</span>
                      <span className="sd-pill-lang">{item.language}</span>
                    </div>
                    <div className="sd-name-card-tools">
                      <button
                        className={`sd-icon-btn ${isSaved ? 'active' : ''}`}
                        onClick={() => onToggleSave(item.id)}
                        title={isSaved ? 'حذف از نشان‌شده‌ها' : 'نشان کردن'}
                      >
                        <Bookmark size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="sd-name-main">
                    <h3 className="sd-name-title" dir="ltr">
                      {item.originalScript || item.name}
                    </h3>
                    <div className="sd-name-subtitle">
                      <strong>{item.transliteration}</strong> — {item.literalMeaning}
                    </div>
                  </div>

                  <p className="sd-name-excerpt">{item.shortExplanation}</p>

                  {isExpanded && (
                    <div className="sd-name-expanded-body">
                      {item.reflection && (
                        <div className="sd-name-section-box reflection">
                          <strong>تأمل روزمره:</strong>
                          <p>{item.reflection}</p>
                        </div>
                      )}
                      {item.practice && (
                        <div className="sd-name-section-box practice">
                          <strong>تمرین عملی:</strong>
                          <p>{item.practice}</p>
                        </div>
                      )}
                      {item.sourceNote && (
                        <div className="sd-name-source-note">
                          <small>منبع / زمینه سنتی: {item.sourceNote}</small>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="sd-name-card-footer">
                    <button
                      className="sd-text-btn"
                      onClick={() => setExpandedCardId(isExpanded ? null : item.id)}
                    >
                      {isExpanded ? 'نمایش کمتر' : 'مشاهده بیشتر و تأمل'}
                    </button>
                    <button
                      className={`sd-learned-btn ${isLearned ? 'done' : ''}`}
                      onClick={() => onMarkLearned(item.id)}
                    >
                      {isLearned ? <Check size={14} /> : <Sparkles size={14} />}
                      <span>{isLearned ? 'آموخته شد' : 'آموختم (+۵ XP)'}</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 2: DAILY PRACTICES (UNITY, MINDFULNESS, VIRTUES) ── */}
      {activeTab === 'practices' && (
        <div className="sd-practices-view">
          <div className="sd-practices-intro-card">
            <div className="sd-intro-icon"><Sun size={28} /></div>
            <div>
              <h3>تمرینات حفظ وحدت، خودآگاهی و درست‌زیستن</h3>
              <p>
                پیوند دانش نظری با زیست واقعی؛ تمریناتی کوتاه و کاربردی برای حضور در محضر حق، نظاره‌گری درون، اخلاق نیک‌منشی و صلح با کائنات.
              </p>
            </div>
          </div>

          {/* Category Chips */}
          <div className="sd-practice-cats-row">
            {[
              { id: 'all', label: 'همه تمرین‌ها' },
              { id: 'unity', label: 'وحدت و اتصال' },
              { id: 'mindfulness', label: 'خودآگاهی و مراقبه' },
              { id: 'virtue', label: 'نیک‌منشی و اخلاق' },
              { id: 'presence', label: 'سکوت و حضور' },
              { id: 'gratitude', label: 'شکرگزاری' },
              { id: 'surrender', label: 'توکل و تسلیم' },
              { id: 'compassion', label: 'مهربانی و بخشش' },
            ].map(cat => (
              <button
                key={cat.id}
                className={`sd-pcat-btn ${selectedPracticeCat === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedPracticeCat(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Practices Grid */}
          <div className="sd-practices-full-grid">
            {filteredPractices.map(practice => {
              const isDone = completedPractices.includes(practice.id);

              return (
                <article key={practice.id} className={`sd-practice-card ${isDone ? 'done' : ''}`}>
                  <div className="sd-pcard-header">
                    <span className="sd-pcard-icon">{practice.icon}</span>
                    <span className="sd-pcard-cat-badge">{practice.categoryLabel}</span>
                    <span className="sd-pcard-time">{practice.durationMinutes} دقیقه</span>
                  </div>

                  <h3 className="sd-pcard-title">{practice.title}</h3>
                  <p className="sd-pcard-objective"><strong>هدف:</strong> {practice.objective}</p>

                  <div className="sd-pcard-steps-box">
                    <span className="sd-steps-label">مراحل انجام:</span>
                    <ol>
                      {practice.steps.map((st, i) => (
                        <li key={i}>{st}</li>
                      ))}
                    </ol>
                  </div>

                  <div className="sd-pcard-contemplation">
                    <Feather size={14} />
                    <p>{practice.contemplation}</p>
                  </div>

                  <div className="sd-pcard-action-box">
                    <strong>عمل روزمره:</strong>
                    <p>{practice.dailyAction}</p>
                  </div>

                  <div className="sd-pcard-foot">
                    <button
                      className="sd-btn sd-btn-gold sd-btn-glow"
                      onClick={() => setActivePracticeModal(practice)}
                    >
                      <Play size={15} /> اجرای زنده و تنفس ذن
                    </button>
                    <button
                      className={`sd-btn ${isDone ? 'sd-btn-outline done' : 'sd-btn-outline'}`}
                      onClick={() => handleCompletePractice(practice.id)}
                    >
                      {isDone ? (
                        <>
                          <Check size={16} /> انجام شد
                        </>
                      ) : (
                        'ثبت مستقیم (+۱۵ XP)'
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 3: COMPARATIVE THEMES ── */}
      {activeTab === 'themes' && (
        <div className="sd-themes-view">
          <div className="sd-notice-banner">
            <Compass size={18} />
            <p>
              توجه الهیاتی: صفات و مضامین در هر سنت بر اساس بافت تاریخی و اعتقادی همان دین تعریف می‌شوند و نباید به عنوان برابری ساده‌انگارانه نگریسته شوند.
            </p>
          </div>

          <div className="sd-themes-list">
            {DIVINE_THEMES.map((themeGroup, i) => (
              <div key={i} className="sd-theme-card">
                <h3 className="sd-theme-header">
                  <Star size={18} className="sd-gold-icon" />
                  مضمون: «{themeGroup.theme}» در آینه سنت‌های گوناگون
                </h3>
                <div className="sd-theme-entries-grid">
                  {themeGroup.entries.map((entry, j) => (
                    <div key={j} className="sd-theme-entry-box">
                      <div className="sd-entry-head">
                        <span className="sd-entry-tradition">{entry.tradition}</span>
                        <strong className="sd-entry-concept">{entry.concept}</strong>
                      </div>
                      <p className="sd-entry-desc">{entry.shortExplanation}</p>
                      {entry.note && (
                        <small className="sd-entry-note">نکته: {entry.note}</small>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: LANGUAGES EXPLORER ── */}
      {activeTab === 'languages' && (
        <div className="sd-languages-view">
          <div className="sd-lang-cards-grid">
            {DIVINE_NAMES.filter(n => ['god-english', 'khoda', 'theos', 'deus', 'elohim', 'tengri', 'bog'].includes(n.id)).map(n => (
              <div key={n.id} className="sd-lang-card">
                <div className="sd-lang-badge">{n.language}</div>
                <h3 className="sd-lang-word" dir="ltr">{n.name}</h3>
                <p className="sd-lang-meaning"><strong>معنای ریشه‌ای:</strong> {n.literalMeaning}</p>
                <p className="sd-lang-desc">{n.shortExplanation}</p>
                <div className="sd-lang-reflection">
                  <strong>تأمل زبانی:</strong> {n.reflection}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 5: MINI-GAME ── */}
      {activeTab === 'minigame' && (
        <div className="sd-minigame-view">
          {quizScore === null ? (
            <div className="sd-minigame-card">
              <div className="sd-minigame-header">
                <span className="sd-pill-gold">مینی‌گیم معرفت و زبان‌ها</span>
                <span>سؤال {quizStep + 1} از {miniGameQuestions.length}</span>
              </div>

              <h3 className="sd-mg-question">{miniGameQuestions[quizStep].q}</h3>

              <div className="sd-mg-options">
                {miniGameQuestions[quizStep].options.map((opt, oi) => {
                  const isChosen = selectedOpt === oi;
                  const isDone = selectedOpt !== null;
                  const isCorrect = oi === miniGameQuestions[quizStep].correct;

                  let cls = 'sd-mg-opt';
                  if (isDone) {
                    if (isCorrect) cls += ' correct';
                    else if (isChosen) cls += ' wrong';
                  }

                  return (
                    <button
                      key={oi}
                      className={cls}
                      disabled={isDone}
                      onClick={() => {
                        setSelectedOpt(oi);
                        if (oi === miniGameQuestions[quizStep].correct) {
                          onAddXp(10);
                        }
                      }}
                    >
                      <span>{opt}</span>
                      {isDone && isCorrect && <Check size={16} />}
                    </button>
                  );
                })}
              </div>

              {selectedOpt !== null && (
                <div className="sd-mg-note-box">
                  <p>{miniGameQuestions[quizStep].note}</p>
                  <button
                    className="sd-btn sd-btn-gold"
                    onClick={() => {
                      if (quizStep < miniGameQuestions.length - 1) {
                        setQuizStep(quizStep + 1);
                        setSelectedOpt(null);
                      } else {
                        setQuizScore(100);
                      }
                    }}
                  >
                    {quizStep < miniGameQuestions.length - 1 ? 'سؤال بعد' : 'مشاهده نتیجه'}{' '}
                    <ArrowLeft size={16} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="sd-minigame-result">
              <Sparkles size={40} className="sd-finish-sparkle" />
              <h2>آفرین! دانش معرفتی خود را محک زدی</h2>
              <p>شما تمام سؤالات این بخش را با موفقیت مرور کردید و با ریشه‌های زبانی و حکمت ادیان آشنا شدید.</p>
              <button
                className="sd-btn sd-btn-gold"
                onClick={() => {
                  setQuizScore(null);
                  setQuizStep(0);
                  setSelectedOpt(null);
                }}
              >
                تکرار مینی‌گیم
              </button>
            </div>
          )}
        </div>
      )}

      {/* Interactive Practice Player Modal */}
      {activePracticeModal && (
        <PracticePlayer
          practice={activePracticeModal}
          onClose={() => setActivePracticeModal(null)}
          onComplete={() => {
            handleCompletePractice(activePracticeModal.id);
            setActivePracticeModal(null);
          }}
        />
      )}
    </div>
  );
}

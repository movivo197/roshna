'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Volume2, CheckCircle2, ChevronRight, BookOpen, MessageCircle,
  Lightbulb, PenTool, Sparkles, AlertCircle, RotateCcw, Trophy,
  Flame, Play, Brain, Star, ArrowLeft, Globe, Zap
} from 'lucide-react';
import { DailyLesson, LanguageProfile, languageProfileSchema, dailyLessonSchema } from '@/lib/language/types';
import { getCurriculumLesson } from '@/lib/language/curriculum';
import styles from './language.module.css';

const PROFILE_KEY = 'roshana-language-profile-v1';
const LESSON_KEY = 'roshana-language-lesson-v1';

const defaultProfile: LanguageProfile = {
  level: 'beginner',
  interests: ['زندگی روزمره', 'سفر', 'تکنولوژی', 'ارتباطات'],
  learnedWords: [],
  learnedGrammar: [],
  streak: 0,
  lastPracticeDate: null,
};

type Section = 'vocab' | 'grammar' | 'conversation' | 'quiz';

const SECTION_ORDER: Section[] = ['vocab', 'grammar', 'conversation', 'quiz'];

export default function LanguageHub() {
  const [profile, setProfile] = useState<LanguageProfile>(defaultProfile);
  const [lesson, setLesson] = useState<DailyLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [activeSection, setActiveSection] = useState<Section>('vocab');
  const [completedSections, setCompletedSections] = useState<Set<Section>>(new Set());
  const [activeVocab, setActiveVocab] = useState(0);

  useEffect(() => {
    const savedProfile = localStorage.getItem(PROFILE_KEY);
    let currentProfile = defaultProfile;
    if (savedProfile) {
      try {
        const result = languageProfileSchema.safeParse(JSON.parse(savedProfile));
        if (result.success) currentProfile = result.data;
      } catch { }
    }
    setProfile(currentProfile);

    const today = new Date().toISOString().slice(0, 10);
    if (currentProfile.lastPracticeDate === today) setCompleted(true);

    let hasValid = false;
    const raw = localStorage.getItem(LESSON_KEY);
    if (raw) {
      try {
        const saved = dailyLessonSchema.parse(JSON.parse(raw));
        if (saved.id === today) { setLesson(saved); hasValid = true; setLoading(false); }
      } catch { }
    }
    if (!hasValid && currentProfile.lastPracticeDate !== today) fetchNewLesson(currentProfile);
    else setLoading(false);
  }, []);

  async function fetchNewLesson(p: LanguageProfile) {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/language/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const parsed = dailyLessonSchema.parse(data);
      setLesson(parsed);
      localStorage.setItem(LESSON_KEY, JSON.stringify(parsed));
    } catch {
      // Offline or network error: instantly fall back to rich curated curriculum
      try {
        const fallback = getCurriculumLesson(p.level);
        setLesson(fallback);
        localStorage.setItem(LESSON_KEY, JSON.stringify(fallback));
      } catch {
        setError('خطا در بارگذاری درس. لطفاً دوباره تلاش کنید.');
      }
    } finally {
      setLoading(false);
    }
  }

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (speaking === text) { setSpeaking(null); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = 0.85; u.pitch = 1;
    u.onend = () => setSpeaking(null);
    setSpeaking(text);
    window.speechSynthesis.speak(u);
  }, [speaking]);

  const markSectionDone = (s: Section) => {
    setCompletedSections(prev => new Set([...prev, s]));
    const idx = SECTION_ORDER.indexOf(s);
    if (idx < SECTION_ORDER.length - 1) setActiveSection(SECTION_ORDER[idx + 1]);
  };

  const checkQuiz = () => {
    if (!lesson) return;
    let score = 0;
    lesson.quiz.forEach((q, i) => { if (selectedAnswers[i] === q.answerIndex) score++; });
    setQuizScore(score);
  };

  const finishDaily = () => {
    if (!lesson) return;
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const newStreak = profile.lastPracticeDate === yesterday ? profile.streak + 1 : 1;
    const updated: LanguageProfile = {
      ...profile,
      streak: newStreak,
      lastPracticeDate: today,
      learnedWords: [...new Set([...profile.learnedWords, ...lesson.vocabulary.map(v => v.word)])],
      learnedGrammar: [...new Set([...profile.learnedGrammar, lesson.grammar.rule])],
    };
    setProfile(updated);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
    setCompleted(true);
  };

  /* ── Loading ── */
  if (loading) return (
    <div className={styles.stateWrap}>
      <div className={styles.loadingOrb}>
        <Globe size={36} className={styles.orb1} />
        <Sparkles size={22} className={styles.orb2} />
      </div>
      <h2 className={styles.stateTitle}>در حال آماده‌سازی درس امروز…</h2>
      <p className={styles.stateText}>هوش مصنوعی واژگان جدید را برای شما انتخاب می‌کند</p>
      <div className={styles.loadingDots}><span /><span /><span /></div>
    </div>
  );

  /* ── Error ── */
  if (error && !lesson) return (
    <div className={styles.stateWrap}>
      <div className={styles.errorOrb}><AlertCircle size={36} /></div>
      <h2 className={styles.stateTitle}>اتصال برقرار نشد</h2>
      <p className={styles.stateText}>{error}</p>
      <button className={styles.retryBtn} onClick={() => fetchNewLesson(profile)}>
        <RotateCcw size={16} /> تلاش مجدد
      </button>
    </div>
  );

  /* ── Completed ── */
  if (completed) return (
    <div className={styles.stateWrap}>
      <div className={styles.successOrb}>
        <Trophy size={40} />
      </div>
      <div className={styles.confettiRow}>🎉 🏆 ⭐ 🎊 ✨</div>
      <h2 className={styles.stateTitle}>درس امروز تمام شد!</h2>
      <p className={styles.stateText}>آفرین! هر روز یک قدم به تسلط بر زبان نزدیک‌تر می‌شوید.</p>
      <div className={styles.successStats}>
        <div className={styles.sStat}>
          <Flame size={20} />
          <strong>{profile.streak}</strong>
          <span>روز پیاپی</span>
        </div>
        <div className={styles.sStat}>
          <Brain size={20} />
          <strong>{profile.learnedWords.length}</strong>
          <span>واژه آموخته</span>
        </div>
        <div className={styles.sStat}>
          <Star size={20} />
          <strong>{profile.learnedGrammar.length}</strong>
          <span>قاعده گرامر</span>
        </div>
      </div>
      <p className={styles.tomorrowNote}>📅 فردا با درس جدیدی اینجا منتظرتان هستیم</p>
    </div>
  );

  if (!lesson) return null;

  const sectionProgress = SECTION_ORDER.filter(s => completedSections.has(s)).length;
  const progressPct = (sectionProgress / SECTION_ORDER.length) * 100;

  return (
    <div className={styles.root} aria-label="آموزش روزانه زبان انگلیسی">

      {/* ── Hero Header ── */}
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroTop}>
            <span className={styles.dailyBadge}><Zap size={12} /> DAILY LESSON</span>
            <div className={styles.streakPill}><Flame size={14} /> {profile.streak} روز</div>
          </div>
          <h1 className={styles.heroTitle}>{lesson.theme}</h1>
          <p className={styles.heroSub}>
            {lesson.vocabulary.length} واژه · مکالمه · گرامر · آزمون
          </p>
          {/* Progress bar */}
          <div className={styles.progressWrap}>
            <div className={styles.progressBar} style={{ width: `${progressPct}%` }} />
          </div>
          <div className={styles.progressLabel}>
            {sectionProgress} از {SECTION_ORDER.length} بخش تکمیل شده
          </div>
        </div>
        <div className={styles.heroArt} aria-hidden>🇬🇧</div>
      </header>

      {/* ── Section Tabs ── */}
      <nav className={styles.sectionNav} aria-label="بخش‌های درس">
        {([ ['vocab', BookOpen, 'واژگان'], ['grammar', Lightbulb, 'گرامر'], ['conversation', MessageCircle, 'مکالمه'], ['quiz', PenTool, 'آزمون'] ] as [Section, any, string][]).map(([id, Icon, label]) => (
          <button
            key={id}
            className={`${styles.navTab} ${activeSection === id ? styles.navTabActive : ''} ${completedSections.has(id) ? styles.navTabDone : ''}`}
            onClick={() => setActiveSection(id)}
            aria-current={activeSection === id}
          >
            {completedSections.has(id) ? <CheckCircle2 size={15} /> : <Icon size={15} />}
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* ── VOCAB SECTION ── */}
      {activeSection === 'vocab' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <BookOpen size={20} className={styles.sectionIcon} />
            <div>
              <h2 className={styles.sectionTitle}>واژگان امروز</h2>
              <p className={styles.sectionDesc}>روی کارت کلیک کنید تا ترجمه ببینید. 🔊 برای شنیدن تلفظ</p>
            </div>
          </div>

          {/* Flashcard carousel */}
          <div className={styles.flashcardArea}>
            <div className={styles.flashcardNav}>
              <button className={styles.fcNavBtn} disabled={activeVocab === 0} onClick={() => setActiveVocab(v => v - 1)}>
                <ChevronRight size={20} />
              </button>
              <span className={styles.fcCounter}>{activeVocab + 1} / {lesson.vocabulary.length}</span>
              <button className={styles.fcNavBtn} disabled={activeVocab === lesson.vocabulary.length - 1} onClick={() => setActiveVocab(v => v + 1)}>
                <ArrowLeft size={20} />
              </button>
            </div>

            {lesson.vocabulary.map((v, i) => (
              <div
                key={i}
                className={`${styles.flashcard} ${flipped[i] ? styles.flipped : ''} ${i !== activeVocab ? styles.fcHidden : ''}`}
                onClick={() => setFlipped(p => ({ ...p, [i]: !p[i] }))}
                role="button"
                aria-label={flipped[i] ? `ترجمه: ${v.meaning}` : `کلمه: ${v.word}`}
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setFlipped(p => ({ ...p, [i]: !p[i] }))}
              >
                <div className={styles.fcInner}>
                  <div className={styles.fcFront}>
                    <div className={styles.fcWordRow}>
                      <span className={styles.fcWord}>{v.word}</span>
                      <button
                        className={`${styles.speakBtn} ${speaking === v.word ? styles.speaking : ''}`}
                        onClick={e => { e.stopPropagation(); speak(v.word); }}
                        aria-label="تلفظ"
                      >
                        <Volume2 size={20} />
                      </button>
                    </div>
                    <span className={styles.fcPhonetic} dir="ltr">{v.phonetic}</span>
                    <div className={styles.fcHint}>کلیک کنید تا ترجمه ببینید</div>
                  </div>
                  <div className={styles.fcBack}>
                    <div className={styles.fcMeaning}>{v.meaning}</div>
                    <button
                      className={`${styles.speakExBtn} ${speaking === v.example ? styles.speaking : ''}`}
                      onClick={e => { e.stopPropagation(); speak(v.example); }}
                    >
                      <Volume2 size={14} />
                      <span dir="ltr">{v.example}</span>
                    </button>
                    <div className={styles.fcExTrans}>{v.exampleTranslation}</div>
                  </div>
                </div>
              </div>
            ))}

            {/* Dot indicators */}
            <div className={styles.fcDots}>
              {lesson.vocabulary.map((_, i) => (
                <button
                  key={i}
                  className={`${styles.fcDot} ${i === activeVocab ? styles.fcDotActive : ''} ${flipped[i] ? styles.fcDotFlipped : ''}`}
                  onClick={() => setActiveVocab(i)}
                  aria-label={`واژه ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* All vocab list below */}
          <div className={styles.vocabGrid}>
            {lesson.vocabulary.map((v, i) => (
              <div key={i} className={styles.vocabChip} onClick={() => { setActiveVocab(i); setFlipped(p => ({ ...p, [i]: false })); }}>
                <strong>{v.word}</strong>
                <span>{v.meaning}</span>
              </div>
            ))}
          </div>

          <button className={`${styles.nextBtn} ${completedSections.has('vocab') ? styles.nextDone : ''}`} onClick={() => markSectionDone('vocab')}>
            {completedSections.has('vocab') ? <><CheckCircle2 size={18} /> تکمیل شد</> : <>بخش واژگان را تمام کردم <ChevronRight size={18} /></>}
          </button>
        </div>
      )}

      {/* ── GRAMMAR SECTION ── */}
      {activeSection === 'grammar' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Lightbulb size={20} className={styles.sectionIcon} />
            <div>
              <h2 className={styles.sectionTitle}>نکته گرامری</h2>
              <p className={styles.sectionDesc}>یک قاعده مهم را یاد بگیرید و مثال‌ها را بشنوید</p>
            </div>
          </div>

          <div className={styles.grammarCard}>
            <div className={styles.grammarRuleBadge}>
              <Zap size={16} /> قاعده امروز
            </div>
            <h3 className={styles.grammarRuleName} dir="ltr">{lesson.grammar.rule}</h3>
            <p className={styles.grammarExplanation}>{lesson.grammar.explanation}</p>

            <div className={styles.grammarExamples}>
              <p className={styles.grammarExLabel}>مثال‌ها:</p>
              {lesson.grammar.examples.map((ex, i) => (
                <button
                  key={i}
                  className={`${styles.grammarExItem} ${speaking === ex ? styles.speaking : ''}`}
                  onClick={() => speak(ex)}
                >
                  <Volume2 size={14} />
                  <span dir="ltr">{ex}</span>
                  <Play size={12} className={styles.playHint} />
                </button>
              ))}
            </div>
          </div>

          <button className={`${styles.nextBtn} ${completedSections.has('grammar') ? styles.nextDone : ''}`} onClick={() => markSectionDone('grammar')}>
            {completedSections.has('grammar') ? <><CheckCircle2 size={18} /> تکمیل شد</> : <>نکته را یاد گرفتم <ChevronRight size={18} /></>}
          </button>
        </div>
      )}

      {/* ── CONVERSATION SECTION ── */}
      {activeSection === 'conversation' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <MessageCircle size={20} className={styles.sectionIcon} />
            <div>
              <h2 className={styles.sectionTitle}>مکالمه نمونه</h2>
              <p className={styles.sectionDesc}>مکالمه را بخوانید و بشنوید تا تلفظ طبیعی را یاد بگیرید</p>
            </div>
          </div>

          <div className={styles.chatWindow}>
            {lesson.conversation.map((line, i) => (
              <div key={i} className={`${styles.chatBubbleWrap} ${line.speaker === 'A' ? styles.speakerA : styles.speakerB}`}>
                <div className={styles.chatAvatar}>{line.speaker}</div>
                <div className={styles.chatBubble}>
                  <div className={styles.chatBubbleTop}>
                    <p dir="ltr" className={styles.chatText}>{line.text}</p>
                    <button
                      className={`${styles.speakBubble} ${speaking === line.text ? styles.speaking : ''}`}
                      onClick={() => speak(line.text)}
                      aria-label="تلفظ"
                    >
                      <Volume2 size={14} />
                    </button>
                  </div>
                  <p className={styles.chatTrans}>{line.translation}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Play all button */}
          <button
            className={styles.playAllBtn}
            onClick={() => {
              window.speechSynthesis.cancel();
              let idx = 0;
              const next = () => {
                if (idx >= lesson.conversation.length) return;
                const u = new SpeechSynthesisUtterance(lesson.conversation[idx].text);
                u.lang = 'en-US'; u.rate = 0.85;
                u.onend = () => { idx++; setTimeout(next, 400); };
                window.speechSynthesis.speak(u);
                idx;
              };
              next();
            }}
          >
            <Play size={16} /> پخش کل مکالمه
          </button>

          <button className={`${styles.nextBtn} ${completedSections.has('conversation') ? styles.nextDone : ''}`} onClick={() => markSectionDone('conversation')}>
            {completedSections.has('conversation') ? <><CheckCircle2 size={18} /> تکمیل شد</> : <>مکالمه را تمرین کردم <ChevronRight size={18} /></>}
          </button>
        </div>
      )}

      {/* ── QUIZ SECTION ── */}
      {activeSection === 'quiz' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <PenTool size={20} className={styles.sectionIcon} />
            <div>
              <h2 className={styles.sectionTitle}>آزمون کوتاه</h2>
              <p className={styles.sectionDesc}>
                {quizScore === null
                  ? `${Object.keys(selectedAnswers).length} از ${lesson.quiz.length} سوال پاسخ داده شده`
                  : `نتیجه: ${quizScore} از ${lesson.quiz.length} صحیح ✓`}
              </p>
            </div>
          </div>

          <div className={styles.quizList}>
            {lesson.quiz.map((q, qi) => {
              const done = quizScore !== null;
              return (
                <div key={qi} className={`${styles.quizCard} ${done ? styles.quizCardRevealed : ''}`}>
                  <div className={styles.quizNum}>{qi + 1}</div>
                  <p className={styles.quizQuestion} dir="ltr">{q.question}</p>
                  <div className={styles.quizOptions}>
                    {q.options.map((opt, oi) => {
                      const sel = selectedAnswers[qi] === oi;
                      const correct = q.answerIndex === oi;
                      let cls = styles.quizOption;
                      if (sel) cls += ` ${styles.qoSelected}`;
                      if (done && correct) cls += ` ${styles.qoCorrect}`;
                      if (done && sel && !correct) cls += ` ${styles.qoWrong}`;
                      return (
                        <button key={oi} className={cls} disabled={done} onClick={() => !done && setSelectedAnswers(p => ({ ...p, [qi]: oi }))} dir="ltr">
                          <span className={styles.optLetter}>{String.fromCharCode(65 + oi)}</span>
                          {opt}
                          {done && correct && <CheckCircle2 size={14} className={styles.optCheck} />}
                        </button>
                      );
                    })}
                  </div>
                  {done && (
                    <div className={`${styles.quizFeedback} ${selectedAnswers[qi] === q.answerIndex ? styles.feedbackCorrect : styles.feedbackWrong}`}>
                      {selectedAnswers[qi] === q.answerIndex ? '✓ ' : '✗ '}{q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {quizScore === null ? (
            <button
              className={styles.checkBtn}
              disabled={Object.keys(selectedAnswers).length < lesson.quiz.length}
              onClick={checkQuiz}
            >
              بررسی پاسخ‌ها
            </button>
          ) : (
            <div className={styles.resultBox}>
              <div className={styles.resultScore}>
                <Trophy size={28} />
                <div>
                  <strong>{quizScore} از {lesson.quiz.length}</strong>
                  <span>پاسخ صحیح</span>
                </div>
              </div>
              <button className={styles.finishBtn} onClick={finishDaily}>
                <CheckCircle2 size={18} /> پایان درس امروز
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

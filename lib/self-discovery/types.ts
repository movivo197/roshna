/* ─────────────────────────────────────────────────────────────────
   Self-Discovery — Shared Types
   ───────────────────────────────────────────────────────────────── */

export type ActivityType =
  | 'lesson'
  | 'reflection'
  | 'quiz'
  | 'multiChoice'
  | 'slider'
  | 'emotionCheckin'
  | 'journalPrompt'
  | 'knowledgeCard'
  | 'divineName'
  | 'valueChoice'
  | 'practice';

export interface QuizOption {
  text: string;
  correct: boolean;
  explanation?: string;
}

export interface BaseActivity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  estimatedMinutes: number;
  xp: number;
}

export interface LessonActivity extends BaseActivity {
  type: 'lesson';
  body: string; // 50-150 words Persian
  insight?: string;
}

export interface ReflectionActivity extends BaseActivity {
  type: 'reflection';
  prompt: string;
  placeholder?: string;
}

export interface QuizActivity extends BaseActivity {
  type: 'quiz';
  question: string;
  options: QuizOption[];
}

export interface MultiChoiceActivity extends BaseActivity {
  type: 'multiChoice';
  question: string;
  choices: string[];
  minSelect: number;
  maxSelect: number;
  insight: string; // shown after
}

export interface SliderActivity extends BaseActivity {
  type: 'slider';
  question: string;
  leftLabel: string;
  rightLabel: string;
  insight: string;
}

export interface EmotionCheckinActivity extends BaseActivity {
  type: 'emotionCheckin';
}

export interface JournalPromptActivity extends BaseActivity {
  type: 'journalPrompt';
  prompt: string;
  placeholder?: string;
}

export interface KnowledgeCardActivity extends BaseActivity {
  type: 'knowledgeCard';
  concept: string;
  tradition?: string;
  language?: string;
  body: string;
  reflection?: string;
}

export interface DivineNameActivity extends BaseActivity {
  type: 'divineName';
  nameId: string; // references DivineName
}

export interface ValueChoiceActivity extends BaseActivity {
  type: 'valueChoice';
  cards: string[];
  selectCount: number;
  insight: string;
}

export interface PracticeActivity extends BaseActivity {
  type: 'practice';
  steps: string[];
  completionLabel: string;
}

export type Activity =
  | LessonActivity
  | ReflectionActivity
  | QuizActivity
  | MultiChoiceActivity
  | SliderActivity
  | EmotionCheckinActivity
  | JournalPromptActivity
  | KnowledgeCardActivity
  | DivineNameActivity
  | ValueChoiceActivity
  | PracticeActivity;

/* ── Journey / Session ─────────────────────────────────────── */
export interface DailySession {
  id: string;        // e.g. "journey1-day1"
  title: string;     // "آنچه واقعاً برای من مهم است"
  dayLabel: string;  // "روز ۱ — دیدن خود"
  activities: Activity[];
  completionInsight: string; // shown at end
  durationMinutes?: number;
}

export interface Journey {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  daysCount: number;
  sessions: DailySession[];
}

/* ── Divine Name ───────────────────────────────────────────── */
export interface DivineName {
  id: string;
  name: string;
  transliteration: string;
  literalMeaning: string;
  tradition: string;
  language: string;
  originalScript?: string;
  category: 'name' | 'title' | 'attribute' | 'concept';
  shortExplanation: string;
  reflection: string;
  practice: string;
  relatedConcepts?: string[];
  sourceNote?: string;
}

/* ── Tradition ─────────────────────────────────────────────── */
export interface TraditionEntry {
  id: string;
  tradition: string;
  concept: string;
  shortExplanation: string;
  note?: string; // theological note
}

export interface ThemeEntry {
  theme: string; // e.g. "رحمت"
  entries: TraditionEntry[];
}

/* ── Assessment ────────────────────────────────────────────── */
export type QuestionType = 'likert' | 'binary' | 'slider' | 'pick3' | 'scenario' | 'ranking';

export interface AssessmentQuestion {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  dimension?: string; // which dimension this contributes to
}

export interface AssessmentDimension {
  id: string;
  label: string;
  description: string;
  strength: string;
  watchout: string;
}

export interface Assessment {
  id: string;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  safetyNote: string;
  questions: AssessmentQuestion[];
  dimensions: AssessmentDimension[];
}

/* ── Gamification ──────────────────────────────────────────── */
export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  condition: string; // human-readable trigger
}

export interface LevelDef {
  level: number;
  label: string;
  minXp: number;
}

/* ── Values ────────────────────────────────────────────────── */
export interface ValueCard {
  id: string;
  label: string;
  icon: string;
}

/* ── Daily Practices (Unity, Mindfulness, Virtues) ──────────── */
export type PracticeCategory =
  | 'unity'         // وحدت و اتصال با پروردگار
  | 'mindfulness'   // خودآگاهی و مراقبه درون
  | 'virtue'        // نیک‌منشی و درست‌زیستن
  | 'gratitude'     // شکرگزاری و دیدن نعمات
  | 'presence'      // حضور در لحظه و سکوت
  | 'surrender'     // توکل و آرامش باطن
  | 'compassion';   // مهربانی و بخشش

export interface DailyPracticeItem {
  id: string;
  category: PracticeCategory;
  categoryLabel: string;
  title: string;
  icon: string;
  durationMinutes: number;
  objective: string;
  steps: string[];
  contemplation: string;
  dailyAction: string;
}

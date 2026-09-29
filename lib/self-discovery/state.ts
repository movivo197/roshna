/* ─────────────────────────────────────────────────────────────────
   Self-Discovery — Unified State & Persistence
   v2 schema with migration from v1
   ───────────────────────────────────────────────────────────────── */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { LEVELS } from './content';

const STORAGE_KEY = 'roshana-sd-v2';
const LEGACY_KEY  = 'roshana-self-discovery-v1';

export type EmotionId =
  | 'calm' | 'happy' | 'tired' | 'anxious' | 'confused'
  | 'sad' | 'hopeful' | 'energized' | 'grateful' | 'heavy';

export interface EmotionEntry {
  date: string;
  emotion: EmotionId;
  intensity: number; // 1-5
  note?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  prompt: string;
  text: string;
  emotion?: EmotionId;
  tags?: string[];
  favorite?: boolean;
}

export interface ActivityRecord {
  activityId: string;
  completedAt: string; // ISO date
  xpEarned: number;
  response?: string; // for reflections/journals
  sliderValue?: number;
  selectedChoices?: string[];
  quizAnswerIndex?: number;
}

export interface AssessmentResult {
  assessmentId: string;
  completedAt: string;
  scores: Record<string, number>; // dimension -> score
  responses: Record<string, number | string>;
}

export interface SDState {
  schemaVersion: 2;
  // Gamification
  xp: number;
  streak: number;
  lastVisitDate: string;
  level: number;
  // Journey progress
  activeJourneyId: string;
  journeyProgress: Record<string, number>; // journeyId -> current day index (0-based)
  completedSessions: string[]; // session ids
  // Activities
  completedActivities: ActivityRecord[];
  // Saved / learned concepts
  savedConceptIds: string[];
  learnedConceptIds: string[];
  // Journal
  journalEntries: JournalEntry[];
  // Emotions
  emotionHistory: EmotionEntry[];
  // Assessments
  assessmentResults: AssessmentResult[];
  // Achievements
  unlockedAchievements: string[];
  // Values (from values game)
  myValues: string[];
  // Today's session state (transient but persisted for resume)
  todaySessionStep: number;
  todaySessionId: string;
  // Daily check-in done today?
  lastCheckinDate: string;
}

function dayKey() {
  return new Date().toISOString().slice(0, 10);
}

function computeLevel(xp: number): number {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) return LEVELS[i].level;
  }
  return 1;
}

function defaultState(): SDState {
  const today = dayKey();
  return {
    schemaVersion: 2,
    xp: 0,
    streak: 0,
    lastVisitDate: today,
    level: 1,
    activeJourneyId: 'journey-self',
    journeyProgress: { 'journey-self': 0, 'journey-meaning': 0, 'journey-divine': 0 },
    completedSessions: [],
    completedActivities: [],
    savedConceptIds: [],
    learnedConceptIds: [],
    journalEntries: [],
    emotionHistory: [],
    assessmentResults: [],
    unlockedAchievements: [],
    myValues: [],
    todaySessionStep: 0,
    todaySessionId: '',
    lastCheckinDate: '',
  };
}

/** Migrate v1 data into v2 shape — never loses journal entries */
function migrateFromV1(raw: Record<string, unknown>): Partial<SDState> {
  const entries: JournalEntry[] = [];
  if (Array.isArray(raw.journalEntries)) {
    for (const e of raw.journalEntries as Array<{date: string; prompt: string; text: string}>) {
      if (e.date && e.text) {
        entries.push({ id: `legacy-${e.date}`, date: e.date, prompt: e.prompt || '', text: e.text });
      }
    }
  }
  return {
    journalEntries: entries,
    journeyProgress: { 'journey-self': typeof raw.journeyDay === 'number' ? Math.max(0, (raw.journeyDay as number) - 1) : 0 },
  };
}

function loadState(): SDState {
  const base = defaultState();
  try {
    // Try current v2 key
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SDState>;
      if (parsed.schemaVersion === 2) {
        // Valid v2 — merge with defaults
        return {
          ...base,
          ...parsed,
          journalEntries: Array.isArray(parsed.journalEntries) ? parsed.journalEntries : [],
          completedActivities: Array.isArray(parsed.completedActivities) ? parsed.completedActivities : [],
          emotionHistory: Array.isArray(parsed.emotionHistory) ? parsed.emotionHistory : [],
          savedConceptIds: Array.isArray(parsed.savedConceptIds) ? parsed.savedConceptIds : [],
          completedSessions: Array.isArray(parsed.completedSessions) ? parsed.completedSessions : [],
          assessmentResults: Array.isArray(parsed.assessmentResults) ? parsed.assessmentResults : [],
          unlockedAchievements: Array.isArray(parsed.unlockedAchievements) ? parsed.unlockedAchievements : [],
          myValues: Array.isArray(parsed.myValues) ? parsed.myValues : [],
          journeyProgress: typeof parsed.journeyProgress === 'object' && parsed.journeyProgress ? parsed.journeyProgress : base.journeyProgress,
        };
      }
    }
    // Try legacy v1 key
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      const migrated = migrateFromV1(parsed);
      return { ...base, ...migrated };
    }
  } catch { /* corrupted state - start fresh */ }
  return base;
}

export function useSelfDiscoveryState() {
  const [state, setState] = useState<SDState>(defaultState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loaded = loadState();
    // Update streak
    const today = dayKey();
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    let streak = loaded.streak;
    if (loaded.lastVisitDate === yesterday) {
      streak = streak + 1;
    } else if (loaded.lastVisitDate !== today) {
      streak = 0;
    }
    setState({ ...loaded, lastVisitDate: today, streak, level: computeLevel(loaded.xp) });
    setLoaded(true);
  }, []);

  const persist = useCallback((next: SDState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      // Clear legacy key once migrated
      localStorage.removeItem(LEGACY_KEY);
    } catch { /* quota */ }
  }, []);

  const update = useCallback((updater: (s: SDState) => SDState) => {
    setState(prev => {
      const next = updater(prev);
      next.level = computeLevel(next.xp);
      persist(next);
      return next;
    });
  }, [persist]);

  /** Add XP and check achievements */
  const addXp = useCallback((amount: number) => {
    update(s => ({ ...s, xp: s.xp + amount }));
  }, [update]);

  /** Complete an activity */
  const completeActivity = useCallback((
    activityId: string,
    xp: number,
    response?: string,
    extra?: Partial<ActivityRecord>
  ) => {
    const record: ActivityRecord = {
      activityId,
      completedAt: new Date().toISOString(),
      xpEarned: xp,
      response,
      ...extra,
    };
    update(s => ({
      ...s,
      xp: s.xp + xp,
      completedActivities: [record, ...s.completedActivities.filter(a => a.activityId !== activityId)],
    }));
  }, [update]);

  /** Complete a daily session */
  const completeSession = useCallback((sessionId: string, bonusXp = 30) => {
    update(s => {
      const already = s.completedSessions.includes(sessionId);
      if (already) return s;
      // Advance journey
      const jId = s.activeJourneyId;
      const curr = s.journeyProgress[jId] ?? 0;
      return {
        ...s,
        xp: s.xp + bonusXp,
        completedSessions: [...s.completedSessions, sessionId],
        journeyProgress: { ...s.journeyProgress, [jId]: curr + 1 },
        todaySessionStep: 0,
        lastVisitDate: dayKey(),
      };
    });
  }, [update]);

  /** Save journal entry */
  const saveJournal = useCallback((entry: Omit<JournalEntry, 'id'>) => {
    const id = `j-${Date.now()}`;
    update(s => ({
      ...s,
      xp: s.xp + 15,
      journalEntries: [{ ...entry, id }, ...s.journalEntries.filter(e => e.date !== entry.date)].slice(0, 500),
    }));
  }, [update]);

  /** Save emotion check-in */
  const saveEmotion = useCallback((emotion: EmotionId, intensity: number, note?: string) => {
    const entry: EmotionEntry = { date: dayKey(), emotion, intensity, note };
    update(s => ({
      ...s,
      lastCheckinDate: dayKey(),
      emotionHistory: [entry, ...s.emotionHistory.filter(e => e.date !== dayKey())].slice(0, 365),
    }));
  }, [update]);

  /** Save assessment result */
  const saveAssessment = useCallback((result: AssessmentResult) => {
    update(s => ({
      ...s,
      xp: s.xp + 30,
      assessmentResults: [result, ...s.assessmentResults.filter(r => r.assessmentId !== result.assessmentId)],
    }));
  }, [update]);

  /** Toggle concept saved */
  const toggleSaved = useCallback((id: string) => {
    update(s => {
      const saved = s.savedConceptIds.includes(id);
      return { ...s, savedConceptIds: saved ? s.savedConceptIds.filter(x => x !== id) : [...s.savedConceptIds, id] };
    });
  }, [update]);

  /** Mark concept learned (adds XP) */
  const markLearned = useCallback((id: string) => {
    update(s => {
      if (s.learnedConceptIds.includes(id)) return s;
      return { ...s, xp: s.xp + 5, learnedConceptIds: [...s.learnedConceptIds, id] };
    });
  }, [update]);

  /** Save values game result */
  const saveValues = useCallback((values: string[]) => {
    update(s => ({ ...s, myValues: values, xp: s.xp + 20 }));
  }, [update]);

  /** Advance session step */
  const setSessionStep = useCallback((sessionId: string, step: number) => {
    update(s => ({ ...s, todaySessionId: sessionId, todaySessionStep: step }));
  }, [update]);

  /** Unlock achievement */
  const unlockAchievement = useCallback((id: string) => {
    update(s => {
      if (s.unlockedAchievements.includes(id)) return s;
      return { ...s, unlockedAchievements: [...s.unlockedAchievements, id] };
    });
  }, [update]);

  /** Set active journey */
  const setActiveJourney = useCallback((journeyId: string) => {
    update(s => ({ ...s, activeJourneyId: journeyId }));
  }, [update]);

  return {
    state,
    loaded,
    update,
    addXp,
    completeActivity,
    completeSession,
    saveJournal,
    saveEmotion,
    saveAssessment,
    toggleSaved,
    markLearned,
    saveValues,
    setSessionStep,
    unlockAchievement,
    setActiveJourney,
    dayKey,
  };
}

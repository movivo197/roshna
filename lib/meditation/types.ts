export type MeditationLevel = 'beginner' | 'intermediate' | 'advanced';

export type ChakraInfo = {
  name: string;
  persianName: string;
  sanskrit: string;
  color: string;
  gradient: string;
  glow: string;
  element: string;
  themeColor: string;
};

export type BreathingPattern = {
  inhale: number;   // seconds
  hold1: number;    // seconds after inhale
  exhale: number;   // seconds
  hold2: number;    // seconds after exhale
  label: string;
};

export type MeditationTechnique = {
  id: string;
  title: string;
  subtitle: string;
  level: MeditationLevel;
  chakra: ChakraInfo;
  durationMinutes: number;
  breathing: BreathingPattern;
  benefits: string[];
  philosophy: string;
  instructions: string[];
  mantra?: string;
};

export type MeditationProfile = {
  totalMinutes: number;
  sessionsCompleted: number;
  streak: number;
  lastSessionDate: string | null;
  preferredLevel: MeditationLevel;
  preferredDuration: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  ambientEnabled: boolean;
};

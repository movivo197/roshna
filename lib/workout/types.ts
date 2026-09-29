export type WorkoutLevel = 'beginner' | 'intermediate' | 'advanced';

export type WorkoutPhase = 'warmup' | 'work' | 'rest' | 'cooldown';

export type Movement = {
  name: string;
  persianName: string;
  durationSeconds: number;
  restSeconds: number;
  intensity: 'low' | 'moderate' | 'high';
  targetMuscles: string[];
  instructions: string[];
  tips: string;
};

export type WorkoutRoutine = {
  id: string;
  title: string;
  subtitle: string;
  level: WorkoutLevel;
  targetHeartRateZone: string;
  calorieBurnPer15Min: number;
  themeColor: string;
  gradient: string;
  benefits: string[];
  scienceNote: string;
  warmupSeconds: number;
  cooldownSeconds: number;
  movements: Movement[];
};

export type WorkoutProfile = {
  totalMinutes: number;
  estimatedCalories: number;
  sessionsCompleted: number;
  streak: number;
  lastSessionDate: string | null;
  preferredLevel: WorkoutLevel;
  preferredDuration: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
};

import { z } from 'zod';

export const languageVocabularySchema = z.object({
  word: z.string().describe('The English word or phrase'),
  meaning: z.string().describe('Persian translation'),
  phonetic: z.string().describe('IPA phonetic transcription'),
  example: z.string().describe('An English example sentence'),
  exampleTranslation: z.string().describe('Persian translation of the example sentence'),
});

export const languageConversationLineSchema = z.object({
  speaker: z.enum(['A', 'B']).describe('Speaker A or B'),
  text: z.string().describe('The English sentence spoken'),
  translation: z.string().describe('Persian translation'),
});

export const languageGrammarSchema = z.object({
  rule: z.string().describe('The name of the grammar rule in English/Persian'),
  explanation: z.string().describe('Brief Persian explanation of the rule'),
  examples: z.array(z.string()).describe('2 or 3 English examples applying the rule'),
});

export const languageQuizSchema = z.object({
  question: z.string().describe('An English question testing the vocabulary or grammar'),
  options: z.array(z.string()).length(4).describe('4 possible answers in English'),
  answerIndex: z.number().int().min(0).max(3).describe('Index of the correct answer (0-3)'),
  explanation: z.string().describe('Persian explanation of why the answer is correct'),
});

export const dailyLessonSchema = z.object({
  id: z.string().describe('A unique string ID for this lesson (e.g. date string YYYY-MM-DD)'),
  theme: z.string().describe('The theme of the lesson in Persian (e.g., سفر به فرودگاه)'),
  vocabulary: z.array(languageVocabularySchema).min(3).max(5).describe('3 to 5 vocabulary words'),
  conversation: z.array(languageConversationLineSchema).min(4).max(8).describe('A short dialogue using the vocabulary'),
  grammar: languageGrammarSchema.describe('A bite-sized grammar tip'),
  quiz: z.array(languageQuizSchema).length(3).describe('3 multiple choice questions'),
});

export type DailyLesson = z.infer<typeof dailyLessonSchema>;

export const languageProfileSchema = z.object({
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  interests: z.array(z.string()),
  learnedWords: z.array(z.string()),
  learnedGrammar: z.array(z.string()),
  streak: z.number().int().min(0),
  lastPracticeDate: z.string().nullable(),
});

export type LanguageProfile = z.infer<typeof languageProfileSchema>;

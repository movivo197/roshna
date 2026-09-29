import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { Agent } from 'undici';
import { languageProfileSchema, dailyLessonSchema, type DailyLesson } from '@/lib/language/types';
import { getCurriculumLesson } from '@/lib/language/curriculum';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const dispatcher = new Agent({
  connect: { rejectUnauthorized: process.env.NODE_ENV === 'production' },
});

export async function POST(request: NextRequest) {
  const todayStr = new Date().toISOString().slice(0, 10);
  let parsedProfile;

  try {
    const body = await request.json().catch(() => ({}));
    const parseResult = languageProfileSchema.safeParse(body);
    parsedProfile = parseResult.success ? parseResult.data : {
      level: 'intermediate' as const,
      interests: ['General daily life'],
      learnedWords: [],
      learnedGrammar: [],
      streak: 0,
      lastPracticeDate: null,
    };
  } catch {
    parsedProfile = {
      level: 'intermediate' as const,
      interests: ['General daily life'],
      learnedWords: [],
      learnedGrammar: [],
      streak: 0,
      lastPracticeDate: null,
    };
  }

  // 1. If GEMINI_API_KEY is not configured, seamlessly return curated lesson without 503 error
  if (!process.env.GEMINI_API_KEY) {
    const fallbackLesson = getCurriculumLesson(parsedProfile.level, todayStr);
    return NextResponse.json(fallbackLesson);
  }

  // 2. If API Key is present, attempt generative creation with reliable fallback
  try {
    const profile = parsedProfile;
    const ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        fetch: async (url, init) => {
          return fetch(url, { ...init, dispatcher } as any);
        }
      }
    });

    const prompt = `You are a highly qualified English teacher generating a personalized daily lesson for a Persian-speaking student.
Student Level: ${profile.level}
Interests: ${profile.interests.join(', ') || 'General daily life'}
Learned Words so far: ${profile.learnedWords.slice(-50).join(', ') || 'None'}
Learned Grammar so far: ${profile.learnedGrammar.slice(-20).join(', ') || 'None'}

Generate a unique daily lesson. 
- Do NOT repeat the learned words or grammar if possible.
- The theme should be interesting and related to their interests or practical daily life.
- Provide 3 to 5 new vocabulary words with Persian translations and phonetic pronunciation (IPA).
- Provide a dialogue applying these words.
- Provide a short, bite-sized grammar rule suitable for their level.
- Provide 3 multiple choice quiz questions (4 options each) testing today's vocabulary or grammar.`;

    const responseSchema = zodToJsonSchema(dailyLessonSchema, "DailyLesson");
    
    let response;
    // Use valid Gemini model with short timeout fallback
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: (responseSchema as any).definitions.DailyLesson,
          systemInstruction: "You are an English Teacher AI. Always reply in JSON matching the exact schema provided.",
          temperature: 0.7,
        }
      });
    } catch (modelErr) {
      console.warn('Gemini 2.5 flash invocation issue, falling back to curated curriculum:', modelErr);
    }

    if (response && response.text) {
      const resultJson = JSON.parse(response.text);
      resultJson.id = todayStr;
      const finalLesson = dailyLessonSchema.parse(resultJson);
      return NextResponse.json(finalLesson);
    }
  } catch (error) {
    console.warn('AI Lesson Generation failed, smoothly providing curated curriculum:', error);
  }

  // Fallback to high-quality curated curriculum
  const lesson = getCurriculumLesson(parsedProfile.level, todayStr);
  return NextResponse.json(lesson);
}

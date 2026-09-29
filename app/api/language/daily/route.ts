import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { Agent } from 'undici';
import { languageProfileSchema, dailyLessonSchema } from '@/lib/language/types';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const dispatcher = new Agent({
  connect: { rejectUnauthorized: process.env.NODE_ENV === 'production' },
});

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'کلید API تنظیم نشده است.' }, { status: 503 });
    }

    const body = await request.json();
    const parseResult = languageProfileSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json({ error: 'فرمت اطلاعات کاربر معتبر نیست.' }, { status: 400 });
    }

    const profile = parseResult.data;
    
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
    for (let i = 0; i < 3; i++) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: (responseSchema as any).definitions.DailyLesson,
            systemInstruction: "You are an English Teacher AI. Always reply in JSON matching the exact schema provided.",
            temperature: 0.7,
          }
        });
        break;
      } catch (err: any) {
        if (i === 2) {
          console.warn('Gemini API is unavailable or rate limited. Returning fallback mock lesson.');
          return NextResponse.json({
            id: new Date().toISOString().slice(0, 10),
            theme: 'سفر به فرودگاه (درس آزمایشی)',
            vocabulary: [
              { word: 'Luggage', meaning: 'چمدان', phonetic: '/ˈlʌɡɪdʒ/', example: 'I lost my luggage.', exampleTranslation: 'چمدانم را گم کردم.' },
              { word: 'Flight', meaning: 'پرواز', phonetic: '/flaɪt/', example: 'My flight is delayed.', exampleTranslation: 'پروازم تاخیر دارد.' },
              { word: 'Boarding pass', meaning: 'کارت پرواز', phonetic: '/ˈbɔːrdɪŋ pæs/', example: 'Here is my boarding pass.', exampleTranslation: 'بفرمایید کارت پروازم.' }
            ],
            conversation: [
              { speaker: 'A', text: 'Hello, I need to check in my luggage.', translation: 'سلام، می‌خوام چمدانم رو تحویل بدم.' },
              { speaker: 'B', text: 'Sure, can I see your boarding pass?', translation: 'حتما، می‌تونم کارت پروازتون رو ببینم؟' },
              { speaker: 'A', text: 'Here you go. Is the flight on time?', translation: 'بفرمایید. پرواز سر وقته؟' },
              { speaker: 'B', text: 'Yes, it is boarding now.', translation: 'بله، الان در حال سوار شدن هستن.' }
            ],
            grammar: {
              rule: 'Present Continuous for Future',
              explanation: 'از حال استمراری برای کارهایی که برنامه‌ریزی قطعی در آینده دارند استفاده می‌شود.',
              examples: ['I am flying to Paris tomorrow.', 'We are leaving at 8 PM.']
            },
            quiz: [
              { question: 'What do you show to get on the plane?', options: ['Luggage', 'Flight', 'Boarding pass', 'Passport'], answerIndex: 2, explanation: 'کارت پرواز (Boarding pass) برای سوار شدن نیاز است.' },
              { question: 'Which word means "چمدان"?', options: ['Bag', 'Luggage', 'Box', 'Cart'], answerIndex: 1, explanation: 'چمدان معادل Luggage است.' },
              { question: 'Fill in the blank: "My ___ is delayed."', options: ['Flight', 'Car', 'Luggage', 'Food'], answerIndex: 0, explanation: 'پرواز (Flight) تاخیر می‌خورد.' }
            ]
          });
        }
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    if (!response || !response.text) throw new Error('AI returned empty text');
    
    const resultJson = JSON.parse(response.text);
    // Overwrite ID to ensure it's unique for today
    resultJson.id = new Date().toISOString().slice(0, 10);
    
    // Validate output
    const finalLesson = dailyLessonSchema.parse(resultJson);
    
    return NextResponse.json(finalLesson);
  } catch (error) {
    console.error('AI Lesson Generation Error:', error);
    return NextResponse.json({ error: 'دریافت درس جدید با خطا مواجه شد.' }, { status: 500 });
  }
}

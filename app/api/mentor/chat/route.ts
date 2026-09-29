import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `تو «مربی هوشمند زندگی و روانشناسی روشنا» هستی؛ یک راهنمای صمیمی، دانا، دلسوز، واقع‌بین و مسلط به روانشناسی مثبت‌گرا، رویکرد پذیرش و تعهد (ACT)، درمان شناختی رفتاری (CBT) و اصول ساخت عادت‌های پایدار (Atomic Habits).

وظیفه تو:
۱. شنیدن بدون قضاوت و همدلی عمیق با احساسات کاربر.
۲. کمک به شفاف‌سازی ذهن و خرد کردن مشکلات بزرگ به «قدم‌های کوچک و عملی».
۳. شناسایی باورهای محدودکننده و بازنویسی آن‌ها با شفقت به خود.
۴. پیشنهاد ابزارها و گجت‌های مرتبط در سوپراپ روشنا (مانند: تنفس ۴-۷-۸، کارگاه باور تازه، آینه سایه‌ها، صندوق توکل، زمان تمرکز عمیق، ژورنال خودشناسی).

اصول پاسخ‌دهی:
- پاسخ‌ها باید به زبان فارسی روان، زیبا، با لحنی گرم و امیدبخش باشند.
- از کلی‌گویی و پند و اندرز خشک دوری کن؛ همیشه یک یا دو راهکار ملموس و عملی برای همین امروز پیشنهاد بده.
- ساختار پاسخ‌ها خوانا و پاراگراف‌بندی‌شده باشد (حداکثر ۲ تا ۴ بند موجز و موثر).`;

const OFFLINE_KNOWLEDGE: Record<string, string> = {
  stress: `متوجه فشاری که تحمل می‌کنی هستم. وقتی استرس بالا می‌رود، سیستم عصبی سمپاتیک فعال شده و بدن در حالت جنگ یا گریز قرار می‌گیرد.

برای آرام کردن فوری بدنت:
۱. **تمرین تنفس ۴-۷-۸:** ۴ ثانیه دم آرام از بینی، ۷ ثانیه حبس، و ۸ ثانیه بازدم عمیق از دهان (می‌توانی از بخش گجت‌ها، گجت «تنفس ۴-۷-۸» را باز کنی).
۲. **تفکیک کنترل:** از خودت بپرس «کدام بخش این ماجرا واقعاً در کنترل من است و کدام خارج از اراده من است؟» بخش‌های خارج از کنترل را در «صندوق توکل» روشنا رها کن.`,
  procrastination: `اهمال‌کاری تنبلی نیست؛ در واقع واکنش مغز به اضطراب ناشی از شروع یک کار بزرگ یا کمال‌گرایی است!

چند تکنیک اثبات‌شده برای شکستن قفل اهمال‌کاری:
۱. **قانون ۲ دقیقه:** هدف را آن‌قدر کوچک کن که مقاومت مغز شکسته شود (مثلاً فقط ۲ دقیقه فایل را باز کن یا یک جمله بنویس).
۲. **بلوک تمرکز عمیق:** وارد بخش «زمان تمرکز» روشنا شو و یک بازه ۲۵ دقیقه‌ای بدون هیچ نوتیفیکیشنی شروع کن.
۳. **پذیرش شروع ناقص:** انجام ناقص یک کار از انجام ندادن بی‌نقص آن صدها برابر باارزش‌تر است.`,
  habit: `راز ساخت عادات پایدار در انگیزه شدید نیست، بلکه در پیوستگی قدم‌های بسیار کوچک (میکرو عادت‌ها) است.

برای تثبیت عاداتت:
۱. **زنجیره را قطع نکن:** حتی اگر یک روز فقط ۱ دقیقه وقت داشتی، عادتت را انجام بده تا پیوستگی ذهنی حفظ شود.
۲. **قلاب‌کردن به عادت قبلی:** عادت جدیدت را بلافاصله بعد از یک کار روزمره ثابت (مثل نوشیدن چای صبحگاهی) قرار بده.
۳. بخش «عادت‌های کوچک» روشنا را چک کن تا زنجیره روزهایت را ثبت کنی.`,
  sadness: `به قلبت حق بده که گاهی خسته یا غمگین باشد. قرار نیست همیشه پرانرژی و بی‌نقص باشیم؛ غم هم حامل پیامی برای مراقبت بیشتر از خودمان است.

پیشنهاد من برای امروزت:
۱. بدون سرزنش، احساساتت را در «دفتر خودشناسی» روشنا بنویس. نوشتن بار روانی را سبک می‌کند.
۲. به بدنت توجه کن: یک دوش آب گرم، یک لیوان آب، و چند دقیقه استراحت در سکوت با «رادیو آرامش» به مغزت فرصت ترمیم می‌دهد.`,
  general: `من کنارتم تا باهم مسیر رشد و آرامش رو بسازیم. هر زمان احساس کردی ذهنت شلوغ شده یا می‌خواهی برای هدفی برنامه‌ریزی کنی، دغدغه‌ات را مطرح کن تا قدم بعدی را باهم مشخص کنیم.

امروز چه قدم کوچکی می‌توانی برای مراقبت از روحت برداری؟`
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, userContext } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'پیام نامعتبر است.' }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1]?.content || '';
    const apiKey = process.env.GEMINI_API_KEY;

    let responseText = '';

    if (apiKey) {
      try {
        const client = new GoogleGenAI({ apiKey });
        
        let contextAddition = '';
        if (userContext) {
          contextAddition = `\n[اطلاعات وضعیت فعلی کاربر: نام: ${userContext.name || 'کاربر'}, مود امروز: ${userContext.currentMood || 'ثبت‌نشده'}, تسک‌های انجام‌شده امروز: ${userContext.tasksDone || 0}, دقایق تمرکز: ${userContext.focusMinutes || 0}]`;
        }

        const fullPrompt = `${SYSTEM_PROMPT}${contextAddition}\n\nتاریخچه گفتگو:\n${messages.map((m: any) => `${m.role === 'user' ? 'کاربر' : 'مربی'}: ${m.content}`).join('\n')}\nمربی:`;

        const result = await client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: fullPrompt,
        });

        responseText = result.text || '';
      } catch (err) {
        console.error('Gemini API Error, falling back to offline logic:', err);
      }
    }

    // Fallback offline responses if API is missing or fails
    if (!responseText) {
      const lower = lastMessage.toLowerCase();
      if (lower.includes('استرس') || lower.includes('اضطراب') || lower.includes('نگران') || lower.includes('فشار') || lower.includes('وحشت')) {
        responseText = OFFLINE_KNOWLEDGE.stress;
      } else if (lower.includes('تنبلی') || lower.includes('اهمال') || lower.includes('عقب') || lower.includes('نمی‌تونم شروع') || lower.includes('حوصله')) {
        responseText = OFFLINE_KNOWLEDGE.procrastination;
      } else if (lower.includes('عادت') || lower.includes('نظم') || lower.includes('روتین') || lower.includes('پیوستگی') || lower.includes('انضباط')) {
        responseText = OFFLINE_KNOWLEDGE.habit;
      } else if (lower.includes('غم') || lower.includes('افسرده') || lower.includes('خسته') || lower.includes('بی‌انرژی') || lower.includes('تنها') || lower.includes('گریه')) {
        responseText = OFFLINE_KNOWLEDGE.sadness;
      } else {
        responseText = `از اینکه این موضوع رو با من در میون گذاشتی ممنونم.\n\nبرای اینکه بتونیم به بهترین شکل باهم حلش کنیم:\n۱. به نظرت ریشه اصلی این حس از کجاست؟\n۲. اگر قرار باشه فقط یک کار خیلی ساده و ۵ دقیقه‌ای برای بهتر شدن اوضاع انجام بدی، اون کار چی می‌تونه باشه؟\n\nمی‌تونی هر فکری که تو سرت میاد رو بدون سانسور برام بنویسی تا قدم‌به‌قدم جلو بریم.`;
      }
    }

    return NextResponse.json({ reply: responseText });
  } catch (error) {
    console.error('Mentor chat route error:', error);
    return NextResponse.json({
      reply: 'در حال حاضر ارتباط با مربی موقتاً با تأخیر مواجه شد. لطفاً چند لحظه بعد دوباره پیام دهید.'
    });
  }
}

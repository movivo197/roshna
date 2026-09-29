import type { DailyLesson } from './types';

export const CURRICULUM_LESSONS: Record<'beginner' | 'intermediate' | 'advanced', DailyLesson[]> = {
  beginner: [
    {
      id: 'beginner-1',
      theme: 'احوال‌پرسی و شروع گفتگو در روزمره',
      vocabulary: [
        { word: 'Greeting', meaning: 'احوال‌پرسی / درود', phonetic: '/ˈɡriː.tɪŋ/', example: 'A warm greeting makes people smile.', exampleTranslation: 'یک احوال‌پرسی گرم لبخند به لب مردم می‌آورد.' },
        { word: 'Pleasure', meaning: 'لذت / مایه خرسندی', phonetic: '/ˈpleʒ.ər/', example: 'It is a pleasure to meet you.', exampleTranslation: 'دیدارتان مایه خرسندی است.' },
        { word: 'Colleague', meaning: 'همکار', phonetic: '/ˈkɒl.iːɡ/', example: 'She is my new colleague.', exampleTranslation: 'او همکار جدید من است.' },
        { word: 'Introduce', meaning: 'معرفی کردن', phonetic: '/ˌɪn.trəˈdʒuːs/', example: 'Let me introduce myself.', exampleTranslation: 'اجازه دهید خودم را معرفی کنم.' },
      ],
      conversation: [
        { speaker: 'A', text: 'Good morning! It is a pleasure to meet you.', translation: 'صبح بخیر! دیدار شما مایه خرسندی است.' },
        { speaker: 'B', text: 'Good morning! My name is Sara. Let me introduce my colleague, Ali.', translation: 'صبح بخیر! نام من سارا است. بگذارید همکارم علی را معرفی کنم.' },
        { speaker: 'A', text: 'Welcome to the team, Ali. How are you settling in?', translation: 'علی، به تیم خوش آمدی. اوضاع چطور پیش می‌رود؟' },
        { speaker: 'B', text: 'Thank you! Everyone has given me a warm greeting.', translation: 'متشکرم! همه با من خیلی گرم احوال‌پرسی کردند.' },
      ],
      grammar: {
        rule: 'Present Simple with "To Be" (am / is / are)',
        explanation: 'برای بیان هویت، شغل، احساسات و وضعیت کنونی از فعل‌های to be (am, is, are) استفاده می‌کنیم.',
        examples: ['I am delighted to meet you.', 'She is our new manager.', 'They are very friendly.'],
      },
      quiz: [
        { question: 'What is the best response to "It is a pleasure to meet you"?', options: ['Nice to meet you too', 'See you yesterday', 'I do not want', 'Goodbye forever'], answerIndex: 0, explanation: 'عبارت Nice to meet you too پاسخ استاندارد و محترمانه به این احوال‌پرسی است.' },
        { question: 'Which word means "همکار"?', options: ['Neighbor', 'Colleague', 'Stranger', 'Customer'], answerIndex: 1, explanation: 'کلمه Colleague به معنی همکار در محیط کاری است.' },
        { question: 'Choose the correct form: "She ___ a kind colleague."', options: ['am', 'is', 'are', 'be'], answerIndex: 1, explanation: 'برای فاعل سوم شخص مفرد (she) از فعل is استفاده می‌شود.' },
      ],
    },
    {
      id: 'beginner-2',
      theme: 'سفارش قهوه و تعامل در کافه',
      vocabulary: [
        { word: 'Beverage', meaning: 'نوشیدنی', phonetic: '/ˈbev.ər.ɪdʒ/', example: 'Coffee is my favorite hot beverage.', exampleTranslation: 'قهوه نوشیدنی گرم محبوب من است.' },
        { word: 'Receipt', meaning: 'رسید / فاکتور', phonetic: '/rɪˈsiːt/', example: 'Would you like your receipt?', exampleTranslation: 'رسیدتان را میل دارید؟' },
        { word: 'Decaf', meaning: 'بدون کافئین', phonetic: '/ˈdiː.kæf/', example: 'I prefer decaf coffee in the evening.', exampleTranslation: 'من غروب‌ها قهوه بدون کافئین را ترجیح می‌دهم.' },
        { word: 'Takeaway', meaning: 'بیرون‌بر', phonetic: '/ˈteɪk.ə.weɪ/', example: 'Can I have this for takeaway?', exampleTranslation: 'می‌توانم این را بیرون‌بر داشته باشم؟' },
      ],
      conversation: [
        { speaker: 'A', text: 'Hi there! What beverage can I get started for you today?', translation: 'سلام! امروز چه نوشیدنی برایتان آماده کنم؟' },
        { speaker: 'B', text: 'Hello! I would like a decaf latte with oat milk, please.', translation: 'سلام! یک لاته بدون کافئین با شیر جو دوسر لطفاً.' },
        { speaker: 'A', text: 'For here or takeaway?', translation: 'میل می‌کنید یا بیرون‌بر؟' },
        { speaker: 'B', text: 'Takeaway, please. And could I have the receipt?', translation: 'بیرون‌بر لطفاً. رسیدش را هم به من می‌دهید؟' },
      ],
      grammar: {
        rule: 'Polite Requests with "Would like" & "Could I have"',
        explanation: 'برای سفارش دادن یا درخواست محترمانه، به جای I want از عبارت‌های مؤدبانه I would like یا Could I have استفاده می‌کنیم.',
        examples: ['I would like a cup of green tea.', 'Could I have some water, please?'],
      },
      quiz: [
        { question: 'How do you say "بیرون‌بر" for food or drinks?', options: ['Takeaway', 'Stay in', 'Run off', 'Breakdown'], answerIndex: 0, explanation: 'واژه Takeaway (یا To go در انگلیسی آمریکایی) به معنای بیرون‌بر است.' },
        { question: 'Complete politely: "___ I have a glass of water, please?"', options: ['Must', 'Could', 'Did', 'Shall'], answerIndex: 1, explanation: 'کلمه Could برای ساختن درخواست بسیار محترمانه به کار می‌رود.' },
        { question: 'The "p" in the word "Receipt" is:', options: ['Loud', 'Silent', 'Double', 'Stressed'], answerIndex: 1, explanation: 'حرف p در کلمه Receipt ناخوانا (Silent) است و تلفظ می‌شود /rɪˈsiːt/.' },
      ],
    },
  ],
  intermediate: [
    {
      id: 'intermediate-1',
      theme: 'حضور در لحظه، آرامش و سبک زندگی هشیارانه',
      vocabulary: [
        { word: 'Mindfulness', meaning: 'توجه‌آگاهی / حضور در لحظه', phonetic: '/ˈmaɪnd.fəl.nəs/', example: 'Mindfulness helps reduce chronic daily stress.', exampleTranslation: 'توجه‌آگاهی به کاهش اضطراب مزمن روزمره کمک می‌کند.' },
        { word: 'Tranquility', meaning: 'آرامش عمیق و طمأنینه', phonetic: '/træŋˈkwɪl.ə.ti/', example: 'He found inner tranquility by the quiet lake.', exampleTranslation: 'او در کنار دریاچه آرام به طمأنینه درونی رسید.' },
        { word: 'Resilience', meaning: 'تاب‌آوری و انعطاف‌پذیری روانی', phonetic: '/rɪˈzɪl.jəns/', example: 'Patience builds mental resilience over time.', exampleTranslation: 'صبر به مرور زمان تاب‌آوری ذهنی ایجاد می‌کند.' },
        { word: 'Contemplate', meaning: 'تأمل و اندیشیدن ژرف', phonetic: '/ˈkɒn.təm.pleɪt/', example: 'Take ten minutes each evening to contemplate your day.', exampleTranslation: 'هر غروب ده دقیقه وقت بگذار تا در روزت تأمل کنی.' },
      ],
      conversation: [
        { speaker: 'A', text: 'You seem very calm today despite the heavy workload. What is your secret?', translation: 'با وجود حجم کاری سنگین، امروز خیلی آرام به نظر می‌رسی. رازت چیست؟' },
        { speaker: 'B', text: 'I started practicing mindfulness for fifteen minutes every morning.', translation: 'شروع کرده‌ام هر روز صبح پانزده دقیقه توجه‌آگاهی تمرین می‌کنم.' },
        { speaker: 'A', text: 'Does it really cultivate inner tranquility?', translation: 'واقعاً طمأنینه درونی به وجود می‌آورد؟' },
        { speaker: 'B', text: 'Absolutely. It develops emotional resilience so stress does not overwhelm you.', translation: 'قطعاً. تاب‌آوری هیجانی ایجاد می‌کند تا استرس بر تو غلبه نکند.' },
      ],
      grammar: {
        rule: 'Present Perfect for Life Experiences ("Have you ever...?")',
        explanation: 'برای صحبت درباره تجربیاتی که تا کنون در زندگی داشته‌ایم بدون ذکر زمان دقیق، از have/has + قسمت سوم فعل استفاده می‌کنیم.',
        examples: ['Have you ever tried meditation?', 'I have noticed a significant change in my focus.'],
      },
      quiz: [
        { question: 'Which word describes the psychological capacity to recover quickly from difficulties?', options: ['Hesitation', 'Resilience', 'Reluctance', 'Fragility'], answerIndex: 1, explanation: 'واژه Resilience به توانایی بازیابی روانی پس از چالش‌ها (تاب‌آوری) اشاره دارد.' },
        { question: 'Complete: "She ___ practiced meditation for two years."', options: ['have', 'has', 'is', 'did'], answerIndex: 1, explanation: 'برای سوم شخص مفرد (She) در حال کامل از has استفاده می‌شود.' },
        { question: 'What does "Contemplate" mean?', options: ['To rush quickly', 'To think deeply', 'To forget easily', 'To argue loudly'], answerIndex: 1, explanation: 'واژه Contemplate یعنی تأمل و ژرف‌اندیشی کردن.' },
      ],
    },
    {
      id: 'intermediate-2',
      theme: 'هدف‌گذاری و مدیریت هوشمندانه انرژی',
      vocabulary: [
        { word: 'Prioritize', meaning: 'اولویت‌بندی کردن', phonetic: '/praɪˈɒr.ɪ.taɪz/', example: 'You must prioritize your health over work.', exampleTranslation: 'باید سلامتی‌ات را بر کار اولویت بدهی.' },
        { word: 'Consistency', meaning: 'استمرار و تداوم', phonetic: '/kənˈsɪs.tən.si/', example: 'Consistency is far more important than intensity.', exampleTranslation: 'استمرار بسیار مهم‌تر از شدت عمل مقطعی است.' },
        { word: 'Burnout', meaning: 'فرسودگی شغلی و روحی', phonetic: '/ˈbɜːn.aʊt/', example: 'Rest is necessary to prevent severe burnout.', exampleTranslation: 'استراحت برای جلوگیری از فرسودگی شدید ضروری است.' },
        { word: 'Boundaries', meaning: 'مرزهای سالم فردی', phonetic: '/ˈbaʊn.dər.iz/', example: 'Setting clear boundaries protects your peace.', exampleTranslation: 'تعیین مرزهای شفاف از آرامش تو محافظت می‌کند.' },
      ],
      conversation: [
        { speaker: 'A', text: 'I feel exhausted all the time. I am worried about burnout.', translation: 'همیشه احساس خستگی می‌کنم. نگران فرسودگی روحی هستم.' },
        { speaker: 'B', text: 'Have you tried setting clearer boundaries between work and rest?', translation: 'آیا امتحان کرده‌ای که مرزهای شفاف‌تری بین کار و استراحت بگذاری؟' },
        { speaker: 'A', text: 'I struggle to prioritize my self-care.', translation: 'برام سخته که خودمراقبتی رو در اولویت قرار بدم.' },
        { speaker: 'B', text: 'Remember that small consistency every day yields tremendous results.', translation: 'به یاد داشته باش استمرار کوچک روزانه نتایج فوق‌العاده‌ای به بار می‌آورد.' },
      ],
      grammar: {
        rule: 'Modals of Advice & Obligation ("Should" vs "Must")',
        explanation: 'کلمه should برای توصیه و پیشنهاد دوستانه است، در حالی که must برای ضرورت حیاتی و درونی به کار می‌رود.',
        examples: ['You should take a short walk.', 'You must protect your mental peace.'],
      },
      quiz: [
        { question: 'Which term means a state of emotional and physical exhaustion caused by chronic stress?', options: ['Breakthrough', 'Burnout', 'Highlight', 'Outreach'], answerIndex: 1, explanation: 'واژه Burnout به معنای فرسودگی روانی و جسمانی ناشی از استرس مفرط است.' },
        { question: 'Choose the best word: "___ is the key to mastering any skill."', options: ['Consistency', 'Delay', 'Hesitation', 'Confusion'], answerIndex: 0, explanation: 'کلمه Consistency به معنی استمرار و پیوستگی است.' },
        { question: 'Which modal expresses strong personal obligation?', options: ['Might', 'Must', 'Could', 'Would'], answerIndex: 1, explanation: 'کلمه Must ضرورت و الزام قوی را بیان می‌کند.' },
      ],
    },
  ],
  advanced: [
    {
      id: 'advanced-1',
      theme: 'حکمت کیهانی، تواضع وجودی و فلسفه ذهن',
      vocabulary: [
        { word: 'Epiphany', meaning: 'اشراق ناگهانی / درک شهودی عمیق', phonetic: '/ɪˈpɪf.ən.i/', example: 'He experienced an epiphany while walking in nature.', exampleTranslation: 'او حین قدم زدن در طبیعت دچار یک اشراق و ادراک شهودی شد.' },
        { word: 'Equanimity', meaning: 'آرامش درون در تلاطم روزگار', phonetic: '/ˌek.wəˈnɪm.ə.ti/', example: 'Stoic philosophy teaches equanimity amid adversity.', exampleTranslation: 'فلسفه رواقی طمأنینه و آرامش را در میانه سختی‌ها می‌آموزد.' },
        { word: 'Interconnected', meaning: 'به‌هم‌پیوسته و یگانه', phonetic: '/ˌɪn.tə.kəˈnek.tɪd/', example: 'All living beings in the cosmos are deeply interconnected.', exampleTranslation: 'تمام موجودات زنده در کیهان عمیقاً به‌هم‌پیوسته هستند.' },
        { word: 'Transcendence', meaning: 'تعالی و فرارفتن از خود', phonetic: '/trænˈsen.dəns/', example: 'Art often leads to a state of spiritual transcendence.', exampleTranslation: 'هنر اغلب به حالتی از تعالی معنوی رهنمون می‌شود.' },
      ],
      conversation: [
        { speaker: 'A', text: 'When observing the night sky, do you ever feel a sense of transcendence?', translation: 'وقتی به آسمان شب می‌نگری، آیا هرگز حسی از تعالی و فرارفتن از خود را تجربه می‌کنی؟' },
        { speaker: 'B', text: 'Invariably. It was during stargazing that I had an epiphany regarding our interconnected existence.', translation: 'همواره. در حین تماشای ستارگان بود که اشراقی درباره وجود به‌هم‌پیوسته‌مان یافتم.' },
        { speaker: 'A', text: 'How does that cosmic perspective influence your daily equanimity?', translation: 'این بینش کیهانی چگونه بر آرامش درونی روزمره‌ات اثر می‌گذارد؟' },
        { speaker: 'B', text: 'It strips away trivial anxieties and anchors my consciousness in what truly endures.', translation: 'اضطراب‌های پیش‌پاافتاده را می‌زداید و آگاهی‌ام را در آنچه حقیقتاً جاودان است لنگر می‌اندازد.' },
      ],
      grammar: {
        rule: 'Inversion for Emphasis & Literary Style ("Never have I seen...")',
        explanation: 'هنگامی که عبارات منفی یا تاکیدی مانند Rarely, Seldom, Not only در ابتدای جمله می‌آیند، جای فاعل و فعل کمکی معکوس می‌شود.',
        examples: ['Seldom have I witnessed such profound stillness.', 'Not only does it calm the mind, but it also elevates clarity.'],
      },
      quiz: [
        { question: 'What is the definition of "Equanimity"?', options: ['Mental calmness and composure in a difficult situation', 'A loud physical celebration', 'Sudden fear of the unknown', 'Rapid changing of opinions'], answerIndex: 0, explanation: 'واژه Equanimity به سکون، آرامش و وقار درونی در شرایط دشوار اشاره دارد.' },
        { question: 'Choose the correct inverted form: "Rarely ___ such profound wisdom."', options: ['I have encountered', 'have I encountered', 'I encounter', 'had encountered I'], answerIndex: 1, explanation: 'پس از Rarely ساختار معکوس have I encountered صحیح است.' },
        { question: 'Which word represents a sudden intuitive realization or manifestation?', options: ['Catastrophe', 'Epiphany', 'Monotony', 'Distraction'], answerIndex: 1, explanation: 'واژه Epiphany به معنای اشراق و درک شهودی ناگهانی است.' },
      ],
    },
  ],
};

export function getCurriculumLesson(level: 'beginner' | 'intermediate' | 'advanced', dateStr?: string): DailyLesson {
  const list = CURRICULUM_LESSONS[level] || CURRICULUM_LESSONS.beginner;
  const today = dateStr || new Date().toISOString().slice(0, 10);
  const hash = [...today].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const selected = list[hash % list.length];
  return {
    ...selected,
    id: today,
  };
}

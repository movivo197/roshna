import {z} from 'zod';

const id = z.string().min(1).max(128);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const d = new Date(`${value}T12:00:00`);
  return !Number.isNaN(d.getTime()) && `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` === value;
});
export const modes = [
  {id:'focus',label:'تمرکز',description:'فضا برای کارهای مهم'},
  {id:'calm',label:'آرامش',description:'کمی جا برای نفس کشیدن'},
  {id:'grow',label:'رشد',description:'یک چیز تازه تجربه کن'},
  {id:'connect',label:'ارتباط',description:'زمانی برای آدم‌های زندگی'},
] as const;
export type LifeMode = typeof modes[number]['id'];
const step = z.object({id,title:z.string().trim().min(1).max(300),note:z.string().max(2000),doneAt:z.string().datetime().nullable(),taskId:id.nullable().default(null)}).strict();
const journey = z.object({id,template:z.string().max(80),title:z.string().trim().min(1).max(160),why:z.string().max(2000),startedAt:date,paused:z.boolean(),steps:z.array(step).min(1).max(60)}).strict();
const project = z.object({id,title:z.string().trim().min(1).max(160),outcome:z.string().max(2000),deadline:z.union([date,z.literal('')]),archived:z.boolean(),createdAt:z.string().datetime(),cards:z.array(z.object({id,title:z.string().trim().min(1).max(300),status:z.enum(['next','doing','done']),taskId:id.nullable().default(null)}).strict()).max(300)}).strict();
const checkin = z.object({date,energy:z.number().int().min(1).max(5),minutes:z.number().int().min(5).max(180),mode:z.enum(['focus','calm','grow','connect']),mood:z.number().int().min(1).max(5),win:z.string().max(3000),lesson:z.string().max(3000)}).strict();
const decision = z.object({id,title:z.string().trim().min(1).max(300),values:z.string().max(1200),options:z.string().max(4000),choice:z.string().max(2000),reviewOn:z.union([date,z.literal('')]),result:z.string().max(2000),createdAt:z.string().datetime()}).strict();
export const lifeSchema = z.object({
  checkins:z.array(checkin).max(10000).refine(v=>new Set(v.map(x=>x.date)).size===v.length),
  journeys:z.array(journey).max(100), projects:z.array(project).max(300), decisions:z.array(decision).max(3000),
  values:z.array(z.string().trim().min(1).max(60)).max(8),
  layout:z.enum(['balanced','quiet','compact']),
}).strict();
export type LifeData = z.infer<typeof lifeSchema>;
export type Journey = z.infer<typeof journey>;
export type Project = z.infer<typeof project>;
export type Checkin = z.infer<typeof checkin>;
export type Decision = z.infer<typeof decision>;
export const emptyLife = ():LifeData => ({checkins:[],journeys:[],projects:[],decisions:[],values:[],layout:'balanced'});

type Lesson = {title:string;practice:string;question:string;minutes:number};
export type JourneyTemplate = {id:string;title:string;subtitle:string;category:string;color:string;lessons:Lesson[]};
// Editorial exercises, not a validated assessment or treatment protocol.
export const journeyTemplates:JourneyTemplate[] = [
  {id:'attention',title:'دوباره، تمرکز',subtitle:'هفت تجربه برای پیدا کردن ریتم کار خودت',category:'تمرکز',color:'sage',lessons:[
    {title:'فقط یک کار',practice:'یک کار مشخص انتخاب کن. خروجی کوچک آن را بنویس و ده دقیقه به آن اختصاص بده.',question:'چه چیزی شروع را آسان‌تر کرد؟',minutes:10},
    {title:'نقشه حواس‌پرتی',practice:'حین یک جلسه کوتاه، هر حواس‌پرتی را با یک کلمه روی کاغذ ثبت کن و به کار برگرد.',question:'کدام حواس‌پرتی تکرار شد؟',minutes:10},
    {title:'محیط آماده',practice:'یک عامل مزاحم را از محیط حذف کن؛ فقط همان تغییری که در اختیار توست.',question:'تغییر محیط چه تفاوتی داشت؟',minutes:5},
    {title:'شروع روشن',practice:'یک جمله بساز: بعد از …، در …، کار … را برای ده دقیقه انجام می‌دهم.',question:'آیا نشانه و مکان شروع مشخص‌اند؟',minutes:5},
    {title:'بازه مناسب تو',practice:'یک بازه پانزده‌دقیقه‌ای را امتحان کن. بعد از آن مکث کن و درباره ادامه تصمیم بگیر.',question:'چه زمانی توجهت کمتر شد؟',minutes:15},
    {title:'پایان باز',practice:'پیش از پایان کار، اولین اقدام جلسه بعد را در یک جمله بنویس.',question:'قدم بعد آن‌قدر روشن است که بدون فکر شروعش کنی؟',minutes:5},
    {title:'ریتم شخصی',practice:'یادداشت‌ها را مرور کن. یک زمان و یک تغییر محیطی را برای هفته بعد انتخاب کن.',question:'چه چیزی را نگه می‌داری و چه چیزی را عوض می‌کنی؟',minutes:10},
  ]},
  {id:'self',title:'کمی نزدیک‌تر به خودم',subtitle:'هفت مکث برای مشاهده تجربه و ارزش‌ها',category:'خودشناسی',color:'lilac',lessons:[
    {title:'دیدن بدون برچسب',practice:'یک اتفاق امروز را فقط با آنچه دیدی و شنیدی توصیف کن؛ سپس برداشتت را جدا بنویس.',question:'چه تفاوتی میان اتفاق و برداشت من بود؟',minutes:7},
    {title:'نام احساس',practice:'احساس همین لحظه را نام ببر. اگر نام دقیقش را نمی‌دانی، یک توصیف ساده کافی است.',question:'در این لحظه به چه چیزی نیاز دارم؟',minutes:5},
    {title:'رد انرژی',practice:'دو فعالیتی را که انرژی دادند و دو فعالیتی را که انرژی گرفتند یادداشت کن.',question:'کدام بخش فردا قابل تغییر است؟',minutes:8},
    {title:'ارزش در عمل',practice:'سه چیز مهم زندگی‌ات را بنویس. برای یکی، یک رفتار کوچک قابل مشاهده انتخاب کن.',question:'چه رفتاری این ارزش را نشان می‌دهد؟',minutes:10},
    {title:'فکر و شواهد',practice:'یک فکر آزاردهنده معمولی را بنویس؛ شواهد موافق و مخالف و سپس یک برداشت متعادل‌تر را اضافه کن.',question:'آیا برداشت دیگری هم ممکن است؟',minutes:10},
    {title:'مرز کوچک',practice:'یک درخواست یا مرز محترمانه بنویس. لازم نیست فوراً آن را برای کسی بفرستی.',question:'چطور هم روشن باشم و هم محترمانه؟',minutes:7},
    {title:'نامه کوتاه',practice:'برای خودت سه جمله بنویس: چه فهمیدم، چه نیاز دارم و این هفته چه قدمی برمی‌دارم.',question:'کدام قدم در اختیار من است؟',minutes:10},
  ]},
  {id:'restart',title:'شروعی که ادامه دارد',subtitle:'هفت قدم برای یک عادت کوچک و قابل تنظیم',category:'عادت',color:'peach',lessons:[
    {title:'نسخه دو دقیقه‌ای',practice:'یک عادت انتخاب کن و کوچک‌ترین نسخه قابل انجام آن را بنویس.',question:'در یک روز شلوغ هم شدنی است؟',minutes:5},
    {title:'یک نشانه ثابت',practice:'عادت را به یک کار روزمره وصل کن: بعد از …، … را انجام می‌دهم.',question:'این نشانه چند بار در هفته رخ می‌دهد؟',minutes:5},
    {title:'کم کردن اصطکاک',practice:'وسایل لازم را از قبل آماده کن یا یک مانع شروع را بردار.',question:'کدام مانع واقعاً قابل حذف بود؟',minutes:5},
    {title:'ثبت تجربه',practice:'عادت کوچک را انجام بده و فقط تجربه‌ات را ثبت کن؛ بیشتر انجام‌دادن اختیاری است.',question:'اندازه فعلی عادت مناسب است؟',minutes:5},
    {title:'برنامه روز دشوار',practice:'برای روز کم‌انرژی یک نسخه ساده‌تر بنویس و راه برگشت پس از وقفه را مشخص کن.',question:'برای برگشت چه کمکی لازم دارم؟',minutes:7},
    {title:'کمک گرفتن',practice:'اگر مناسب می‌دانی از یک نفر درخواست همراهی مشخص کن؛ ارسال پیام انتخاب خودت است.',question:'چه نوع همراهی برای من مفید است؟',minutes:5},
    {title:'بازطراحی',practice:'مرور کن چه چیزی انجام شد. زمان، نشانه یا اندازه عادت را براساس تجربه تغییر بده.',question:'در هفته بعد چه چیزی را امتحان می‌کنم؟',minutes:10},
  ]},
];

export const projectBlueprints = {
  personal:{label:'هدف شخصی',steps:['نتیجه قابل مشاهده را بنویس','مانع اصلی را مشخص کن','یک قدم کوچک انجام بده','بازخورد بگیر و مسیر را تنظیم کن']},
  learning:{label:'یادگیری مهارت',steps:['سطح فعلی و نتیجه موردنظر را ثبت کن','یک منبع مشخص انتخاب کن','اولین تمرین کاربردی را بساز','از یک نفر بازخورد بگیر','نسخه اصلاح‌شده را آماده کن']},
  career:{label:'تغییر مسیر کاری',steps:['مهارت‌ها و محدودیت‌ها را فهرست کن','سه فرصت واقعی را بررسی کن','یک نمونه‌کار کوچک بساز','رزومه را برای یک فرصت بازنویسی کن','نتیجه اقدام‌ها را مرور کن']},
  create:{label:'ساخت محصول یا محتوا',steps:['مخاطب و مسئله را مشخص کن','کوچک‌ترین خروجی مفید را تعریف کن','نسخه اولیه را بساز','با یک مخاطب واقعی گفتگو کن','براساس بازخورد اصلاح کن']},
} as const;

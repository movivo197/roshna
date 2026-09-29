export const destinations = [
  {id:'home',label:'امروز من',group:'زندگی من',description:'حال امروز، اولویت‌ها و پیشنهاد قدم بعد'},
  {id:'companion',label:'همراه',group:'زندگی من',description:'از فکر تا طرح پروژه؛ پیشنهاد آفلاین و قابل ویرایش'},
  {id:'journeys',label:'مسیرهای رشد',group:'زندگی من',description:'تمرین‌های مرحله‌ای تمرکز، خودشناسی و عادت'},
  {id:'projects',label:'کارگاه پروژه',group:'زندگی من',description:'از قدم بعد تا نتیجه؛ تخته کارهای پروژه'},
  {id:'reflection',label:'آینه شخصی',group:'زندگی من',description:'مرور روز، ارزش‌ها و دفتر تصمیم‌ها'},
  {id:'trust',label:'مرکز اعتماد',group:'زندگی من',description:'خزانه رمزگذاری‌شده، خروجی و مدیریت نشست‌ها'},
  {id:'overview',label:'نمای کلاسیک',group:'روز من',description:'داشبورد و میانبرهای نسخه پیشین'},
  {id:'community',label:'گفتگو',group:'کشف و ارتباط',description:'آدم‌ها، گروه‌ها و گفتگوهای تازه'},
  {id:'markets',label:'اخبار و بازار',group:'کشف و ارتباط',description:'خبرها، قیمت‌ها و فهرست پیگیری'},
  {id:'language',label:'زبان‌آموز',group:'کشف و ارتباط',description:'آموزش و تمرین روزانه زبان انگلیسی'},
  {id:'games',label:'بازی',group:'کشف و ارتباط',description:'بازی‌های فکری و رقابت دوستانه'},
  {id:'planner',label:'برنامه‌ریزی',group:'روز من',description:'کارها و برنامه روزانه'},
  {id:'goals',label:'هدف‌های من',group:'روز من',description:'قدم بعدی و مسیر هدف‌ها'},
  {id:'habits',label:'عادت‌های کوچک',group:'روز من',description:'تمرین‌های کوچک و پیوستگی'},
  {id:'journal',label:'دفتر خودشناسی',group:'رشد و آرامش',description:'یادداشت‌ها و قدردانی'},
  {id:'wheel',label:'چرخه زندگی',group:'رشد و آرامش',description:'ارزیابی شخصی حوزه‌های زندگی'},
  {id:'focus',label:'زمان تمرکز',group:'روز من',description:'یک بازه برای کار عمیق'},
  {id:'insights',label:'گزارش رشد',group:'رشد و آرامش',description:'نگاهی به فعالیت‌های واقعی تو'},
  {id:'library',label:'کتابخانه رشد',group:'رشد و آرامش',description:'تمرین‌های کاربردی برای زندگی'},
  {id:'self-discovery',label:'خودشناسی و خداشناسی',group:'رشد و آرامش',description:'سفری از درون به معنا؛ تأمل روزانه، خودآگاهی و کشف ارتباط با خدا'},
  {id:'meditation',label:'مدیتیشن',group:'رشد و آرامش',description:'۱۵ دقیقه مدیتیشن روزانه، تکنیک‌ها و تنفس هدایت‌شده'},
  {id:'workout',label:'ورزش روزانه',group:'رشد و آرامش',description:'۱۵ دقیقه ورزش هوازی روزانه، روتین‌های چرخشی و مربی هوشمند'},
  {id:'gadgets',label:'گجت',group:'رشد و آرامش',description:'مکث‌های کوتاه برای ذهن و بدن'},
  {id:'settings',label:'تنظیمات',group:'شخصی‌سازی',description:'رنگ، ظاهر، حریم خصوصی و پشتیبان'},
] as const;
export type Destination = typeof destinations[number]['id'];
export const isDestination = (value:unknown):value is Destination => typeof value==='string'&&destinations.some(item=>item.id===value);
export function normalizeSearch(value:string){return value.normalize('NFKC').replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/[\u064b-\u065f\u200c]/g,'').toLocaleLowerCase('fa').trim();}

export type Preferences={favorites:Destination[];onboarded:boolean;analytics:boolean;motion:'system'|'reduced';start:Destination};
export const defaultPreferences:Preferences={favorites:['planner','focus','gadgets'],onboarded:false,analytics:false,motion:'system',start:'home'};
export const preferenceKey='roshana-preferences-v2';
export function readPreferences():Preferences{
  try {const value=JSON.parse(localStorage.getItem(preferenceKey)||'{}');return {favorites:Array.isArray(value.favorites)?[...new Set(value.favorites.filter(isDestination))].slice(0,8) as Destination[]:defaultPreferences.favorites,onboarded:value.onboarded===true,analytics:value.analytics===true,motion:value.motion==='reduced'?'reduced':'system',start:isDestination(value.start)?value.start:'home'};}catch{return {...defaultPreferences};}
}
export function writePreferences(value:Preferences){try{localStorage.setItem(preferenceKey,JSON.stringify(value));window.dispatchEvent(new Event('roshana:preferences'));return true}catch{return false}}

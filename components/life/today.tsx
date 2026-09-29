'use client';

import {useState} from 'react';
import {Activity, ArrowLeft, ArrowUpLeft, BookOpen, Check, Clock3, Compass, Feather, Flame, Focus, Flower2, Heart, Moon, Plus, ShieldCheck, Sparkles, Sun, Target, Users} from 'lucide-react';
import {dayKey,faNumber as n,lastDays,uid} from '@/lib/growth-data';
import {modes,type Checkin} from '@/lib/life';
import {DiscoveryDeck,FavoritesRail} from '@/components/super-shell';
import {Empty,LinkButton,Meter,type LifeProps} from './shared';

export default function Today({data,update,go,notify,today}:LifeProps){
  const entry=data.life.checkins.find(e=>e.date===today);
  const [busy,setBusy]=useState(false),[quick,setQuick]=useState('');
  const current:Checkin=entry||{date:today,energy:3,minutes:15,mode:'grow',mood:3,win:'',lesson:''};
  const tasks=data.tasks.filter(t=>t.date===today).sort((a,b)=>Number(a.done)-Number(b.done)||({high:0,medium:1,low:2}[a.priority]-{high:0,medium:1,low:2}[b.priority]));
  const complete=tasks.filter(t=>t.done).length;
  const active=data.life.journeys.filter(j=>!j.paused&&j.steps.some(s=>!s.doneAt));
  const focus=data.focus.filter(s=>s.date===today).reduce((a,b)=>a+b.minutes,0);
  const habits=data.habits.filter(h=>h.days.includes(today)).length;
  const days=lastDays(7,today);
  const next=active[0]?.steps.find(s=>!s.doneAt);
  async function save(patch:Partial<Checkin>){setBusy(true);try{if(await update(d=>{const old=d.life.checkins.find(e=>e.date===today)||current;return {...d,life:{...d.life,checkins:[...d.life.checkins.filter(e=>e.date!==today),{...old,...patch}].slice(-10000)}}}))notify('حال و ریتم امروزت ثبت شد.')}finally{setBusy(false)}}
  const suggestion=current.energy<=2?{title:'کوچک شروع کن؛ پنج دقیقه کافی است.',text:'انرژی امروز را کم ثبت کرده‌ای. یک قدم کوتاه انتخاب کن و بعد درباره ادامه تصمیم بگیر.',target:'gadgets' as const,label:'یک مکث برای خودم'}:current.mode==='connect'?{title:'یک ارتباط با توجه کامل.',text:'حالت ارتباط را انتخاب کرده‌ای. زمانی کوتاه برای یک گفتگوی دلخواه کنار بگذار.',target:'community' as const,label:'رفتن به گفتگو'}:current.mode==='calm'?{title:'یک صفحه برای فکرهایت باز کن.',text:'در حالت آرامش، چند خط نوشتن می‌تواند به روشن‌شدن تجربه همین لحظه کمک کند.',target:'journal' as const,label:'باز کردن دفتر'}:current.mode==='grow'&&next?{title:next.title,text:'این نخستین قدم انجام‌نشده از مسیر فعال توست؛ هر وقت آماده بودی ادامه بده.',target:'journeys' as const,label:'ادامه مسیر'}:{title:`${n(Math.min(current.minutes,25))} دقیقه، برای یک کار مشخص.`,text:'پیشنهاد براساس زمانی است که انتخاب کرده‌ای. یک خروجی کوچک تعریف کن و زمان‌سنج دلخواهت را تنظیم کن.',target:'focus' as const,label:'انتخاب زمان تمرکز'};
  return <div className={`l33 l33-today l33-density-${data.life.layout}`}>
    <header className="l33-welcome"><div><span className="l33-eyebrow"><span className="l33-live-dot"/> خانه زندگی تو · روشنا +۳۳</span><h1>امروز، به سبک <em>تو.</em></h1><p>{data.profile.name?`${data.profile.name} عزیز، `:''}برای کارهای مهم، خودت و لحظه‌های زندگی جا باز کن.</p></div><button className="l33-round" onClick={()=>go('companion')} aria-label="رفتن به همراه شخصی"><Sparkles size={23}/></button></header>
    <section className="l33-modes" aria-label="فضای امروز">{modes.map((mode,i)=>{const Icon=[Focus,Feather,Flower2,Users][i];return <button key={mode.id} aria-pressed={current.mode===mode.id} disabled={busy} onClick={()=>void save({mode:mode.id})}><Icon size={19}/><span>{mode.label}<small>{mode.description}</small></span>{current.mode===mode.id&&<span className="l33-mode-dot"/>}</button>})}</section>
    <div className="l33-bento">
      <section className="l33-hero"><div className="l33-hero-copy"><span className="l33-label"><Sparkles size={15}/> پیشنهاد امروز</span><h2>{suggestion.title}</h2><p>{suggestion.text}</p><button className="l33-hero-button" onClick={()=>go(suggestion.target)}>{suggestion.label}<ArrowLeft size={18}/></button><small>با انتخاب‌های خودت · بدون ارسال اطلاعات شخصی</small></div><div className="l33-orbit" aria-hidden="true"><div className="l33-orbit-ring"/><div className="l33-orbit-ring inner"/><div className="l33-orbit-sun"><Flower2 size={66} strokeWidth={1}/></div><span className="l33-orbit-star">✦</span><span className="l33-orbit-note"><span>یک قدم کوچک</span><strong>یک شروع تازه</strong></span></div></section>
      <section className="l33-card l33-pulse"><div className="l33-card-head"><h2><Heart size={18}/> حال همین لحظه</h2><span>{entry?'ثبت شده':'ثبت نشده'}</span></div><form key={`${today}:${entry?.energy}:${entry?.minutes}:${entry?.mood}`} onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void save({mood:Number(f.get('mood')),energy:Number(f.get('energy')),minutes:Number(f.get('minutes'))})}}><fieldset className="l33-moods"><legend>حالت چطور است؟</legend>{['سنگین','گرفته','معمولی','خوب','عالی'].map((label,i)=><label key={label}><input type="radio" name="mood" value={i+1} defaultChecked={current.mood===i+1}/><span>{['☁','☂','◐','☀','✦'][i]}</span><small>{label}</small></label>)}</fieldset><div className="l33-form-row"><label>انرژی<select name="energy" defaultValue={current.energy}>{[1,2,3,4,5].map(v=><option key={v} value={v}>{['خیلی کم','کم','متوسط','خوب','زیاد'][v-1]}</option>)}</select></label><label>وقت برای خودم<select name="minutes" defaultValue={current.minutes}>{[5,10,15,25,45,60,90,120,180].map(v=><option key={v} value={v}>{n(v)} دقیقه</option>)}</select></label></div><button className="l33-button" disabled={busy}>{busy?'در حال ثبت…':'ثبت ریتم امروز'}<Check size={16}/></button></form></section>
      <section className="l33-card l33-priorities"><div className="l33-card-head"><h2><Target size={18}/> قدم‌های امروز</h2><LinkButton onClick={()=>go('planner')}>برنامه کامل</LinkButton></div><Meter value={tasks.length?complete/tasks.length*100:0} label="پیشرفت کارهای امروز"/><div className="l33-task-list">{tasks.slice(0,4).map(t=><div key={t.id} className={t.done?'is-done':''}><button className="l33-check" aria-label={`${t.done?'لغو انجام':'انجام'} ${t.title}`} aria-pressed={t.done} onClick={()=>void update(d=>({...d,tasks:d.tasks.map(item=>item.id===t.id?{...item,done:!item.done}:item)}))}>{t.done&&<Check size={14}/>}</button><span>{t.title}<small>{t.time||({high:'اولویت مهم',medium:'با ریتم خودت',low:'یک قدم آرام'}[t.priority])}</small></span></div>)}{!tasks.length&&<p className="l33-muted">امروز را با یک کار کوچک و روشن شروع کن.</p>}</div><form className="l33-quick" onSubmit={async e=>{e.preventDefault();if(!quick.trim()||busy)return;setBusy(true);try{if(await update(d=>({...d,tasks:[...d.tasks,{id:uid(),title:quick.trim(),date:today,time:'',priority:'medium',done:false}]})))setQuick('')}finally{setBusy(false)}}}><input value={quick} onChange={e=>setQuick(e.target.value)} maxLength={300} required aria-label="کار سریع امروز" placeholder="قدم بعدی را بنویس…"/><button aria-label="افزودن به امروز" disabled={busy}><Plus size={19}/></button></form></section>
      <section className="l33-card l33-rhythm"><div className="l33-card-head"><h2><Sun size={18}/> ریتم این هفته</h2><span>از ثبت‌های خودت</span></div><div className="l33-week">{days.map(date=>{const count=data.tasks.filter(t=>t.date===date&&t.done).length+data.focus.filter(t=>t.date===date).length+data.habits.filter(h=>h.days.includes(date)).length;return <div key={date} title={`${date}: ${n(count)} فعالیت ثبت‌شده`}><div className="l33-week-track"><span style={{height:`${Math.min(100,count*15)}%`}}/></div><small>{new Date(`${date}T12:00:00`).toLocaleDateString('fa-IR',{weekday:'narrow'})}</small></div>})}</div><div className="l33-metrics"><div><strong>{n(focus)}</strong><small>دقیقه تمرکز امروز</small></div><div><strong>{n(habits)}<i> / {n(data.habits.length)}</i></strong><small>عادت ثبت‌شده</small></div><div><strong>{n(complete)}</strong><small>کار انجام‌شده</small></div></div></section>
    </div>
    {/* ── 4-card horizontal feature rail (scroll-snap) ── */}
    <div className="l33-feature-rail" role="region" aria-label="بخش‌های ویژه">
      {/* ── Card 1: خودشناسی و خداشناسی (Golden) ── */}
      <section className="l33-feature-card l33-card-gold">
        <div className="l33-feature-copy">
          <span className="l33-label l33-gold-label"><Sparkles size={13}/> مسیر درون · خودشناسی</span>
          <h2>خودشناسی و خداشناسی؛ سفری از درون به معنا</h2>
          <p>تأمل روزانه، چهار قلمرو شناخت، دفتر درون و مسیر هفت‌روزه برای روشن‌تر دیدن خود.</p>
          <button className="l33-hero-button" onClick={()=>go('self-discovery')}>
            ورود به مسیر درون <ArrowLeft size={17}/>
          </button>
          <small>خودآگاهی · ارزش‌ها · ارتباط با خدا</small>
        </div>
        <div className="l33-feature-orbit" aria-hidden="true">
          <div className="l33-orbit-ring"/>
          <div className="l33-orbit-ring inner"/>
          <div className="l33-orbit-sun gold-sun"><Sparkles size={44} strokeWidth={1.2}/></div>
          <span className="l33-orbit-star">✦</span>
        </div>
      </section>

      {/* ── Card 2: مدیتیشن (Chakra Violet) ── */}
      <section className="l33-feature-card l33-card-chakra">
        <div className="l33-feature-copy">
          <span className="l33-label l33-chakra-label"><Flower2 size={13}/> چاکرای فعال · ۱۵ دقیقه مراقبه</span>
          <h2>مدیتیشن روزانه؛ سکوت در میان هیاهو</h2>
          <p>سه سطح مبتدی تا پیشرفته با تکنیک‌های چرخشی، الگوی تنفس زنده و آوای کاسه تبتی.</p>
          <button className="l33-hero-button" onClick={()=>go('meditation')}>
            شروع ۱۵ دقیقه مدیتیشن <ArrowLeft size={17}/>
          </button>
          <small>تنفس هدایت‌شده · تعادل چاکراها</small>
        </div>
        <div className="l33-feature-orbit" aria-hidden="true">
          <div className="l33-orbit-ring"/>
          <div className="l33-orbit-ring inner"/>
          <div className="l33-orbit-sun chakra-sun"><Flower2 size={54} strokeWidth={1}/></div>
          <span className="l33-orbit-star">✦</span>
        </div>
      </section>

      {/* ── Card 3: ورزش روزانه (Red) ── */}
      <section className="l33-feature-card l33-card-red">
        <div className="l33-feature-copy">
          <span className="l33-label l33-red-label"><Activity size={13}/> ورزش هوازی · ۱۵ دقیقه پرانرژی</span>
          <h2>ورزش روزانه؛ چابکی و سلامت قلب</h2>
          <p>سه سطح مبتدی تا پیشرفته با روتین‌های چرخشی، مربی صوتی و کالری‌سنج زنده.</p>
          <button className="l33-hero-button" onClick={()=>go('workout')}>
            شروع ۱۵ دقیقه ورزش <ArrowLeft size={17}/>
          </button>
          <small>ایروبیک و تاباتا · تقویت قلب و عروق</small>
        </div>
        <div className="l33-feature-orbit" aria-hidden="true">
          <div className="l33-orbit-ring"/>
          <div className="l33-orbit-ring inner"/>
          <div className="l33-orbit-sun red-sun"><Activity size={50} strokeWidth={1.5}/></div>
          <span className="l33-orbit-star">✦</span>
        </div>
      </section>

      {/* ── Card 4: زبان‌آموز (Blue) ── */}
      <section className="l33-feature-card l33-card-blue">
        <div className="l33-feature-copy">
          <span className="l33-label l33-blue-label"><BookOpen size={13}/> DAILY ENGLISH · آموزش روزانه</span>
          <h2>زبان‌آموز؛ هر روز چند قدم به تسلط</h2>
          <p>واژگان کاربردی، مکالمه طبیعی، نکته گرامری و آزمون با هوش مصنوعی و تلفظ صوتی.</p>
          <button className="l33-hero-button" onClick={()=>go('language')}>
            ورود به درس امروز <ArrowLeft size={17}/>
          </button>
          <small>کلمات روزمره · شنیدار و گفتار</small>
        </div>
        <div className="l33-feature-orbit" aria-hidden="true">
          <div className="l33-orbit-ring"/>
          <div className="l33-orbit-ring inner"/>
          <div className="l33-orbit-sun blue-sun"><span style={{fontSize:'32px',lineHeight:1}}>🇬🇧</span></div>
          <span className="l33-orbit-star">✦</span>
        </div>
      </section>
    </div>
    <div className="l33-two"><section className="l33-card"><div className="l33-card-head"><h2><Compass size={18}/> داستانی که می‌سازی</h2><LinkButton onClick={()=>go('journeys')}>مسیرها</LinkButton></div>{active.length?active.slice(0,2).map(j=><button key={j.id} className="l33-journey-row" onClick={()=>go('journeys')}><span className="l33-token"><Flower2 size={21}/></span><span><strong>{j.title}</strong><small>{n(j.steps.filter(s=>s.doneAt).length)} از {n(j.steps.length)} قدم</small></span><ArrowUpLeft size={19}/></button>):<Empty title="یک مسیر کوچک انتخاب کن" text="تمرکز، خودشناسی یا ساخت عادت؛ تمرین‌های کوتاه با ریتم خودت."><button className="l33-button" onClick={()=>go('journeys')}>کشف مسیرها<ArrowLeft size={16}/></button></Empty>}</section><section className="l33-card"><div className="l33-card-head"><h2><Flame size={18}/> قرارهای کوچک با خودت</h2><LinkButton onClick={()=>go('habits')}>همه عادت‌ها</LinkButton></div>{data.habits.length?data.habits.slice(0,4).map(h=><button key={h.id} className="l33-habit" aria-pressed={h.days.includes(today)} onClick={()=>void update(d=>({...d,habits:d.habits.map(x=>x.id===h.id?{...x,days:x.days.includes(today)?x.days.filter(day=>day!==today):[...x.days,today]}:x)}))}><span>{h.title}</span><span className="l33-check">{h.days.includes(today)?<Check size={15}/>:<Plus size={15}/>}</span></button>):<Empty title="کوچک، اما ماندنی" text="یک عادت به‌اندازه دو دقیقه بساز و تجربه‌اش را ثبت کن."><LinkButton onClick={()=>go('habits')}>ساخت اولین عادت</LinkButton></Empty>}</section></div>
    <FavoritesRail go={go}/>
    {data.life.layout!=='quiet'&&<DiscoveryDeck go={go}/>}
    <section className="l33-evening"><span className="l33-evening-icon"><Moon size={25}/></span><div><span className="l33-eyebrow">پایان روز، شروع فهمیدن</span><h2>امروز چه چیزی ارزش یادآوری داشت؟</h2><p>یک اتفاق خوب، یک آموخته یا چیزی که فردا تغییر می‌دهی.</p></div><button className="l33-button" onClick={()=>go('reflection')}>مرور روز<ArrowLeft size={17}/></button></section>
    <div className="l33-bottom-note"><ShieldCheck size={14}/> فضای شخصی روی دستگاه توست؛ انتقال رمزگذاری‌شده فقط با انتخاب تو.<LinkButton onClick={()=>go('trust')}>حریم خصوصی</LinkButton></div>
  </div>;
}

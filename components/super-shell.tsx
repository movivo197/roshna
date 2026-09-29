'use client';

import {Component, useCallback, useEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {ArrowLeft, Bell, Bookmark, Check, Compass, Gamepad2, MessageCircle, Search, ShieldCheck, Sparkles, TrendingUp, X} from 'lucide-react';
import {destinations,defaultPreferences,isDestination,normalizeSearch,readPreferences,writePreferences,type Destination,type Preferences} from '@/lib/product';
import type {GrowthData} from '@/lib/growth-data';
import type {AppConfig} from '@/lib/app-config';

export function ModuleSkeleton(){return <section className="sx-skeleton" role="status" aria-label="در حال آماده‌سازی بخش"><div/><div/><div/><span>در حال آماده‌سازی…</span></section>}
export class ModuleBoundary extends Component<{children:ReactNode},{failed:boolean}>{
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true}}
  render(){return this.state.failed?<section className="sx-empty" role="alert"><h2>این بخش باز نشد.</h2><p>اتصال یا دریافت فایل‌های برنامه ممکن است قطع شده باشد. اطلاعات شخصی تو تغییری نکرده است.</p><button className="g-btn" onClick={()=>location.reload()}>بارگذاری دوباره</button></section>:this.props.children;}
}

export function usePreferences(){
  const [preferences,setPreferences]=useState<Preferences>(defaultPreferences);
  useEffect(()=>{const refresh=()=>{const next=readPreferences();setPreferences(next);document.documentElement.dataset.motion=next.motion;};refresh();window.addEventListener('storage',refresh);window.addEventListener('roshana:preferences',refresh);return()=>{window.removeEventListener('storage',refresh);window.removeEventListener('roshana:preferences',refresh)}},[]);
  const save=useCallback((patch:Partial<Preferences>)=>{const next={...readPreferences(),...patch};if(!writePreferences(next))return false;setPreferences(next);return true;},[]);
  return {preferences,save};
}

export function DiscoveryDeck({go}:{go:(tab:Destination)=>void}){
  const cards=[{id:'community' as const,icon:MessageCircle,title:'با هم، بیشتر',description:'گفتگو کن، همراه پیدا کن و یک جمع بساز.',label:'دنیای گفتگو',style:'social'},
    {id:'markets' as const,icon:TrendingUp,title:'یک نگاه آگاهانه',description:'خبرها و بازار را با منبع و زمان دقیق دنبال کن.',label:'نبض خبر و بازار',style:'market'},
    {id:'games' as const,icon:Gamepad2,title:'وقت یک بازی',description:'ذهنت را به بازی دعوت کن؛ تنها یا با یک دوست.',label:'باشگاه بازی',style:'play'}];
  return <section className="sx-discovery" aria-label="دنیای روشنا"><div className="sx-section-title"><span><Compass size={17}/> امروز چه چیزی را کشف می‌کنی؟</span><small>رشد · ارتباط · تجربه</small></div><div className="sx-discovery-grid">{cards.map(card=><button key={card.id} className={`sx-world sx-world-${card.style}`} onClick={()=>go(card.id)}><span className="sx-world-label"><card.icon size={19}/>{card.label}</span><strong>{card.title}</strong><p>{card.description}</p><span className="sx-world-link">وارد شو <ArrowLeft size={16}/></span><span className="sx-world-art" aria-hidden="true"><card.icon size={88} strokeWidth={.75}/></span></button>)}</div></section>;
}

export function FavoritesRail({go}:{go:(tab:Destination)=>void}){
  const {preferences}=usePreferences();
  if(!preferences.favorites.length)return null;
  return <div className="sx-favorites" aria-label="دسترسی‌های محبوب"><span><Bookmark size={14}/> محبوب‌های تو</span>{preferences.favorites.map(id=><button key={id} onClick={()=>go(id)}>{destinations.find(item=>item.id===id)?.label}<ArrowLeft size={12}/></button>)}</div>;
}

export type SearchKind = 'tasks'|'goals'|'journal'|'resources'|'projects'|'decisions'|'journeys';

export function GlobalSearch({data,config,go,onOpen}:{data:GrowthData;config:AppConfig;go:(tab:Destination)=>void;onOpen:(kind:SearchKind,id:string)=>void}){
  const dialog=useRef<HTMLDialogElement>(null),input=useRef<HTMLInputElement>(null);
  const [query,setQuery]=useState(''),[show,setShow]=useState(false);
  const {preferences,save}=usePreferences();
  const open=useCallback(()=>{setShow(true);setQuery('');dialog.current?.showModal();requestAnimationFrame(()=>input.current?.focus());},[]);
  useEffect(()=>{const key=(event:KeyboardEvent)=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();open();}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[open]);
  const close=()=>{setShow(false);dialog.current?.close()};
  const results=useMemo(()=>{
    const needle=normalizeSearch(query);
    if(!needle)return [];
    return [
      ...data.tasks.map(t=>({id:t.id,title:t.title,kind:'tasks' as const,label:'برنامه',text:t.title})),
      ...data.goals.map(t=>({id:t.id,title:t.title,kind:'goals' as const,label:'هدف',text:t.title+' '+t.why})),
      ...data.journal.map(t=>({id:t.id,title:t.text.slice(0,85)||'یادداشت روزانه',kind:'journal' as const,label:'دفتر شخصی',text:t.text+' '+t.gratitude})),
      ...config.resources.filter(t=>t.published).map(t=>({id:t.id,title:t.title,kind:'resources' as const,label:'کتابخانه',text:t.title+' '+t.description})),
      ...(data.life?.projects||[]).map(p=>({id:p.id,title:p.title,kind:'projects' as const,label:'پروژه',text:p.title+' '+p.outcome+' '+p.cards.map(c=>c.title).join(' ')})),
      ...(data.life?.decisions||[]).map(d=>({id:d.id,title:d.title,kind:'decisions' as const,label:'تصمیم',text:d.title+' '+d.choice+' '+d.values})),
      ...(data.life?.journeys||[]).map(j=>({id:j.id,title:j.title,kind:'journeys' as const,label:'مسیر رشد',text:j.title+' '+j.why+' '+j.steps.map(s=>s.title+' '+s.note).join(' ')})),
    ].filter(item=>normalizeSearch(item.text).includes(needle)).slice(0,25);
  },[query,data,config]);
  const sections=destinations.filter(item=>normalizeSearch(item.label+' '+item.description).includes(normalizeSearch(query)));
  return <><button className="sx-search-trigger" onClick={open} aria-label="جستجوی سراسری"><Search size={18}/><span>جستجو در روشنا…</span><kbd dir="ltr">Ctrl K</kbd></button><dialog ref={dialog} className="sx-dialog sx-search-dialog" onClose={()=>setShow(false)} onClick={e=>{if(e.target===e.currentTarget)close()}} aria-label="جستجوی سراسری">{show&&<><header><Search size={20}/><input ref={input} type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="نام بخش، برنامه، هدف یا یادداشت…" aria-label="عبارت جستجو"/><button className="g-icon-btn" onClick={close} aria-label="بستن جستجو"><X size={20}/></button></header><p className="sx-private-note"><ShieldCheck size={13}/> جستجوی یادداشت‌های شخصی فقط روی دستگاه تو انجام می‌شود.</p><div className="sx-search-results">{sections.map(item=><div className="sx-search-result" key={item.id}><button onClick={()=>{close();go(item.id)}}><span>{item.label}</span><small>{item.description}</small></button><button className="g-icon-btn" aria-label={`${preferences.favorites.includes(item.id)?'حذف از':'افزودن به'} محبوب‌ها: ${item.label}`} aria-pressed={preferences.favorites.includes(item.id)} onClick={()=>save({favorites:preferences.favorites.includes(item.id)?preferences.favorites.filter(id=>id!==item.id):[...preferences.favorites,item.id].slice(-8)})}><Bookmark size={17} fill={preferences.favorites.includes(item.id)?'currentColor':'none'}/></button></div>)}{results.map(item=><button className="sx-record-result" key={item.kind+item.id} onClick={()=>{close();onOpen(item.kind,item.id)}}><small>{item.label}</small><span>{item.title}</span><ArrowLeft size={15}/></button>)}{!sections.length&&!results.length&&<div className="sx-empty"><Search size={26}/><p>چیزی پیدا نشد. عبارت کوتاه‌تری بنویس.</p></div>}</div></>}</dialog></>;
}

type InboxItem={id:string;title:string;href:string;createdAt:string|number;read:boolean};
export function NotificationCenter({go}:{go:(tab:Destination)=>void}){
  const [items,setItems]=useState<InboxItem[]>([]),[open,setOpen]=useState(false),[status,setStatus]=useState(''),[signedIn,setSignedIn]=useState(false),[busy,setBusy]=useState(false);
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{
    let active=true;const controller=new AbortController();
    const refresh=async()=>{if(document.hidden||!navigator.onLine)return;try{const response=await fetch('/api/community/notifications',{cache:'no-store',signal:controller.signal});if(!active)return;if(response.status===401){setItems([]);setSignedIn(false);setStatus('');return;}if(!response.ok)throw new Error();const value=await response.json();if(active){setItems(value.items||[]);setSignedIn(true);setStatus('');}}catch{if(active)setStatus('دریافت اعلان‌ها ممکن نشد؛ دوباره تلاش کن.')}};
    const session=()=>{setItems([]);setSignedIn(false);void refresh()};
    void refresh();const timer=setInterval(refresh,60000);window.addEventListener('roshana:session',session);window.addEventListener('online',refresh);document.addEventListener('visibilitychange',refresh);
    return()=>{active=false;controller.abort();clearInterval(timer);window.removeEventListener('roshana:session',session);window.removeEventListener('online',refresh);document.removeEventListener('visibilitychange',refresh)};
  },[]);
  useEffect(()=>{if(open)dialog.current?.showModal();else dialog.current?.close()},[open]);
  async function markRead(){setBusy(true);try{const response=await fetch('/api/community/notifications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'read-all'})});if(!response.ok)throw Error();setItems(current=>current.map(item=>({...item,read:true})));}catch{setStatus('ثبت وضعیت خواندن ممکن نشد.')}finally{setBusy(false)}}
  const unread=items.filter(item=>!item.read).length;
  return <><button className="g-icon-btn sx-notification-trigger" aria-label={`اعلان‌ها${unread?`، ${unread} خوانده‌نشده`:''}`} onClick={()=>setOpen(true)}><Bell size={20}/>{unread>0&&<i/>}</button><dialog className="sx-dialog sx-inbox" ref={dialog} onClose={()=>setOpen(false)} onClick={e=>{if(e.target===e.currentTarget)setOpen(false)}} aria-labelledby="inbox-heading"><header><h2 id="inbox-heading">مرکز اعلان‌ها</h2><button className="g-icon-btn" aria-label="بستن اعلان‌ها" onClick={()=>setOpen(false)}><X size={20}/></button></header>{status&&<p className="sx-error" role="status">{status}</p>}{unread>0&&<button className="g-text-btn" disabled={busy} onClick={markRead}><Check size={15}/>همه را خواندم</button>}{items.length?<div className="sx-inbox-list">{items.map(item=><button key={item.id} className={item.read?'':'unread'} onClick={()=>{let hash='community';try{const target=new URL(item.href,location.origin);if(target.origin===location.origin)hash=target.hash.slice(1)}catch{}setOpen(false);go(isDestination(hash)?hash:'community')}}><Bell size={18}/><span>{item.title}<small>{new Date(item.createdAt).toLocaleString('fa-IR',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</small></span>{!item.read&&<i/>}</button>)}</div>:<div className="sx-empty"><Bell size={34}/><h3>{signedIn?'فعلاً خبر تازه‌ای نیست.':'گفتگو از یک سلام شروع می‌شود.'}</h3><p>{signedIn?'درخواست‌های دوستی و رویدادهای حساب اینجا نمایش داده می‌شوند.':'برای دریافت اعلان‌های گفتگو و بازی وارد حساب کاربری شو.'}</p>{!signedIn&&<button className="g-btn primary" onClick={()=>{setOpen(false);go('community')}}>ورود به گفتگو</button>}</div>}<footer>یادآورهای شخصی را از تنظیمات برنامه مدیریت کن.</footer></dialog></>;
}

export function Personalization({notify}:{notify:(message:string)=>void}){
  const {preferences,save}=usePreferences();
  function change(patch:Partial<Preferences>){notify(save(patch)?'انتخابت ذخیره شد.':'ذخیره تنظیمات در این مرورگر ممکن نشد.')}
  return <section className="g-card sx-personalization"><div className="g-card-heading"><h2><Compass size={19}/> روشنا به سبک تو</h2></div><label className="g-field">صفحه شروع<select value={preferences.start} onChange={event=>change({start:event.target.value as Destination})}>{destinations.map(item=><option value={item.id} key={item.id}>{item.label}</option>)}</select></label><p>تا ۸ بخش محبوبت را برای دسترسی سریع انتخاب کن.</p><div className="sx-favorite-picker">{destinations.filter(item=>!['home','settings'].includes(item.id)).map(item=><button key={item.id} aria-pressed={preferences.favorites.includes(item.id)} className={preferences.favorites.includes(item.id)?'selected':''} onClick={()=>change({favorites:preferences.favorites.includes(item.id)?preferences.favorites.filter(id=>id!==item.id):[...preferences.favorites,item.id].slice(-8)})}><Bookmark size={14}/>{item.label}</button>)}</div><label className="sx-check-line"><input type="checkbox" checked={preferences.motion==='reduced'} onChange={e=>change({motion:e.target.checked?'reduced':'system'})}/><span><strong>حرکت کمتر</strong><small>انیمیشن‌های تزئینی را خاموش کن؛ انتخاب دستگاه هم رعایت می‌شود.</small></span></label><label className="sx-check-line"><input type="checkbox" checked={preferences.analytics} onChange={e=>change({analytics:e.target.checked})}/><span><strong>کمک به بهترشدن روشنا</strong><small>فقط شمارش بازدید بخش‌ها به سرور ارسال می‌شود؛ بدون شناسه، متن یادداشت یا محتوای گفتگو. درخواست عدم ردیابی مرورگر مقدم است.</small></span></label><button className="g-text-btn" onClick={()=>change({onboarded:false})}>نمایش راهنمای شروع</button></section>;
}

export function Onboarding({data,update,go}:{data:GrowthData;update:(fn:(data:GrowthData)=>GrowthData)=>Promise<boolean>;go:(tab:Destination)=>void}){
  const {preferences,save}=usePreferences();const [open,setOpen]=useState(false),[step,setStep]=useState(0),[name,setName]=useState(''),[intent,setIntent]=useState<Destination>('planner'),[busy,setBusy]=useState(false),[error,setError]=useState('');const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const timer=setTimeout(()=>{if(!readPreferences().onboarded)setOpen(true)},900);return()=>clearTimeout(timer)},[preferences.onboarded]);
  useEffect(()=>{if(open)dialog.current?.showModal();else dialog.current?.close()},[open]);
  async function finish(skip=false){setBusy(true);setError('');if(!skip&&name.trim()&&!await update(current=>({...current,profile:{...current.profile,name:name.trim().slice(0,60)}}))){setError('نام ذخیره نشد. دوباره تلاش کن.');setBusy(false);return;}if(!save({onboarded:true,...(!skip?{favorites:[intent,...defaultPreferences.favorites.filter(id=>id!==intent)].slice(0,4)}:{})})){setError('ذخیره راهنما ممکن نشد.');setBusy(false);return;}setOpen(false);setBusy(false);if(!skip)go(intent)}
  return <dialog ref={dialog} className="sx-dialog sx-onboarding" onCancel={e=>{e.preventDefault();void finish(true)}} aria-labelledby="welcome-heading"><div className="sx-onboarding-symbol"><Sparkles size={36}/></div><span className="sx-kicker">فضای تو، با ریتم تو</span><h2 id="welcome-heading">{step===0?'به روشنا خوش آمدی.':'از کجا شروع کنیم؟'}</h2>{step===0?<><p>یک خانه برای رشد، گفتگو، آگاهی و بازی. ابزارهای شخصی بدون حساب هم کار می‌کنند؛ برای ارتباط با دیگران حساب جداگانه می‌سازی.</p><label className="g-field">دوست داری چه صدایت کنیم؟<input value={name} maxLength={60} onChange={e=>setName(e.target.value)} placeholder={data.profile.name||'نام یا نام مستعار؛ اختیاری'}/></label><div className="sx-private-note"><ShieldCheck size={17}/> یادداشت‌های شخصی فقط روی دستگاه تو می‌مانند.</div></>:<div className="sx-intent-grid">{[{id:'planner',label:'نظم و تمرکز'},{id:'gadgets',label:'آرامش و خودشناسی'},{id:'community',label:'ارتباط و همراهی'},{id:'games',label:'بازی و تجربه'}].map(item=><button key={item.id} aria-pressed={intent===item.id} className={intent===item.id?'selected':''} onClick={()=>setIntent(item.id as Destination)}>{item.label}{intent===item.id&&<Check size={16}/>}</button>)}</div>}{error&&<p role="alert">{error}</p>}<footer><button className="g-btn primary" disabled={busy} onClick={()=>step===0?setStep(1):void finish()}>{busy?'در حال ذخیره…':step===0?'ادامه':'شروع کنیم'}<ArrowLeft size={17}/></button><button className="g-text-btn" disabled={busy} onClick={()=>void finish(true)}>فعلاً رد می‌کنم</button></footer></dialog>;
}

export function UsageSignal({tab}:{tab:Destination}){
  useEffect(()=>{const preferences=readPreferences();const browser=navigator as Navigator&{globalPrivacyControl?:boolean};if(!preferences.analytics||browser.globalPrivacyControl||navigator.doNotTrack==='1'||!navigator.onLine)return;const timer=setTimeout(()=>{void fetch('/api/analytics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({section:tab}),credentials:'omit',keepalive:true}).catch(()=>{});},2000);return()=>clearTimeout(timer)},[tab]);return null;
}

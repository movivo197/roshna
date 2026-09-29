'use client';

import {useCallback, useEffect, useRef, useState, type CSSProperties} from 'react';
import {ArrowLeft, Check, ChevronLeft, Clock3, Eye, Flower2, Heart, History, Leaf, Pause, Play, RotateCcw, ShieldCheck, Sparkles, Sprout, Trash2, WandSparkles, Wind, X, Zap} from 'lucide-react';
import {faNumber as n, uid, type GadgetRecord, type GrowthData} from '@/lib/growth-data';

type Kind = GadgetRecord['kind'];
type Save = (record: GadgetRecord) => Promise<boolean>;
type Props = {data: GrowthData; update: (change: (current: GrowthData) => GrowthData) => Promise<boolean>; notify: (message: string) => void};
const tools = [
  {id:'reframe', title:'کارگاه باور تازه', description:'یک باور تکرارشونده را ببین؛ یک نگاه تازه و باورپذیر به جایش بنویس.', tag:'ذهن', time:'۲ دقیقه', tone:'mint', icon:WandSparkles},
  {id:'release', title:'رها کن، جا باز کن', description:'فکرت را روی یک سنگ بگذار. نگه دار، رها کن و سبک‌تر ادامه بده.', tag:'ذهن', time:'۱ دقیقه', tone:'rose', icon:Zap},
  {id:'breathing', title:'یک نفس، یک مکث', description:'برای چند لحظه با یک دایره آرام همراه شو و به نفست توجه کن.', tag:'آرامش', time:'۱–۲ دقیقه', tone:'blue', icon:Wind},
  {id:'grounding', title:'برگرد به همین‌جا', description:'با پنج حس، دوباره به همین لحظه و دنیای اطرافت توجه کن.', tag:'حضور', time:'۲ دقیقه', tone:'lilac', icon:Eye},
  {id:'body', title:'بدنت را به یاد بیاور', description:'چهار مکث کوچک میان کارهای روز؛ برای توجه به نیازهای بدنت.', tag:'جسم', time:'به ریتم تو', tone:'peach', icon:Sprout},
  {id:'gratitude', title:'سه نقطه روشن', description:'سه چیز کوچک که امروز برایت ارزشمند بودند، در یک کارت نگه دار.', tag:'دل', time:'۲ دقیقه', tone:'gold', icon:Heart},
] as const;

function useReducedMotion(){
  const [reduced,setReduced]=useState(false);
  useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const change=()=>setReduced(media.matches);change();media.addEventListener('change',change);return()=>media.removeEventListener('change',change)},[]);
  return reduced;
}

function newRecord(kind:Kind,id:string,values:Partial<GadgetRecord>={}):GadgetRecord{
  return {id,kind,createdAt:new Date().toISOString(),before:'',after:'',note:'',seconds:0,...values};
}

export default function Gadgets({data,update,notify}:Props){
  const [selected,setSelected]=useState<Kind>('reframe'),[filter,setFilter]=useState<Kind|'all'>('all'),[limit,setLimit]=useState(10),[seed,setSeed]=useState<GadgetRecord|null>(null),[busy,setBusy]=useState(false),[effects,setEffects]=useState(true),[haptics,setHaptics]=useState(true);
  const reduced=useReducedMotion(), saving=useRef(false), workbench=useRef<HTMLElement>(null);
  const history=(data.gadgets||[]).slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  const visible=history.filter(entry=>filter==='all'||entry.kind===filter);
  const current=tools.find(tool=>tool.id===selected)!;
  const save:Save=useCallback(async record=>{
    if(saving.current)return false;
    saving.current=true;setBusy(true);
    try{
      const ok=await update(d=>({...d,gadgets:[record,...(d.gadgets||[]).filter(item=>item.id!==record.id)]}));
      if(ok)notify('تمرین در تاریخچه گجت‌ها ذخیره شد.');
      return ok;
    }finally{saving.current=false;setBusy(false)}
  },[update,notify]);
  function select(kind:Kind){if(busy)return;setSeed(null);setSelected(kind);requestAnimationFrame(()=>workbench.current?.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'}));}
  async function remove(id:string){if(busy||!confirm('این تمرین از تاریخچه گجت‌ها حذف شود؟'))return;setBusy(true);try{if(await update(d=>({...d,gadgets:(d.gadgets||[]).filter(item=>item.id!==id)})))notify('تمرین از تاریخچه حذف شد.')}finally{setBusy(false)}}
  return <div className="gx-page" data-effects={effects&&!reduced?'on':'off'}>
    <header className="gx-heading"><div><span className="gx-eyebrow">چند دقیقه، فقط برای تو</span><h1>گجت‌های کوچک، حالِ تازه <Sparkles size={25}/></h1><p>ابزارهای تعاملی برای مکث، تجربه و یک نگاه تازه به خودت.</p></div><span className="gx-local-badge"><ShieldCheck size={15}/>شخصی و آفلاین</span></header>
    <section className="gx-intro"><div><span className="gx-eyebrow">ذهن · جسم · آرامش</span><h2>گاهی یک تغییر کوچک در نگاه،<br/>شروع یک مسیر تازه است.</h2><p>امروز به چه چیزی نیاز داری؟ یک گجت انتخاب کن و چند لحظه برای خودت وقت بگذار.</p></div><Flower2 size={125} strokeWidth={.8} aria-hidden="true"/></section>
    <div className="gx-catalog" aria-label="انتخاب گجت">{tools.map(tool=><button key={tool.id} type="button" className={`gx-tile ${selected===tool.id?'is-selected':''}`} aria-pressed={selected===tool.id} disabled={busy} onClick={()=>select(tool.id)}><span className={`gx-tile-icon tone-${tool.tone}`}><tool.icon size={25}/></span><strong>{tool.title}</strong><p>{tool.description}</p><span className="gx-tile-meta"><span>{tool.tag} · {tool.time}</span><ChevronLeft size={16}/></span></button>)}</div>
    <section className="gx-workbench" ref={workbench} aria-labelledby="gadget-title">
      <header className="gx-workbench-head"><span className={`gx-selected-icon tone-${current.tone}`}><current.icon size={24}/></span><div><h2 id="gadget-title">{current.title}</h2><p>{current.description}</p></div><div className="gx-effect-options"><label><input type="checkbox" checked={effects&&!reduced} disabled={reduced} onChange={e=>setEffects(e.target.checked)}/>افکت حرکت</label><label><input type="checkbox" checked={haptics} onChange={e=>setHaptics(e.target.checked)}/>ویبره</label></div></header>
      <div key={`${selected}-${seed?.id||'new'}`}>
        {selected==='reframe'&&<Reframe save={save} seed={seed} effects={effects&&!reduced}/>}
        {selected==='release'&&<Release save={save} effects={effects&&!reduced} haptics={haptics&&!reduced}/>}
        {selected==='breathing'&&<Breathing save={save}/>}
        {selected==='grounding'&&<Grounding save={save}/>}
        {selected==='body'&&<BodyPause save={save}/>}
        {selected==='gratitude'&&<Gratitude save={save}/>}
      </div>
      <p className="gx-help"><Leaf size={15}/>این‌ها تمرین‌های توجه و تأمل‌اند؛ رهاکردن یک نوشته، به معنی پاک‌شدن خودکار یک باور از ذهن نیست.</p>
    </section>
    <section className="gx-history" aria-labelledby="gadgets-history-title"><header><div><span className="gx-eyebrow">ردِ قدم‌های کوچک تو</span><h2 id="gadgets-history-title"><History size={20}/> تاریخچه گجت‌ها <span className="g-tag">{n(history.length)} تمرین</span></h2></div><p>همراه با بقیه اطلاعاتت در فایل پشتیبان ذخیره می‌شود.</p></header>
      <div className="gx-history-filters" aria-label="فیلتر تاریخچه"><button className={filter==='all'?'active':''} onClick={()=>{setFilter('all');setLimit(10)}}>همه</button>{tools.map(tool=><button key={tool.id} className={filter===tool.id?'active':''} onClick={()=>{setFilter(tool.id);setLimit(10)}}>{tool.title}</button>)}</div>
      {!visible.length?<div className="gx-history-empty"><Sprout size={30}/><h3>{history.length?'هنوز تمرینی در این بخش نیست.':'اولین تجربه‌ات را ثبت کن.'}</h3><p>هر مکث کوچک، یک رد روشن در مسیر تو می‌گذارد.</p></div>:<div className="gx-history-list">{visible.slice(0,limit).map(entry=>{const tool=tools.find(t=>t.id===entry.kind)!;return <article className="gx-history-item" key={entry.id}><span className={`gx-tile-icon tone-${tool.tone}`}><tool.icon size={20}/></span><div className="gx-history-content"><div className="gx-history-title"><h3>{tool.title}</h3><time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString('fa-IR',{month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'})}</time></div>{entry.kind==='reframe'?<div className="gx-history-change"><div className="gx-old"><small>نگاه قبلی</small><p>{entry.before}</p></div><ArrowLeft size={18}/><div className="gx-new"><small>نگاه تازه</small><p>{entry.after}</p></div></div>:entry.kind==='release'?<p className="gx-history-text">{entry.before?`با این فکر فاصله گرفتم: «${entry.before}»`:'یک فکر را نمادین رها کردم؛ متن آن نگهداری نشده است.'}</p>:<p className="gx-history-text">{entry.after}</p>}{entry.note&&<p className="gx-history-text">{entry.note}</p>}{entry.kind==='reframe'&&<button className="g-text-btn" disabled={busy} onClick={()=>{setSeed(entry);setSelected('reframe');workbench.current?.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'})}}><RotateCcw size={14}/>دوباره به این باور نگاه کنم</button>}</div><button className="g-icon-btn danger" aria-label={`حذف ${tool.title} از تاریخچه`} disabled={busy} onClick={()=>void remove(entry.id)}><Trash2 size={16}/></button></article>})}</div>}
      {visible.length>limit&&<button className="g-btn gx-load-more" onClick={()=>setLimit(count=>count+10)}>نمایش تمرین‌های بیشتر</button>}
    </section>
  </div>;
}

function Reframe({save,seed,effects}:{save:Save;seed:GadgetRecord|null;effects:boolean}){
  const [before,setBefore]=useState(seed?.before||''),[after,setAfter]=useState(seed?.after||''),[step,setStep]=useState(''),[phase,setPhase]=useState<'idle'|'saving'|'done'>('idle'),[id,setId]=useState(uid),[error,setError]=useState('');
  const pending=useRef(false);
  async function submit(e:React.FormEvent){e.preventDefault();if(pending.current||phase==='done')return;if(!before.trim()||!after.trim()){setError('باور قبلی و نگاه تازه را بنویس.');return}if(before.trim()===after.trim()){setError('یک نگاه تازه و متفاوت بنویس؛ لازم نیست بزرگ یا بی‌نقص باشد.');return}pending.current=true;setError('');setPhase('saving');try{const ok=await save(newRecord('reframe',id,{before:before.trim(),after:after.trim(),note:step.trim()?`قدم کوچک من: ${step.trim()}`:''}));setPhase(ok?'done':'idle');if(!ok)setError('ذخیره انجام نشد؛ نوشته‌هایت اینجا مانده‌اند. خطای بالای صفحه را بررسی کن.')}finally{pending.current=false}}
  return <div className="gx-grid-two"><form onSubmit={submit}><label className="g-field">باور قبلی که مدام تکرار می‌شود<textarea maxLength={1500} required rows={3} value={before} disabled={phase!=='idle'} onChange={e=>setBefore(e.target.value)} placeholder="مثلاً: من همیشه کارها را نیمه‌تمام رها می‌کنم."/></label><label className="g-field">می‌خواهم این نگاه تازه را تمرین کنم<textarea maxLength={1500} required rows={3} value={after} disabled={phase!=='idle'} onChange={e=>setAfter(e.target.value)} placeholder="می‌توانم یک کار کوچک را انتخاب کنم و قدم‌به‌قدم تمامش کنم."/></label><label className="g-field">یک قدم واقعی برای تمرینش (اختیاری)<input maxLength={1000} value={step} disabled={phase!=='idle'} onChange={e=>setStep(e.target.value)} placeholder="امروز فقط ۱۰ دقیقه روی یک کار می‌مانم."/></label><p className="gx-help">جمله تازه را مهربانانه و باورپذیر بنویس؛ یک «می‌توانم تمرین کنم» از یک وعده ناممکن به خودت واقعی‌تر است.</p><div className="gx-actions">{phase==='done'?<button type="button" className="g-btn" onClick={()=>{setPhase('idle');setBefore('');setAfter('');setStep('');setId(uid())}}><PlusIcon/>یک باور دیگر</button>:<button className="g-btn primary" disabled={phase==='saving'}><WandSparkles size={18}/>{phase==='saving'?'در حال نگهداری…':'بازنویسی و ثبت باور'}</button>}</div>{error&&<p role="alert" className="gx-inline-status">{error}</p>}</form><div className="gx-stage"><div className={`gx-belief ${phase==='done'?'is-new':''} ${phase==='done'&&effects?'is-changing':''}`}><span className="gx-stage-star"><Sparkles size={35}/></span><span className="gx-belief-label">{phase==='done'?'یک نگاه تازه، یک امکان تازه':'جایی برای نگاه تازه تو'}</span><p className="gx-belief-text">{phase==='done'?after:'«من می‌توانم داستانی را که درباره خودم می‌گویم، دوباره ببینم.»'}</p>{phase==='done'&&<span className="g-tag"><Check size={13}/>در تاریخچه نگهداری شد</span>}</div><p className="gx-help">باور قبلی و تازه کنار هم ثبت می‌شوند، تا بعدها تغییر نگاهت را ببینی.</p></div></div>;
}

function PlusIcon(){return <span aria-hidden="true">＋</span>}

function Release({save,effects,haptics}:{save:Save;effects:boolean;haptics:boolean}){
  const [belief,setBelief]=useState(''),[keepText,setKeepText]=useState(false),[phase,setPhase]=useState<'idle'|'holding'|'saving'|'burst'|'done'>('idle'),[progress,setProgress]=useState(0),[id,setId]=useState(uid),[message,setMessage]=useState('');
  const [canVibrate,setCanVibrate]=useState(false),[simple,setSimple]=useState(false);
  const frame=useRef<number>(0),startTime=useRef<number|null>(null),phaseRef=useRef(phase),completion=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|null>(null),alive=useRef(true),input=useRef<'pointer'|'keyboard'|null>(null);
  phaseRef.current=phase;
  const hapticsRef=useRef(haptics);hapticsRef.current=haptics;
  const vibrate=useCallback((pattern:number|number[])=>{try{if(typeof navigator.vibrate==='function'&&(pattern===0||hapticsRef.current))navigator.vibrate(pattern)}catch{/* Haptic hardware is optional. */}},[]);
  const cancel=useCallback(()=>{if(startTime.current===null)return;startTime.current=null;input.current=null;cancelAnimationFrame(frame.current);vibrate(0);setProgress(0);setPhase('idle')},[vibrate]);
  useEffect(()=>{alive.current=true;setCanVibrate(typeof navigator.vibrate==='function');const hide=()=>{if(document.hidden)cancel()};window.addEventListener('blur',cancel);document.addEventListener('visibilitychange',hide);return()=>{alive.current=false;window.removeEventListener('blur',cancel);document.removeEventListener('visibilitychange',hide);cancelAnimationFrame(frame.current);if(timer.current)clearTimeout(timer.current);try{navigator.vibrate?.(0)}catch{}}},[cancel]);
  useEffect(()=>{if(!haptics)vibrate(0)},[haptics,vibrate]);
  async function finish(){
    if(completion.current||!belief.trim())return;
    completion.current=true;startTime.current=null;input.current=null;cancelAnimationFrame(frame.current);vibrate(0);setProgress(100);setPhase('saving');setMessage('');
    const ok=await save(newRecord('release',id,{before:keepText?belief.trim():'',after:'رهاسازی نمادین یک فکر',seconds:simple?0:3}));
    if(!alive.current)return;
    if(!ok){completion.current=false;setPhase('idle');setProgress(0);setMessage('ثبت انجام نشد؛ باور هنوز اینجاست. پس از رفع خطای ذخیره‌سازی دوباره تلاش کن.');return}
    setPhase(effects?'burst':'done');vibrate([55,45,90]);
    timer.current=setTimeout(()=>{setPhase('done');setBelief('');vibrate(0)},effects?1100:0);
  }
  function begin(mode:'pointer'|'keyboard'){
    if(startTime.current!==null||phaseRef.current!=='idle'||completion.current||simple)return;
    if(!belief.trim()){setMessage('اول فکری را که می‌خواهی با آن فاصله بگیری بنویس.');return}
    setMessage('');startTime.current=performance.now();input.current=mode;setPhase('holding');vibrate([35,450,45,400,55,350,65,300,75,250,90]);
    function tick(now:number){if(startTime.current===null)return;const value=Math.min(100,(now-startTime.current)/30);setProgress(value);if(value>=100){void finish();return}frame.current=requestAnimationFrame(tick)}
    frame.current=requestAnimationFrame(tick);
  }
  const locked=phase!=='idle',done=phase==='done'||phase==='burst';
  const holdStyle={'--hold':`${progress}%`} as CSSProperties;
  return <div className="gx-grid-two">
    <div>
      <label className="g-field">کدام فکر را می‌خواهی برای لحظه‌ای زمین بگذاری؟<textarea rows={4} maxLength={1500} value={belief} disabled={locked} onChange={e=>setBelief(e.target.value)} placeholder="مثلاً: برای شروع باید همه‌چیز بی‌نقص باشد."/></label>
      <label className="gx-check-option"><input type="checkbox" checked={keepText} disabled={locked} onChange={e=>setKeepText(e.target.checked)}/>متن این باور در تاریخچه هم بماند</label>
      <p className="gx-help">در حالت پیش‌فرض فقط انجام تمرین ثبت می‌شود؛ متن باور در تاریخچه ذخیره نمی‌شود.</p>
      <label className="gx-check-option"><input type="checkbox" checked={simple} disabled={locked} onChange={e=>setSimple(e.target.checked)}/>حالت دسترس‌پذیر: انجام با یک کلیک</label>
      {done ? <button className="g-btn" disabled={phase==='burst'} onClick={()=>{setPhase('idle');phaseRef.current='idle';setProgress(0);setBelief('');setId(uid());completion.current=false;setMessage('')}}><RotateCcw size={16}/>یک شروع تازه</button> : <button className={`gx-hold-button ${phase==='holding'?'is-holding':''} ${!belief.trim()?'is-disabled':''}`} style={holdStyle} disabled={phase==='saving'||!belief.trim()} aria-label={simple?'رهاسازی نمادین باور':'سه ثانیه نگه دار تا باور به‌صورت نمادین رها شود'} onPointerDown={e=>{if(simple||e.button!==0||!e.isPrimary)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);begin('pointer')}} onPointerMove={e=>{if(input.current!=='pointer')return;const box=e.currentTarget.getBoundingClientRect();if(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom)cancel()}} onPointerUp={()=>{if(input.current==='pointer')cancel()}} onPointerCancel={cancel} onLostPointerCapture={cancel} onBlur={cancel} onKeyDown={e=>{if(simple)return;if(e.key==='Escape'){cancel();return}if(e.key===' '||e.key==='Enter'){e.preventDefault();if(!e.repeat)begin('keyboard')}}} onKeyUp={e=>{if(!simple&&(e.key===' '||e.key==='Enter')){e.preventDefault();if(input.current==='keyboard')cancel()}}} onContextMenu={e=>e.preventDefault()} onClick={()=>{if(simple)void finish()}}><span className="gx-hold-progress"/><Zap size={22}/><span>{phase==='saving'?'در حال ثبت تمرین…':phase==='holding'?`نگه دار… ${n(Math.min(3,Math.ceil(3-progress*.03)))} ثانیه`:simple?'رها می‌کنم':'۳ ثانیه نگه دار؛ رها کن'}</span></button>}
      <p className="gx-help">{simple?'با کلیک، رهاسازی نمادین انجام و ثبت می‌شود.':'رهاکردن زودتر دکمه، تمرین را لغو می‌کند. با نگه‌داشتن Space یا Enter هم می‌توانی انجامش بدهی.'}</p>
      <p className="gx-help">{canVibrate?'ویبره در صورت پشتیبانی دستگاه و تنظیمات آن اجرا می‌شود.':'این مرورگر ویبره ندارد؛ افکت دیداری همچنان در دسترس است.'}</p>
      {message&&<p className="gx-inline-status" role="alert">{message}</p>}
    </div>
    <div className={`gx-stage gx-release-stage ${effects&&phase==='holding'?'is-holding':''} ${phase==='burst'?'is-burst':''} ${phase==='done'?'is-done':''}`}>
      <div className="gx-shockwave" aria-hidden="true"/>
      {phase!=='done'&&<div className="gx-belief-stone"><span>این فقط یک فکر است، نه تمامِ من.</span><p>{belief||'فکری که می‌خواهم رها کنم…'}</p></div>}
      {phase==='burst'&&<div className="gx-particles" aria-hidden="true">{Array.from({length:20},(_,i)=>{const particleStyle={'--dx':`${Math.cos(i*Math.PI/10)*(85+(i%3)*24)}px`,'--dy':`${Math.sin(i*Math.PI/10)*(85+(i%4)*19)}px`,'--rot':`${i*63}deg`,'--delay':`${i%4*18}ms`} as CSSProperties;return <i key={i} style={particleStyle}/>})}</div>}
      {phase==='done'&&<div className="gx-release-success" role="status"><Sprout size={52}/><h3>جا برای یک نگاه تازه باز شد.</h3><p>لازم نیست با این فکر بجنگم.<br/>می‌توانم ببینمش و قدم بعدی‌ام را انتخاب کنم.</p><span className="g-tag"><Check size={14}/>تمرین ثبت شد</span></div>}
      {phase==='holding'&&<span className="gx-release-count" aria-hidden="true">{n(Math.round(progress))}٪</span>}
    </div>
  </div>;
}

function Breathing({save}:{save:Save}){
  const [duration,setDuration]=useState(60),[elapsed,setElapsed]=useState(0),[running,setRunning]=useState(false),[saved,setSaved]=useState(false),[saving,setSaving]=useState(false),[id,setId]=useState(uid),[message,setMessage]=useState('');
  const started=useRef<number|null>(null),base=useRef(0),pending=useRef(false);
  const pause=useCallback(()=>{if(started.current!==null){base.current=Math.min(duration,base.current+(performance.now()-started.current)/1000);setElapsed(base.current);started.current=null}setRunning(false)},[duration]);
  useEffect(()=>{if(!running)return;const tick=()=>{if(started.current===null)return;const value=Math.min(duration,base.current+(performance.now()-started.current)/1000);setElapsed(value);if(value>=duration){started.current=null;base.current=duration;setRunning(false)}};const interval=setInterval(tick,100);const hide=()=>{if(document.hidden){pause();setMessage('با رفتن به پس‌زمینه، تمرین مکث کرد.')}};window.addEventListener('blur',pause);document.addEventListener('visibilitychange',hide);return()=>{clearInterval(interval);window.removeEventListener('blur',pause);document.removeEventListener('visibilitychange',hide)}},[running,duration,pause]);
  const complete=elapsed>=duration,inhale=elapsed%10<4;
  async function store(){if(pending.current||saved||!complete)return;pending.current=true;setSaving(true);try{const ok=await save(newRecord('breathing',id,{after:`${n(duration)} ثانیه مکث و توجه به تنفس`,seconds:duration}));setSaved(ok);setMessage(ok?'این مکث در تاریخچه تو ماند.':'ثبت انجام نشد؛ پس از رفع خطا دوباره تلاش کن.')}finally{pending.current=false;setSaving(false)}}
  function reset(seconds=duration){pause();started.current=null;base.current=0;setElapsed(0);setDuration(seconds);setId(uid());setSaved(false);setMessage('')}
  return <div className="gx-grid-two"><div><h3>فقط همراه نفست باش.</h3><p className="gx-help">دایره باز می‌شود: دم آرام. جمع می‌شود: بازدم آرام. نفست را نگه ندار و ریتم را به خودت تحمیل نکن؛ هر زمان خواستی مکث کن.</p><div className="gx-timer-options">{[60,120].map(seconds=><button className={`g-btn ${duration===seconds?'primary':''}`} key={seconds} disabled={running||saving} onClick={()=>reset(seconds)}>{n(seconds/60)} دقیقه</button>)}</div><div className="gx-actions">{complete?<><button className="g-btn primary" disabled={saving||saved} onClick={()=>void store()}><Check size={17}/>{saved?'در تاریخچه ثبت شد':saving?'در حال ثبت…':'ثبت این مکث'}</button><button className="g-btn" disabled={saving} onClick={()=>reset()}><RotateCcw size={16}/>از نو</button></>:<><button className="g-btn primary" onClick={()=>{if(running)pause();else{started.current=performance.now();setRunning(true);setMessage('')}}}>{running?<Pause size={17}/>:<Play size={17}/>} {running?'مکث':elapsed?'ادامه':'شروع تنفس همراه'}</button>{elapsed>0&&<button className="g-btn" onClick={()=>reset()}>از ابتدا</button>}</>}</div><p className="gx-help">اگر این ریتم برایت راحت نیست، تمرین را متوقف کن و عادی نفس بکش.</p>{message&&<p className="gx-inline-status" role="status">{message}</p>}</div><div className="gx-stage gx-breathe-stage"><div className={`gx-breathe-orb ${running?inhale?'is-inhale':'is-exhale':'is-rest'}`}><Wind size={32}/><strong aria-live="polite">{complete?'چه خوب که مکث کردی':running?inhale?'دم آرام':'بازدم آرام':elapsed?'یک مکث':'یک نفس تازه'}</strong><span>{running?(inhale?'۴ ثانیه، با آرامش':'۶ ثانیه، بدون عجله'):'با ریتم راحت خودت'}</span></div><span className="gx-breathe-time">{n(Math.max(0,Math.ceil(duration-elapsed)))} ثانیه باقی مانده</span></div></div>;
}

const senses=[{number:5,title:'پنج چیز که می‌بینی',prompt:'نگاهت را آرام بچرخان؛ رنگ‌ها، شکل‌ها یا نور را ببین.'},{number:4,title:'چهار چیز که حس می‌کنی',prompt:'مثلاً تماس پا با زمین، لباس روی پوست یا تکیه‌گاه صندلی.'},{number:3,title:'سه صدایی که می‌شنوی',prompt:'یک صدای نزدیک، یک صدای دور؛ بدون نیاز به قضاوت.'},{number:2,title:'دو بویی که متوجه می‌شوی',prompt:'اگر بویی نیست، دو بوی خوشایند را به یاد بیاور.'},{number:1,title:'یک مزه یا یک چیز دلنشین',prompt:'یک مزه را حس یا تصور کن؛ یا یک چیز کوچک و دلنشین را نام ببر.'}];
function Grounding({save}:{save:Save}){
  const [step,setStep]=useState(0),[answers,setAnswers]=useState(['','','','','']),[saved,setSaved]=useState(false),[saving,setSaving]=useState(false),[id,setId]=useState(uid),[error,setError]=useState('');const pending=useRef(false);
  const complete=step===senses.length;
  async function store(){if(pending.current||saved)return;pending.current=true;setSaving(true);try{const ok=await save(newRecord('grounding',id,{after:'چند لحظه به حواس و اطرافم توجه کردم.',note:senses.map((sense,i)=>`${sense.title}: ${answers[i]||'از این مرحله گذشتم'}`).join('\n')}));setSaved(ok);if(!ok)setError('ثبت انجام نشد؛ پاسخ‌ها اینجا مانده‌اند.')}finally{pending.current=false;setSaving(false)}}
  return <div className="gx-grid-two"><div><div className="gx-step-dots" aria-label={`مرحله ${n(Math.min(step+1,5))} از ۵`}>{senses.map((sense,i)=><span key={sense.number} className={i<step?'done':i===step?'active':''}>{i<step?<Check size={14}/>:n(sense.number)}</span>)}</div>{complete?<><h3>دوباره اینجایی.</h3><p className="gx-help">نیازی نیست حس خاصی داشته باشی. همین چند لحظه توجه، تمام این تمرین بود.</p><div className="gx-actions"><button className="g-btn primary" disabled={saving||saved} onClick={()=>void store()}>{saved?'تمرین ثبت شد':saving?'در حال ثبت…':'ثبت تجربه من'}</button><button className="g-btn" disabled={saving} onClick={()=>{setStep(0);setAnswers(['','','','','']);setSaved(false);setId(uid());setError('')}}>از ابتدا</button></div></>:<><h3>{senses[step].title}</h3><p className="gx-help">{senses[step].prompt}</p><label className="g-field">چیزهایی که متوجه شدی<textarea autoFocus={false} rows={4} maxLength={900} value={answers[step]} placeholder="با کلمات خودت بنویس…" onChange={e=>setAnswers(items=>items.map((value,i)=>i===step?e.target.value:value))}/></label><div className="gx-actions"><button className="g-btn primary" disabled={!answers[step].trim()} onClick={()=>setStep(s=>s+1)}>{step===4?'پایان تمرین':'مرحله بعد'}<ArrowLeft size={16}/></button><button className="g-text-btn" onClick={()=>setStep(s=>s+1)}>از این حس می‌گذرم</button>{step>0&&<button className="g-text-btn" onClick={()=>setStep(s=>s-1)}>مرحله قبل</button>}</div><p className="gx-help">اگر یکی از حواس برایت در دسترس نیست، به‌راحتی از آن مرحله بگذر.</p></>}{error&&<p className="gx-inline-status" role="alert">{error}</p>}</div><div className="gx-stage"><span className="gx-ground-count" aria-hidden="true">{complete?<Leaf size={65}/>:n(senses[step].number)}</span><h3>{complete?'همین لحظه کافی است.':'همین‌جا. همین لحظه.'}</h3><p className="gx-help">{complete?'می‌توانی با آرامش قدم بعدی‌ات را انتخاب کنی.':senses[step].title}</p></div></div>;
}

const bodySteps=[{title:'فک و شانه‌ها',text:'متوجه فک و شانه‌هایت شو. اگر راحت است، فشار اضافی را کمی رها کن.'},{title:'یک تغییر وضعیت',text:'اگر برایت ممکن و راحت است، حالت نشستن یا تکیه‌گاهت را کمی عوض کن.'},{title:'مکثی برای نگاه',text:'چند لحظه از نمایشگر فاصله بگیر و به نقطه‌ای در اطراف نگاه کن.'},{title:'بدنم الان چه می‌خواهد؟',text:'تشنه‌ام؟ خسته‌ام؟ نیاز به حرکت یا استراحت دارم؟ فقط متوجه نیازت شو.'}];
function BodyPause({save}:{save:Save}){
  const [step,setStep]=useState(0),[note,setNote]=useState(''),[saved,setSaved]=useState(false),[saving,setSaving]=useState(false),[id,setId]=useState(uid),[error,setError]=useState('');const pending=useRef(false);
  async function store(){if(pending.current||saved||step!==4)return;pending.current=true;setSaving(true);try{const ok=await save(newRecord('body',id,{after:'چهار مکث کوتاه برای توجه به بدنم',note:note.trim()}));setSaved(ok);if(!ok)setError('تمرین ثبت نشد؛ پس از رفع خطا دوباره تلاش کن.')}finally{pending.current=false;setSaving(false)}}
  return <div className="gx-grid-two"><div className="gx-body-steps">{bodySteps.map((item,i)=><div key={item.title} className={`gx-step-card ${i===step?'is-current':''} ${i<step?'is-done':''}`}><span>{i<step?<Check size={18}/>:n(i+1)}</span><div><h3>{item.title}</h3><p>{item.text}</p>{i===step&&<button className="g-text-btn" onClick={()=>setStep(s=>s+1)}>مکث کردم؛ بعدی <ArrowLeft size={14}/></button>}</div></div>)}</div><div className="gx-stage"><Sprout size={58} strokeWidth={1}/><h3>{step===4?'بدنت را شنیدی.':'بدنت هم در این مسیر همراه توست.'}</h3><p className="gx-help">حرکت اجباری نیست؛ فقط کاری را انجام بده که برای بدنت راحت است.</p>{step===4&&<><label className="g-field">الان متوجه چه نیازی شدم؟ (اختیاری)<textarea rows={3} maxLength={1500} value={note} disabled={saved||saving} onChange={e=>setNote(e.target.value)} placeholder="مثلاً چند دقیقه استراحت لازم دارم."/></label><div className="gx-actions"><button className="g-btn primary" disabled={saved||saving} onClick={()=>void store()}>{saved?'در تاریخچه ثبت شد':saving?'در حال ثبت…':'ثبت این مکث'}</button><button className="g-btn" disabled={saving} onClick={()=>{setStep(0);setSaved(false);setNote('');setId(uid());setError('')}}>دوباره</button></div></>}{error&&<p className="gx-inline-status" role="alert">{error}</p>}</div></div>;
}

function Gratitude({save}:{save:Save}){
  const [items,setItems]=useState(['','','']),[saved,setSaved]=useState(false),[saving,setSaving]=useState(false),[id,setId]=useState(uid),[error,setError]=useState('');const pending=useRef(false);
  async function submit(e:React.FormEvent){e.preventDefault();if(pending.current||saved)return;pending.current=true;setSaving(true);try{const ok=await save(newRecord('gratitude',id,{after:'سه نقطه روشن امروز من',note:items.map((item,i)=>`${n(i+1)}. ${item.trim()}`).join('\n')}));setSaved(ok);if(!ok)setError('کارت ثبت نشد؛ نوشته‌هایت اینجا مانده‌اند.')}finally{pending.current=false;setSaving(false)}}
  return <div className="gx-grid-two"><form onSubmit={submit}><p className="gx-help">لازم نیست روز خوبی بوده باشد. یک لحظه کوچک، یک آدم یا چیزی که برایت ارزش داشت کافی است.</p>{['یک چیز کوچک که خوشحالم کرد','یک همراهی یا مهربانی','چیزی که در خودم ارزشمند می‌بینم'].map((label,i)=><label className="g-field" key={label}>{n(i+1)}. {label}<textarea required rows={2} maxLength={1200} value={items[i]} disabled={saved||saving} onChange={e=>setItems(values=>values.map((value,index)=>i===index?e.target.value:value))}/></label>)}<div className="gx-actions"><button className="g-btn primary" disabled={saving||saved||items.some(item=>!item.trim())}><Heart size={17}/>{saved?'کارت در تاریخچه ماند':saving?'در حال ثبت…':'نگهداری این سه لحظه'}</button>{saved&&<button className="g-btn" type="button" onClick={()=>{setItems(['','','']);setSaved(false);setId(uid());setError('')}}>یک کارت تازه</button>}</div>{error&&<p className="gx-inline-status" role="alert">{error}</p>}</form><div className="gx-stage gx-gratitude-stack">{items.map((item,i)=><div className="gx-gratitude-note" key={i}><span>{['✦','♡','☀'][i]}</span><p>{item||['یک اتفاق کوچک…','یک مهربانی…','یک توانایی در من…'][i]}</p></div>)}{saved&&<span className="g-tag"><Check size={14}/>ثبت شد</span>}</div></div>;
}

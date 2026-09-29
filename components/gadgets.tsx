'use client';

import {useCallback, useEffect, useRef, useState, type CSSProperties} from 'react';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  Clock3,
  Eye,
  Flame,
  Flower2,
  Heart,
  History,
  Inbox,
  Leaf,
  Lock,
  Music,
  Pause,
  Play,
  Radio,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Sprout,
  Trash2,
  Volume2,
  VolumeX,
  WandSparkles,
  Wind,
  X,
  Zap,
  Archive,
  Compass
} from 'lucide-react';
import {faNumber as n, uid, type GadgetRecord, type GrowthData} from '@/lib/growth-data';

type Kind = GadgetRecord['kind'];
type Save = (record: GadgetRecord) => Promise<boolean>;
type Props = {data: GrowthData; update: (change: (current: GrowthData) => GrowthData) => Promise<boolean>; notify: (message: string) => void};

const tools = [
  {id:'reframe', title:'کارگاه باور تازه', description:'یک باور تکرارشونده را ببین؛ یک نگاه تازه و باورپذیر به جایش بنویس.', tag:'ذهن', time:'۲ دقیقه', tone:'mint', icon:WandSparkles},
  {id:'release', title:'رها کن، جا باز کن', description:'فکرت را روی یک سنگ بگذار. نگه دار، رها کن و سبک‌تر ادامه بده.', tag:'ذهن', time:'۱ دقیقه', tone:'rose', icon:Zap},
  {id:'breathing', title:'یک نفس، یک مکث', description:'برای چند لحظه با یک دایره آرام همراه شو و به نفست توجه کن.', tag:'آرامش', time:'۱–۲ دقیقه', tone:'blue', icon:Wind},
  {id:'breathe478', title:'تنفس عمیق ۴-۷-۸', description:'۴ ثانیه دم، ۷ ثانیه حبس و ۸ ثانیه بازدم آرام برای ریست سیستم عصبی.', tag:'تنفس', time:'۲ دقیقه', tone:'mint', icon:Sparkles},
  {id:'frequency', title:'فرکانس‌های ذهن و ارتعاش', description:'نوای زنده ۴۳۲Hz، ۵۲۸Hz و امواج آلفا/تتا با تولیدکننده صوت درونی.', tag:'فرکانس', time:'پخش زنده', tone:'cyan', icon:Radio},
  {id:'shadow', title:'آینه سایه‌ها', description:'کشف ریشه خشم و رنجش از دیگران و یکپارچه‌سازی سایه با شفقت.', tag:'خودشناسی', time:'۳ دقیقه', tone:'purple', icon:Flame},
  {id:'surrender', title:'صندوق توکل و رهایی', description:'سپردن دغدغه‌های خارج از کنترل به صندوق امن و رهایی از استرس نتیجه.', tag:'آرامش', time:'۱ دقیقه', tone:'gold', icon:Archive},
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
  const current=tools.find(tool=>tool.id===selected) || tools[0];
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
        {selected==='breathe478'&&<Breathing478 save={save} haptics={haptics&&!reduced}/>}
        {selected==='frequency'&&<FrequencyTuner save={save}/>}
        {selected==='shadow'&&<ShadowWork save={save} seed={seed}/>}
        {selected==='surrender'&&<SurrenderBox save={save} effects={effects&&!reduced}/>}
        {selected==='grounding'&&<Grounding save={save}/>}
        {selected==='body'&&<BodyPause save={save}/>}
        {selected==='gratitude'&&<Gratitude save={save}/>}
      </div>
      <p className="gx-help"><Leaf size={15}/>این‌ها تمرین‌های توجه و تأمل‌اند؛ رهاکردن یک نوشته، به معنی پاک‌شدن خودکار یک باور از ذهن نیست.</p>
    </section>
    <section className="gx-history" aria-labelledby="gadgets-history-title"><header><div><span className="gx-eyebrow">ردِ قدم‌های کوچک تو</span><h2 id="gadgets-history-title"><History size={20}/> تاریخچه گجت‌ها <span className="g-tag">{n(history.length)} تمرین</span></h2></div><p>همراه با بقیه اطلاعاتت در فایل پشتیبان ذخیره می‌شود.</p></header>
      <div className="gx-history-filters" aria-label="فیلتر تاریخچه"><button className={filter==='all'?'active':''} onClick={()=>{setFilter('all');setLimit(10)}}>همه</button>{tools.map(tool=><button key={tool.id} className={filter===tool.id?'active':''} onClick={()=>{setFilter(tool.id);setLimit(10)}}>{tool.title}</button>)}</div>
      {!visible.length?<div className="gx-history-empty"><Sprout size={30}/><h3>{history.length?'هنوز تمرینی در این بخش نیست.':'اولین تجربه‌ات را ثبت کن.'}</h3><p>هر مکث کوچک، یک رد روشن در مسیر تو می‌گذارد.</p></div>:<div className="gx-history-list">{visible.slice(0,limit).map(entry=>{const tool=tools.find(t=>t.id===entry.kind) || tools[0];return <article className="gx-history-item" key={entry.id}><span className={`gx-tile-icon tone-${tool.tone}`}><tool.icon size={20}/></span><div className="gx-history-content"><div className="gx-history-title"><h3>{tool.title}</h3><time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString('fa-IR',{month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'})}</time></div>{entry.kind==='reframe'?<div className="gx-history-change"><div className="gx-old"><small>نگاه قبلی</small><p>{entry.before}</p></div><ArrowLeft size={18}/><div className="gx-new"><small>نگاه تازه</small><p>{entry.after}</p></div></div>:entry.kind==='shadow'?<div className="gx-history-change"><div className="gx-old"><small>محرک بیرونی</small><p>{entry.before}</p></div><ArrowLeft size={18}/><div className="gx-new"><small>ریشه و پذیرش درون</small><p>{entry.after}</p></div></div>:entry.kind==='release'?<p className="gx-history-text">{entry.before?`با این فکر فاصله گرفتم: «${entry.before}»`:'یک فکر را نمادین رها کردم؛ متن آن نگهداری نشده است.'}</p>:entry.kind==='surrender'?<p className="gx-history-text">دغدغه سپرده شده: «{entry.before}» {entry.note ? `[${entry.note}]` : ''}</p>:<p className="gx-history-text">{entry.after}</p>}{entry.note&&entry.kind!=='shadow'&&entry.kind!=='surrender'&&<p className="gx-history-text">{entry.note}</p>}{entry.kind==='reframe'&&<button className="g-text-btn" disabled={busy} onClick={()=>{setSeed(entry);setSelected('reframe');workbench.current?.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'})}}><RotateCcw size={14}/>دوباره به این باور نگاه کنم</button>}</div><button className="g-icon-btn danger" aria-label={`حذف ${tool.title} از تاریخچه`} disabled={busy} onClick={()=>void remove(entry.id)}><Trash2 size={16}/></button></article>})}</div>}
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

/* ─────────────────────────────────────────────────────────────
   NEW GADGET: 4-7-8 Deep Breathing (Dr. Andrew Weil Method)
   ───────────────────────────────────────────────────────────── */
function Breathing478({save, haptics}:{save:Save; haptics:boolean}){
  const [phase, setPhase] = useState<'idle' | 'inhale' | 'hold' | 'exhale'>('idle');
  const [cycle, setCycle] = useState(1);
  const [totalCycles, setTotalCycles] = useState(4);
  const [count, setCount] = useState(4);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [id, setId] = useState(uid);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const cycleRef = useRef(cycle);
  cycleRef.current = cycle;
  const totalRef = useRef(totalCycles);
  totalRef.current = totalCycles;

  const vibrate = useCallback((p: number | number[]) => {
    try {
      if (haptics && typeof navigator.vibrate === 'function') navigator.vibrate(p);
    } catch {}
  }, [haptics]);

  useEffect(() => {
    if (!running) return;
    let timer: any;

    const tick = () => {
      setCount(prev => {
        if (prev > 1) {
          return prev - 1;
        }

        // Transition to next phase
        const curPhase = phaseRef.current;
        if (curPhase === 'inhale') {
          setPhase('hold');
          vibrate([40, 60]);
          return 7;
        } else if (curPhase === 'hold') {
          setPhase('exhale');
          vibrate([70, 90]);
          return 8;
        } else if (curPhase === 'exhale') {
          if (cycleRef.current >= totalRef.current) {
            setRunning(false);
            setCompleted(true);
            setPhase('idle');
            vibrate([100, 100, 150]);
            return 0;
          } else {
            setCycle(c => c + 1);
            setPhase('inhale');
            vibrate([40, 50]);
            return 4;
          }
        }
        return 4;
      });
    };

    timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [running, vibrate]);

  function start() {
    setRunning(true);
    setCompleted(false);
    setSaved(false);
    setCycle(1);
    setPhase('inhale');
    setCount(4);
    vibrate([40, 50]);
  }

  function stop() {
    setRunning(false);
    setPhase('idle');
    setCount(4);
    setCycle(1);
  }

  async function store() {
    if (saved || saving) return;
    setSaving(true);
    try {
      const ok = await save(newRecord('breathe478', id, {
        after: `${n(totalCycles)} چرخه تنفس آرامش‌بخش ۴-۷-۸ برای تنظیم سیستم عصبی`,
        seconds: totalCycles * 19
      }));
      setSaved(ok);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="gx-grid-two">
      <div>
        <h3>تکنیک تنفس آرام‌بخش ۴-۷-۸</h3>
        <p className="gx-help">
          این متد علمی با کاهش ضربان قلب و تحریک عصب واگ، در کمتر از دو دقیقه اضطراب شدید را مهار و ذهن را برای خواب یا تمرکز آماده می‌کند.
        </p>
        <div className="gx-timer-options">
          {[4, 8].map(num => (
            <button
              key={num}
              type="button"
              className={`g-btn ${totalCycles === num ? 'primary' : ''}`}
              disabled={running || saving}
              onClick={() => { setTotalCycles(num); stop(); }}
            >
              {n(num)} چرخه ({n(Math.round(num * 19 / 60))} دقیقه)
            </button>
          ))}
        </div>
        <div className="gx-actions">
          {completed ? (
            <>
              <button type="button" className="g-btn primary" disabled={saving || saved} onClick={() => void store()}>
                <Check size={16}/> {saved ? 'در تاریخچه ثبت شد' : saving ? 'در حال ثبت…' : 'ثبت این تمرین آرامش'}
              </button>
              <button type="button" className="g-btn" onClick={() => { setCompleted(false); setId(uid()); start(); }}>
                <RotateCcw size={16}/> انجام دوباره
              </button>
            </>
          ) : running ? (
            <button type="button" className="g-btn danger" onClick={stop}>
              <Pause size={16}/> توقف تمرین
            </button>
          ) : (
            <button type="button" className="g-btn primary" onClick={start}>
              <Play size={16}/> شروع تنفس ۴-۷-۸
            </button>
          )}
        </div>
        <p className="gx-help">
          الگو: ۴ ثانیه دم آرام از بینی · ۷ ثانیه حبس آرام هوا · ۸ ثانیه بازدم کامل و عمیق با صدای ملایم از دهان.
        </p>
      </div>

      <div className="gx-stage gx-breathe478-stage">
        <div className={`gx-breathe478-orb is-${phase}`}>
          <Wind size={36} className="gx-breathe-icon" />
          <strong className="gx-breathe-state">
            {phase === 'inhale' ? 'دم عمیق از بینی' : phase === 'hold' ? 'حبس آرام هوا' : phase === 'exhale' ? 'بازدم کامل از دهان' : completed ? 'احسنت! آرامش برقرار شد' : 'آماده برای تنفس'}
          </strong>
          <span className="gx-breathe-timer-count">{running ? n(count) : '۴-۷-۸'}</span>
          {running && <small className="gx-breathe-cycle-badge">چرخه {n(cycle)} از {n(totalCycles)}</small>}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   NEW GADGET: Abundance & Brainwave Tuner (Web Audio API)
   ───────────────────────────────────────────────────────────── */
const FREQS = [
  {id: '432', hz: 432, subHz: 216, name: '۴۳۲ هرتز · هارمونی زمین', tag: 'آرامش عمیق', desc: 'بسامد هماهنگی با طبیعت، کاهش ضربان قلب و تسکین تنش‌های کهنه.'},
  {id: '528', hz: 528, subHz: 264, name: '۵۲۸ هرتز · تحول و انرژی', tag: 'گشایش قلب', desc: 'معروف به فرکانس معجزه و عشق؛ افزایش سرزندگی و رهایی از استرس.'},
  {id: 'alpha', hz: 210, beatHz: 10, isBinaural: true, name: '۱۰ هرتز (Binaural Alpha)', tag: 'تمرکز و یادگیری', desc: 'امواج مغزی آلفا برای تمرکز هوشیارانه، خلاقیت و ورود به فلو استیت.'},
  {id: 'theta', hz: 194, beatHz: 6, isBinaural: true, name: '۶ هرتز (Binaural Theta)', tag: 'مراقبه و رهایی', desc: 'امواج آرام‌بخش تتا برای رهایی از قفل‌های ذهنی و استراحت عمیق مغز.'},
  {id: 'om', hz: 136.1, harmonics: [136.1, 272.2, 408.3], name: '۱۳۶.۱ هرتز · نوای کاسه تبتی (Om)', tag: 'سکون درون', desc: 'رزونانس زمین و مدیتیشن ریشه‌ای، مناسب بستن چشم‌ها و تنفس آگاهانه.'},
];

function FrequencyTuner({save}:{save:Save}){
  const [activeFreq, setActiveFreq] = useState(FREQS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [elapsed, setElapsed] = useState(0);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [id, setId] = useState(uid);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const oscsRef = useRef<OscillatorNode[]>([]);
  const timerRef = useRef<any>(null);

  const cleanupAudio = useCallback(() => {
    oscsRef.current.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    });
    oscsRef.current = [];
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const stopAudio = useCallback(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      try {
        const now = audioCtxRef.current.currentTime;
        gainNodeRef.current.gain.linearRampToValueAtTime(0.001, now + 0.3);
        setTimeout(() => cleanupAudio(), 350);
      } catch {
        cleanupAudio();
      }
    } else {
      cleanupAudio();
    }
    setIsPlaying(false);
  }, [cleanupAudio]);

  const startAudio = useCallback(async (freqData = activeFreq) => {
    cleanupAudio();
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtxClass();
      }
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }
      const ctx = audioCtxRef.current;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.5);
      masterGain.connect(ctx.destination);
      gainNodeRef.current = masterGain;

      const newOscs: OscillatorNode[] = [];

      if (freqData.isBinaural) {
        // Binaural beat: Left carrier, Right carrier + beat
        const leftOsc = ctx.createOscillator();
        const rightOsc = ctx.createOscillator();
        leftOsc.type = 'sine';
        rightOsc.type = 'sine';
        leftOsc.frequency.setValueAtTime(freqData.hz, ctx.currentTime);
        rightOsc.frequency.setValueAtTime(freqData.hz + (freqData.beatHz || 10), ctx.currentTime);

        const merger = ctx.createChannelMerger(2);
        leftOsc.connect(merger, 0, 0);
        rightOsc.connect(merger, 0, 1);
        merger.connect(masterGain);

        leftOsc.start();
        rightOsc.start();
        newOscs.push(leftOsc, rightOsc);
      } else if (freqData.harmonics) {
        // Harmonics overtone series
        freqData.harmonics.forEach((hHz, idx) => {
          const osc = ctx.createOscillator();
          const subGain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(hHz, ctx.currentTime);
          const weight = idx === 0 ? 0.7 : idx === 1 ? 0.25 : 0.12;
          subGain.gain.setValueAtTime(weight, ctx.currentTime);
          osc.connect(subGain);
          subGain.connect(masterGain);
          osc.start();
          newOscs.push(osc);
        });
      } else {
        // Pure tone + soft octave
        const mainOsc = ctx.createOscillator();
        mainOsc.type = 'sine';
        mainOsc.frequency.setValueAtTime(freqData.hz, ctx.currentTime);
        mainOsc.connect(masterGain);
        mainOsc.start();
        newOscs.push(mainOsc);

        if (freqData.subHz) {
          const subOsc = ctx.createOscillator();
          const subGain = ctx.createGain();
          subOsc.type = 'sine';
          subOsc.frequency.setValueAtTime(freqData.subHz, ctx.currentTime);
          subGain.gain.setValueAtTime(0.2, ctx.currentTime);
          subOsc.connect(subGain);
          subGain.connect(masterGain);
          subOsc.start();
          newOscs.push(subOsc);
        }
      }

      oscsRef.current = newOscs;
      setIsPlaying(true);

      timerRef.current = setInterval(() => {
        setElapsed(e => e + 1);
      }, 1000);
    } catch (e) {
      console.error('Web Audio error:', e);
    }
  }, [activeFreq, cleanupAudio, volume]);

  useEffect(() => {
    return () => {
      cleanupAudio();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        try { audioCtxRef.current.close(); } catch {}
      }
    };
  }, [cleanupAudio]);

  function handleVolumeChange(val: number) {
    setVolume(val);
    if (gainNodeRef.current && audioCtxRef.current && isPlaying) {
      gainNodeRef.current.gain.linearRampToValueAtTime(val, audioCtxRef.current.currentTime + 0.1);
    }
  }

  function handleSelectFreq(f: typeof FREQS[0]) {
    setActiveFreq(f);
    if (isPlaying) {
      void startAudio(f);
    }
  }

  async function store() {
    if (saved || saving || elapsed < 5) return;
    setSaving(true);
    try {
      const ok = await save(newRecord('frequency', id, {
        after: `شنیدن فرکانس ${activeFreq.name} به مدت ${n(Math.round(elapsed / 60) || 1)} دقیقه`,
        seconds: elapsed
      }));
      setSaved(ok);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="gx-grid-two">
      <div>
        <h3>مولد ارتعاش و فرکانس‌های درونی</h3>
        <p className="gx-help">
          صوت‌های سینوسی خالص بدون نیاز به اینترنت و مستقیماً توسط پردازنده صوتی مرورگر ساخته می‌شوند. برای اثرگذاری بهتر از هندزفری استفاده کنید.
        </p>

        <div className="gx-freq-list">
          {FREQS.map(f => (
            <button
              key={f.id}
              type="button"
              className={`gx-freq-card ${activeFreq.id === f.id ? 'is-active' : ''}`}
              onClick={() => handleSelectFreq(f)}
            >
              <div className="gx-freq-head">
                <strong>{f.name}</strong>
                <span className="g-tag">{f.tag}</span>
              </div>
              <p>{f.desc}</p>
            </button>
          ))}
        </div>

        <div className="gx-freq-controls">
          <div className="gx-volume-slider">
            <Volume2 size={18}/>
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.05"
              value={volume}
              onChange={e => handleVolumeChange(parseFloat(e.target.value))}
              aria-label="بلندی صدا"
            />
          </div>

          <div className="gx-actions">
            {isPlaying ? (
              <button type="button" className="g-btn danger" onClick={stopAudio}>
                <Pause size={17}/> توقف پخش
              </button>
            ) : (
              <button type="button" className="g-btn primary" onClick={() => void startAudio()}>
                <Play size={17}/> شروع پخش فرکانس
              </button>
            )}

            {elapsed >= 10 && (
              <button type="button" className="g-btn" disabled={saving || saved} onClick={() => void store()}>
                <Check size={16}/> {saved ? 'ثبت شد' : saving ? 'در حال ثبت…' : 'ثبت در تاریخچه'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="gx-stage gx-freq-stage">
        <div className={`gx-freq-visualizer ${isPlaying ? 'is-playing' : ''}`}>
          <div className="gx-freq-ring r1" />
          <div className="gx-freq-ring r2" />
          <div className="gx-freq-ring r3" />
          <div className="gx-freq-center">
            <Radio size={36} className="gx-freq-center-icon" />
            <strong>{activeFreq.name.split('·')[0]}</strong>
            <small>{isPlaying ? `${n(Math.floor(elapsed / 60))}:${n(elapsed % 60).padStart(2, '۰')}` : 'در حال سکوت'}</small>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   NEW GADGET: Shadow Work Mirror (Carl Jung Self-Integration)
   ───────────────────────────────────────────────────────────── */
function ShadowWork({save, seed}:{save:Save; seed:GadgetRecord|null}){
  const [trigger, setTrigger] = useState(seed?.before || '');
  const [reflection, setReflection] = useState(seed?.after || '');
  const [integration, setIntegration] = useState(seed?.note || '');
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [id, setId] = useState(uid);
  const [error, setError] = useState('');
  const pending = useRef(false);

  const presets = [
    'غرور و خودنمایی دیگران',
    'بی‌مسئولیتی و راحت‌طلبی',
    'قضاوت‌گری و عیب‌جویی',
    'تندخویی و پرخاشگری',
    'بی‌توجهی و نادیده گرفتن من',
    'حسادت یا پنهان‌کاری'
  ];

  async function store() {
    if (pending.current || saved) return;
    if (!trigger.trim() || !reflection.trim()) {
      setError('لطفاً رفتار محرک و ریشه درونی را بنویسید.');
      return;
    }
    pending.current = true;
    setSaving(true);
    setError('');
    try {
      const ok = await save(newRecord('shadow', id, {
        before: trigger.trim(),
        after: reflection.trim(),
        note: integration.trim() ? `مرز سالم و صلح درون: ${integration.trim()}` : 'پذیرش و یکپارچه‌سازی سایه با شفقت'
      }));
      setSaved(ok);
      if (!ok) setError('ثبت انجام نشد؛ اطلاعات در همین صفحه باقی مانده است.');
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  return (
    <div className="gx-grid-two">
      <div className="gx-shadow-flow">
        {step === 0 && (
          <div className="gx-shadow-step">
            <span className="gx-step-badge">مرحله ۱ از ۳ · مشاهده محرک بیرونی</span>
            <h3>چه رفتاری در دیگران تو را به شدت آزار می‌دهد یا خشمت را برمی‌انگیزد؟</h3>
            <p className="gx-help">
              طبق روان‌شناسی تحلیلی یونگ، آنچه در دیگری به شدت ما را می‌آزارد، یا بخشی سرکوب‌شده از روان خود ماست که به آن اجازه حضور نداده‌ایم، یا مرزی است که باید قاطعانه و بدون خشم برای خود وضع کنیم.
            </p>
            <div className="gx-pills-row">
              {presets.map(p => (
                <button
                  key={p}
                  type="button"
                  className={`gx-pill ${trigger.includes(p) ? 'is-active' : ''}`}
                  onClick={() => setTrigger(t => t ? `${t} - ${p}` : p)}
                >
                  {p}
                </button>
              ))}
            </div>
            <label className="g-field">
              توصیف رفتار محرک
              <textarea
                rows={3}
                maxLength={1200}
                value={trigger}
                placeholder="مثلاً: وقتی فردی در جمع با تکبر فقط از خودش تعریف می‌کند و به دیگران اهمیت نمی‌دهد..."
                onChange={e => setTrigger(e.target.value)}
              />
            </label>
            <div className="gx-actions">
              <button
                type="button"
                className="g-btn primary"
                disabled={!trigger.trim()}
                onClick={() => setStep(1)}
              >
                مرحله بعد: چرخش آینه به درون <ArrowLeft size={16}/>
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="gx-shadow-step">
            <span className="gx-step-badge">مرحله ۲ از ۳ · ریشه و سایه پنهان</span>
            <h3>اگر این رفتار یک آینه باشد، چه پیامی برای نیازهای پنهان تو دارد؟</h3>
            <p className="gx-help">
              از خودت بپرس: «آیا من به خودم اجازه دیده‌شدن، استراحت، یا بیان شفاف نیازهایم را نمی‌دهم و چون خودم را در قفس گذاشته‌ام، از رهایی دیگری عصبانی می‌شوم؟»
            </p>
            <label className="g-field">
              کشف ریشه درونی
              <textarea
                rows={4}
                maxLength={1200}
                value={reflection}
                placeholder="مثلاً: متوجه شدم من همیشه سعی کرده‌ام متواضعِ بیش از حد باشم و از دیده‌شدن ترسیده‌ام. خشم من به خاطر نیازی است که در خودم سرکوب کرده‌ام..."
                onChange={e => setReflection(e.target.value)}
              />
            </label>
            <div className="gx-actions">
              <button
                type="button"
                className="g-btn primary"
                disabled={!reflection.trim()}
                onClick={() => setStep(2)}
              >
                مرحله بعد: شفقت و صلح درون <ArrowLeft size={16}/>
              </button>
              <button type="button" className="g-text-btn" onClick={() => setStep(0)}>بازگشت به مرحله قبل</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="gx-shadow-step">
            <span className="gx-step-badge">مرحله ۳ از ۳ · یکپارچه‌سازی و مرز سالم</span>
            <h3>چگونه با شفقت این بخش را در آغوش بگیری و مرز سالم بسازی؟</h3>
            <p className="gx-help">
              یک جمله صلح با خود و تصمیمی برای مراقبت از روانت بنویس.
            </p>
            <label className="g-field">
              پیام صلح و اقدام من
              <textarea
                rows={3}
                maxLength={1200}
                value={integration}
                placeholder="من حق دارم توانمندی‌هایم را با اعتماد به نفس ابراز کنم و به رفتارهای آسیب‌زننده دیگران واکنش هیجانی نشان ندهم."
                onChange={e => setIntegration(e.target.value)}
              />
            </label>
            <div className="gx-actions">
              <button
                type="button"
                className="g-btn primary"
                disabled={saving || saved}
                onClick={() => void store()}
              >
                <Sparkles size={16}/>
                {saved ? 'در تاریخچه خودشناسی ثبت شد' : saving ? 'در حال ثبت…' : 'یکپارچه‌سازی و ثبت در تاریخچه'}
              </button>
              <button
                type="button"
                className="g-btn"
                onClick={() => { setStep(0); setTrigger(''); setReflection(''); setIntegration(''); setSaved(false); setId(uid()); }}
              >
                <RotateCcw size={16}/> تمرین جدید
              </button>
            </div>
          </div>
        )}
        {error && <p className="gx-inline-status" role="alert">{error}</p>}
      </div>

      <div className="gx-stage gx-shadow-stage">
        <div className={`gx-shadow-mirror ${step === 2 ? 'is-integrated' : step === 1 ? 'is-reflecting' : ''}`}>
          <div className="gx-mirror-frame">
            <Flame size={44} className="gx-mirror-icon" />
            <div className="gx-mirror-text">
              <strong>{step === 0 ? 'آینه سایه' : step === 1 ? 'انعکاس درون' : 'نور یکپارچگی'}</strong>
              <p>
                {step === 0
                  ? (trigger || 'محرک بیرونی، دریچه‌ای به شناخت ناخودآگاه است.')
                  : step === 1
                  ? (reflection || 'دیدن سایه، آغاز رهایی از خشم‌های ناخواسته است.')
                  : (integration || '«تاریکی تا زمانی که به آگاهی تبدیل نشود، بر زندگی تو حکومت خواهد کرد.» — کارل یونگ')}
              </p>
            </div>
          </div>
          {saved && <span className="g-tag"><Check size={14}/>ثبت شد</span>}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   NEW GADGET: Surrender Box (صندوق توکل و رهایی از کنترل)
   ───────────────────────────────────────────────────────────── */
function SurrenderBox({save, effects}:{save:Save; effects:boolean}){
  const [worry, setWorry] = useState('');
  const [category, setCategory] = useState('نتیجه و آینده');
  const [phase, setPhase] = useState<'idle' | 'surrendering' | 'locked'>('idle');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [id, setId] = useState(uid);
  const [error, setError] = useState('');

  const categories = ['نتیجه و آینده', 'قضاوت یا رفتار دیگران', 'رویدادهای گذشته', 'مسائل خارج از کنترل'];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!worry.trim() || phase !== 'idle') return;
    setPhase('surrendering');
    setSaving(true);
    setError('');

    setTimeout(async () => {
      try {
        const ok = await save(newRecord('surrender', id, {
          before: worry.trim(),
          after: 'دغدغه به صندوق توکل و جریان هستی سپرده شد.',
          note: `دسته: ${category}`
        }));
        setSaved(ok);
        setPhase('locked');
      } catch {
        setError('خطا در ثبت؛ دغدغه شما محفوظ است.');
        setPhase('idle');
      } finally {
        setSaving(false);
      }
    }, effects ? 1000 : 200);
  }

  return (
    <div className="gx-grid-two">
      <div>
        <h3>صندوق توکل و رهایی از وسواس کنترل</h3>
        <p className="gx-help">
          انرژی روانی خود را فقط صرف کارهایی کنید که در دایره کنترل شماست. نتیجه نهایی، رفتار دیگران و آینده را به صندوق امن توکل بسپارید و با خیالی آسوده ادامه دهید.
        </p>

        {phase === 'locked' ? (
          <div className="gx-surrender-done">
            <p className="gx-help">
              این دغدغه با آرامش به صندوق سپرده شد. لازم نیست بارها و بارها در ذهنت مرورش کنی.
            </p>
            <button
              type="button"
              className="g-btn"
              onClick={() => { setPhase('idle'); setWorry(''); setSaved(false); setId(uid()); }}
            >
              <RotateCcw size={16}/> سپردن دغدغه‌ای دیگر
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="gx-pills-row">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`gx-pill ${category === cat ? 'is-active' : ''}`}
                  onClick={() => setCategory(cat)}
                  disabled={phase !== 'idle'}
                >
                  {cat}
                </button>
              ))}
            </div>

            <label className="g-field">
              چه موضوع یا نتیجه‌ای را هرچه تلاش می‌کنی از اختیارت خارج است؟
              <textarea
                rows={4}
                required
                maxLength={1200}
                value={worry}
                disabled={phase !== 'idle'}
                placeholder="مثلاً: نتیجه آزمون، اینکه فلان شخص چه تصمیمی می‌گیرد، یا نگرانی از اتفاقات آینده..."
                onChange={e => setWorry(e.target.value)}
              />
            </label>

            <div className="gx-actions">
              <button
                type="submit"
                className="g-btn primary"
                disabled={!worry.trim() || saving || phase !== 'idle'}
              >
                <Archive size={17}/>
                {saving ? 'در حال بستن و سپردن صندوق…' : 'سپردن به صندوق توکل'}
              </button>
            </div>
            {error && <p className="gx-inline-status" role="alert">{error}</p>}
          </form>
        )}
      </div>

      <div className="gx-stage gx-surrender-stage">
        <div className={`gx-surrender-box is-${phase}`}>
          <div className="gx-box-lid">
            <Archive size={42} className="gx-box-icon" />
          </div>
          <div className="gx-box-body">
            {phase === 'locked' ? (
              <div className="gx-box-locked-msg">
                <Lock size={32} />
                <strong>در امن‌ترین دست‌ها</strong>
                <p>«من سهم تلاشم را انجام می‌دهم و بار نتیجه را با آرامش زمین می‌گذارم.»</p>
              </div>
            ) : (
              <div className="gx-box-open-msg">
                <span>{worry ? `«${worry.slice(0, 70)}${worry.length > 70 ? '…' : ''}»` : 'در صندوق باز است...'}</span>
              </div>
            )}
          </div>
          {saved && <span className="g-tag"><Check size={14}/>سپرده شد</span>}
        </div>
      </div>
    </div>
  );
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
  return <div className="gx-grid-two"><form onSubmit={submit}><p className="gx-help">لازم نیست روز خوبی بوده باشد. یک لحظه کوچک، یک همراهی یا چیزی که برایت ارزش داشت کافی است.</p>{['یک چیز کوچک که خوشحالم کرد','یک همراهی یا مهربانی','چیزی که در خودم ارزشمند می‌بینم'].map((label,i)=><label className="g-field" key={label}>{n(i+1)}. {label}<textarea required rows={2} maxLength={1200} value={items[i]} disabled={saved||saving} onChange={e=>setItems(values=>values.map((value,index)=>i===index?e.target.value:value))}/></label>)}<div className="gx-actions"><button className="g-btn primary" disabled={saving||saved||items.some(item=>!item.trim())}><Heart size={17}/>{saved?'کارت در تاریخچه ماند':saving?'در حال ثبت…':'نگهداری این سه لحظه'}</button>{saved&&<button className="g-btn" type="button" onClick={()=>{setItems(['','','']);setSaved(false);setId(uid());setError('')}}>یک کارت تازه</button>}</div>{error&&<p className="gx-inline-status" role="alert">{error}</p>}</form><div className="gx-stage gx-gratitude-stack">{items.map((item,i)=><div className="gx-gratitude-note" key={i}><span>{['✦','♡','☀'][i]}</span><p>{item||['یک اتفاق کوچک…','یک مهربانی…','یک توانایی در من…'][i]}</p></div>)}{saved&&<span className="g-tag"><Check size={14}/>ثبت شد</span>}</div></div>;
}

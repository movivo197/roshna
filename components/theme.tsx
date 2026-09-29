'use client';

import {createContext, useContext, useEffect, useState, type CSSProperties, type ReactNode} from 'react';
import {Check, Monitor, Moon, Sun} from 'lucide-react';

type Mode = 'light' | 'dark' | 'system';
type Accent = 'navy'|'forest'|'teal'|'cyan'|'blue'|'indigo'|'violet'|'purple'|'rose'|'red'|'orange'|'amber'|'graphite';
type Theme = {mode: Mode; resolved: 'light' | 'dark'; accent: Accent; setMode: (mode: Mode) => void; setAccent:(accent:Accent)=>void};
const ThemeContext = createContext<Theme>({mode:'system',resolved:'light',accent:'navy',setMode:()=>{},setAccent:()=>{}});
const choices = [
  {id:'light' as const,label:'روشن',description:'نور گرمِ یک شروع تازه',icon:Sun},
  {id:'dark' as const,label:'تاریک',description:'آرامشِ ساعت‌های شب',icon:Moon},
  {id:'system' as const,label:'خودکار',description:'هماهنگ با دستگاه تو',icon:Monitor},
];
const accentChoices:{id:Accent;label:string;color:string}[]=[
  {id:'navy',label:'سرمه‌ای شیک',color:'#1e3a8a'},
  {id:'forest',label:'سبز جنگلی',color:'#2d6a4f'},{id:'teal',label:'سبز آبی',color:'#0f766e'},
  {id:'cyan',label:'فیروزه‌ای',color:'#0891b2'},{id:'blue',label:'آبی',color:'#2563eb'},
  {id:'indigo',label:'نیلی',color:'#4f46e5'},{id:'violet',label:'بنفش روشن',color:'#7c3aed'},
  {id:'purple',label:'ارغوانی',color:'#9333ea'},{id:'rose',label:'رز',color:'#e11d48'},
  {id:'red',label:'قرمز',color:'#dc2626'},{id:'orange',label:'نارنجی',color:'#ea580c'},
  {id:'amber',label:'کهربایی',color:'#ca8a04'},{id:'graphite',label:'خاکستری',color:'#475569'},
];

function applyTheme(mode:Mode){
  const resolved = mode==='system' ? (matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light') : mode;
  document.documentElement.dataset.theme=resolved;
  document.documentElement.style.colorScheme=resolved;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',resolved==='dark'?'#070d18':'#f4f6fa');
  return resolved;
}

export function ThemeProvider({children}:{children:ReactNode}){
  const [mode,setSelected]=useState<Mode>('system');
  const [resolved,setResolved]=useState<'light'|'dark'>('light');
  const [accent,setSelectedAccent]=useState<Accent>('navy');
  useEffect(()=>{
    const media=matchMedia('(prefers-color-scheme: dark)');
    const accents=accentChoices.map(item=>item.id);
    const refresh=()=>{let value:Mode='system',accentValue:Accent='navy';try{const saved=localStorage.getItem('roshana-theme');if(saved==='dark'||saved==='light'||saved==='system')value=saved;const savedAccent=localStorage.getItem('roshana-accent') as Accent|null;if(savedAccent&&accents.includes(savedAccent))accentValue=savedAccent}catch{}setSelected(value);setSelectedAccent(accentValue);document.documentElement.dataset.accent=accentValue;setResolved(applyTheme(value));};
    const storage=(event:StorageEvent)=>{if(event.key==='roshana-theme'||event.key==='roshana-accent'||event.key===null)refresh()};
    refresh();media.addEventListener('change',refresh);window.addEventListener('storage',storage);
    return()=>{media.removeEventListener('change',refresh);window.removeEventListener('storage',storage)};
  },[]);
  function setMode(value:Mode){
    setSelected(value);setResolved(applyTheme(value));
    try{localStorage.setItem('roshana-theme',value)}catch{/* Appearance remains usable without storage. */}
  }
  function setAccent(value:Accent){setSelectedAccent(value);document.documentElement.dataset.accent=value;try{localStorage.setItem('roshana-accent',value)}catch{/* Color stays active for this session. */}}
  return <ThemeContext.Provider value={{mode,resolved,accent,setMode,setAccent}}>{children}</ThemeContext.Provider>;
}

export const useTheme=()=>useContext(ThemeContext);

export function ThemePicker({compact=false}:{compact?:boolean}){
  const {mode,accent,setMode,setAccent}=useTheme();
  return <div className={compact?'gp-theme-compact':'gp-appearance'}>
    {!compact&&<div className="gp-appearance-heading"><span className="g-eyebrow">رنگِ حالِ تو</span><h3>روشنا را به سلیقه خودت ببین.</h3><p>روشن، تاریک یا هماهنگ با دستگاه؛ در اپ و پنل مدیریت.</p></div>}
    <div className="gp-theme-options" role="group" aria-label="انتخاب تم برنامه">{choices.map(choice=>{
      const label=choice.id==='dark'?'تاریک':choice.label;
      return <button key={choice.id} type="button" className={`gp-theme-choice ${mode===choice.id?'selected':''}`} onClick={()=>setMode(choice.id)} aria-pressed={mode===choice.id} aria-label={`تم ${label}`} title={`تم ${label}`}>
        {!compact&&<span className={`gp-theme-preview preview-${choice.id}`} aria-hidden="true"><i/><span><b/><em/><em/></span></span>}
        <span className="gp-theme-label"><choice.icon size={compact?16:18}/><strong>{label}</strong>{!compact&&mode===choice.id&&<Check size={14}/>}</span>
        {!compact&&<small>{choice.description}</small>}
      </button>;
    })}</div>
    {!compact&&<div className="gp-accent-section"><div><strong>رنگ اصلی برنامه</strong><small>رنگی را انتخاب کن که بیشتر با حال‌وهوایت هماهنگ است.</small></div><div className="gp-accent-grid" role="group" aria-label="انتخاب رنگ اصلی">{accentChoices.map(item=><button key={item.id} type="button" className={`gp-accent-choice${accent===item.id?' selected':''}`} onClick={()=>setAccent(item.id)} aria-pressed={accent===item.id} aria-label={item.label} title={item.label} style={{'--swatch':item.color} as CSSProperties}><span/><small>{item.label}</small>{accent===item.id&&<Check size={13}/>}</button>)}</div></div>}
  </div>;
}

'use client';
import {ArrowLeft, BookOpen, Sparkles, Target} from 'lucide-react';
export function DashboardShortcuts({go}:{go:(tab:'goals'|'journal'|'gadgets')=>void}){
  return <div className="gp-shortcuts" aria-label="یک شروع کوچک">
    <button onClick={()=>go('goals')}><span className="gp-shortcut-icon olive"><Target size={20}/></span><span><strong>یک مقصد روشن</strong><small>هدف بعدی‌ات را پیدا کن</small></span><ArrowLeft size={16}/></button>
    <button onClick={()=>go('journal')}><span className="gp-shortcut-icon sand"><BookOpen size={20}/></span><span><strong>چند خط برای خودت</strong><small>به فکرهایت فرصت بده</small></span><ArrowLeft size={16}/></button>
    <button onClick={()=>go('gadgets')}><span className="gp-shortcut-icon violet"><Sparkles size={20}/></span><span><strong>یک تجربه تازه</strong><small>گجت‌های ذهن، جسم و آرامش</small></span><ArrowLeft size={16}/></button>
  </div>;
}

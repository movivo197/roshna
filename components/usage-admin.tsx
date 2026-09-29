'use client';
import {useEffect,useState} from 'react';
import {BarChart3,RefreshCw} from 'lucide-react';
import {destinations} from '@/lib/product';

export default function UsageAdmin(){
  const [rows,setRows]=useState<{day:string;section:string;count:number}[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(true),[refresh,setRefresh]=useState(0);
  useEffect(()=>{const controller=new AbortController();setBusy(true);fetch('/api/analytics',{cache:'no-store',signal:controller.signal}).then(async res=>{if(!res.ok)throw Error('دریافت آمار ممکن نشد.');const data=await res.json();setRows(data.rows);setError('')}).catch(error=>{if(!controller.signal.aborted)setError(error.message)}).finally(()=>{if(!controller.signal.aborted)setBusy(false)});return()=>controller.abort()},[refresh]);
  const counts=destinations.map(item=>({...item,count:rows.filter(row=>row.section===item.id).reduce((sum,row)=>sum+row.count,0)})).sort((a,b)=>b.count-a.count),max=Math.max(1,...counts.map(item=>item.count));
  return <section className="admin-card"><div className="admin-card-heading"><h2><BarChart3 size={21}/> استفاده از بخش‌ها؛ ۳۰ روز اخیر</h2><button className="admin-text-button" disabled={busy} onClick={()=>setRefresh(value=>value+1)}><RefreshCw size={16}/>به‌روزرسانی</button></div><p className="admin-muted">فقط بازدید کاربرانی که در تنظیمات رضایت داده‌اند شمرده می‌شود. این آمار تعداد کاربران یکتا نیست و با جلوگیری از ردیابی ارسال نمی‌شود.</p>{error&&<p role="alert" className="admin-status admin-status-error">{error}</p>}{busy?<p role="status">در حال دریافت آمار…</p>:!rows.length?<div className="sx-empty"><BarChart3 size={32}/><h3>هنوز آماری ثبت نشده است.</h3><p>پس از اولین بازدید همراه با رضایت کاربر، داده واقعی اینجا نمایش داده می‌شود.</p></div>:<div className="sx-usage-bars">{counts.map(item=><div key={item.id}><span>{item.label}</span><div><i style={{width:`${item.count/max*100}%`}}/></div><b>{item.count.toLocaleString('fa-IR')}</b></div>)}</div>}<p className="admin-muted">بدون ذخیره شناسه دستگاه، متن جستجو، گفتگو یا یادداشت. داده‌های شمارشی پس از ۹۰ روز پاک می‌شوند.</p></section>;
}

'use client';

import type {ReactNode} from 'react';
import type {GrowthData} from '@/lib/growth-data';
import type {Destination} from '@/lib/product';
import {ArrowLeft, Sparkles} from 'lucide-react';
export type LifeProps={data:GrowthData;update:(fn:(d:GrowthData)=>GrowthData)=>Promise<boolean>;go:(tab:Destination)=>void;notify:(text:string)=>void;today:string};
export function Title({eyebrow,title,description,action}:{eyebrow:string;title:string;description:string;action?:ReactNode}){
  return <header className="l33-heading"><div><span className="l33-eyebrow"><Sparkles size={14}/>{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</header>;
}
export function Empty({title,text,children}:{title:string;text:string;children?:ReactNode}){return <div className="l33-empty"><Sparkles size={25}/><h3>{title}</h3><p>{text}</p>{children}</div>}
export function LinkButton({children,onClick}:{children:ReactNode;onClick:()=>void}){return <button className="l33-link" onClick={onClick}>{children}<ArrowLeft size={16}/></button>}
export function Meter({value,label}:{value:number;label:string}){return <div className="l33-meter" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}><span style={{width:`${Math.min(100,Math.max(0,value))}%`}}/></div>}

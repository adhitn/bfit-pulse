import researched from '../data/bfit-hours-fall-2026.json' with {type:'json'};
import {CAMPUS_TIME_ZONE,parseSourceTime,UCLA_PAGE_URL} from './ucla-counts.ts';

export type HoursInterval={open:number;close:number};
export type DayHours={kind:'hours'|'closed'|'unknown';intervals:HoursInterval[];label:string;sourceText?:string};
export type HoursSchedule={year:number;season:string;validFrom:string;regularValidThrough:string;weekly:Record<string,HoursInterval[]>;overrides:Record<string,DayHours>;notes:string[];checkedAt:number;sourceUrl:string};
export type HoursResponse={schedule:HoursSchedule;source:'live'|'cached'|'researched';warning?:string;serverNow:number};
export type Availability={status:'open'|'closed'|'unknown';today:DayHours;date:string;openedAt:number|null;closesAt:number|null;nextOpening:number|null;reason:string};
export const HOURS_CACHE_MS=15*60_000;
const DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const pad=(n:number)=>String(n).padStart(2,'0');
export function shiftDate(date:string,days:number){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
function dayOfWeek(date:string){return new Date(date+'T12:00:00Z').getUTCDay();}
function dateKey(year:number,month:number,day:number){const key=`${year}-${pad(month)}-${pad(day)}`;return Number.isFinite(Date.parse(key+'T12:00:00Z'))&&new Date(key+'T12:00:00Z').toISOString().slice(0,10)===key?key:null;}
function minutes(text:string){const m=text.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);if(!m)return null;const h=+m[1],min=+(m[2]||0);return h>=1&&h<=12&&min<60?(h%12+(m[3].toUpperCase()==='PM'?12:0))*60+min:null;}
function interval(text:string):HoursInterval[]|null{const parts=text.split(/\s*[-–—]\s*/);if(parts.length!==2)return null;const open=minutes(parts[0]),end=minutes(parts[1]);if(open===null||end===null||open===end)return null;return [{open,close:end<=open?end+1440:end}];}
function reason(date:string,label:string){if(date==='2026-11-11')return 'Veterans Day';if(date==='2026-11-25')return 'Thanksgiving early closing';if(['2026-11-26','2026-11-27','2026-11-28'].includes(date))return 'Thanksgiving closure';return label;}
function unknown(label:string,sourceText?:string):DayHours{return {kind:'unknown',intervals:[],label,sourceText};}

export function parseHoursLines(lines:string[],checkedAt=Date.now()):HoursSchedule{
 const heading=lines.find(line=>/^Fall Hours Begin\s+\d{1,2}\/\d{1,2}$/i.test(line));
 if(!heading)throw new Error('The published schedule needs review for a new season or format.');
 const start=heading.match(/(\d{1,2})\/(\d{1,2})/)!;
 const validFrom=dateKey(researched.year,+start[1],+start[2]);if(!validFrom)throw new Error('Invalid schedule start');
 const weekly:Record<string,HoursInterval[]>={},overrides:Record<string,DayHours>={},notes:string[]=[];
 let special=false,weekdayMatches=0;
 const setOverride=(date:string,value:DayHours)=>{const previous=overrides[date];if(previous&&previous.kind!==value.kind){overrides[date]=unknown('Conflicting special hours — confirm with UCLA',`${previous.sourceText}; ${value.sourceText}`);}else overrides[date]=value;};
 for(const line of lines){
  if(/^Special Hours/i.test(line)){special=true;continue;}
  const split=line.match(/^(.*?):\s*(CLOSED|\d.*)$/i);if(!split)continue;
  const label=split[1].trim(),raw=split[2].trim(),hours=/^CLOSED$/i.test(raw)?[]:interval(raw);
  if(!special){
   const days=label.split(/\s*[-–]\s*/).map(name=>DAYS.findIndex(d=>d.toLowerCase()===name.toLowerCase()));
   if(days.some(d=>d<0)||days.length>2||hours===null)throw new Error('Unrecognized weekly hours');
   for(let i=days[0];i<=(days[1]??days[0]);i++)weekly[String(i)]=hours;
   continue;
  }
  let matches=Array.from(label.matchAll(/(\d{1,2})\/(\d{1,2})/g));
  let dates:string[]=[];
  if(/^Thanksgiving Day$/i.test(label)){
   let date=`${researched.year}-11-01`;while(dayOfWeek(date)!==4)date=shiftDate(date,1);dates=[shiftDate(date,21)];
  }else if(matches.length){
   const first=matches[0],last=matches.at(-1)!;
   const firstDate=dateKey(researched.year,+first[1],+first[2]);
   const lastDate=dateKey(researched.year+(+last[1]<+first[1]?1:0),+last[1],+last[2]);
   if(!firstDate||!lastDate)throw new Error('Invalid special-hours date');
   if(matches.length===2&&/[-–]/.test(label.slice(first.index!+first[0].length,last.index))){for(let date=firstDate;date<=lastDate&&dates.length<90;date=shiftDate(date,1))dates.push(date);}
   else dates=matches.map(m=>dateKey(researched.year,+m[1],+m[2])!).filter(Boolean);
   const namedDays=label.match(/^([A-Za-z]+)(?:\s*[-–]\s*([A-Za-z]+))?/);
   const namedFirst=namedDays?DAYS.findIndex(d=>d.toLowerCase()===namedDays[1].toLowerCase()):-1;
   const namedLast=namedDays?.[2]?DAYS.findIndex(d=>d.toLowerCase()===namedDays[2].toLowerCase()):namedFirst;
   if(namedFirst>=0&&(dayOfWeek(firstDate)!==namedFirst||dayOfWeek(lastDate)!==namedLast)){
    notes.push(`UCLA lists “${line}”, but the weekday and date do not match. Confirm those special hours with UCLA.`);
    // Keep a correctly dated closure already published for that date. Never silently
    // move the posted opening hours to another day; mark the nearby named day uncertain.
    if(!overrides[firstDate])overrides[firstDate]=unknown('Date mismatch in UCLA’s special hours',line);
    for(const offset of [1,-1,2,-2,3,-3]){const candidate=shiftDate(firstDate,offset);if(dayOfWeek(candidate)===namedFirst){if(overrides[candidate]?.kind!=='closed')overrides[candidate]=unknown('Special hours need confirmation with UCLA',line);break;}}
    continue;
   }
   if(namedFirst>=0)weekdayMatches++;
  }else{notes.push(`Special hours need manual review: ${line}`);continue;}
  for(const date of dates)setOverride(date,hours===null?unknown('Special hours need confirmation',line):{kind:hours.length?'hours':'closed',intervals:hours,label:reason(date,'Special hours'),sourceText:line});
 }
 if(Object.keys(weekly).length!==7||weekdayMatches<2)throw new Error('The hours cannot be confidently matched to the reviewed 2026 fall schedule.');
 return {year:researched.year,season:'Fall 2026',validFrom,regularValidThrough:researched.regularValidThrough,weekly,overrides,notes,checkedAt,sourceUrl:UCLA_PAGE_URL};
}
export function parseBfitHours(html:string,checkedAt=Date.now()):HoursSchedule{
 const section=html.match(/<h2\b[^>]*>\s*Hours\s*<\/h2>([\s\S]*?)(?=<h2\b|<div\b|Annual Overview|$)/i)?.[1];
 if(!section)throw new Error('Hours section unavailable');
 const lines=section.replace(/<br\s*\/?>|<\/p>/gi,'\n').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/[\u200B-\u200D\uFEFF]/g,'').split('\n').map(line=>line.replace(/\s+/g,' ').trim()).filter(Boolean);
 return parseHoursLines(lines,checkedAt);
}
export const RESEARCHED_HOURS=parseHoursLines(researched.lines,Date.parse(researched.reviewedAt));
export function dayHours(schedule:HoursSchedule,date:string):DayHours{
 if(schedule.overrides[date])return schedule.overrides[date];
 if(date<schedule.validFrom||date>schedule.regularValidThrough)return unknown('Hours for this date have not been confirmed');
 const hours=schedule.weekly[String(dayOfWeek(date))];
 return hours?{kind:hours.length?'hours':'closed',intervals:hours,label:schedule.season+' regular hours'}:unknown('Hours unavailable');
}
function localDate(now:number){const parts=new Intl.DateTimeFormat('en-US',{timeZone:CAMPUS_TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const get=(type:string)=>parts.find(p=>p.type===type)!.value;return `${get('year')}-${get('month')}-${get('day')}`;}
function atMinute(date:string,minute:number){const shifted=shiftDate(date,Math.floor(minute/1440));const m=minute%1440;return parseSourceTime(`${shifted}T${pad(Math.floor(m/60))}:${pad(m%60)}:00`);}
export function bfitAvailability(schedule:HoursSchedule,now=Date.now()):Availability{
 const date=localDate(now),today=dayHours(schedule,date);
 const base={today,date,openedAt:null,closesAt:null,nextOpening:null};
 if(today.kind==='unknown')return {...base,status:'unknown',reason:today.label};
 if(today.kind==='hours'){
  const yesterday=shiftDate(date,-1),previous=dayHours(schedule,yesterday);
  const intervals=[...today.intervals.map(i=>({start:atMinute(date,i.open),end:atMinute(date,i.close)})),...(previous.kind==='hours'?previous.intervals.filter(i=>i.close>1440).map(i=>({start:atMinute(yesterday,i.open),end:atMinute(yesterday,i.close)})):[])];
  const active=intervals.find(i=>i.start!==null&&i.end!==null&&now>=i.start&&now<i.end);
  if(active)return {...base,status:'open',openedAt:active.start,closesAt:active.end,reason:today.label};
 }
 let nextOpening:number|null=null;
 for(let offset=0;offset<15;offset++){
  const future=dayHours(schedule,shiftDate(date,offset));if(future.kind==='unknown')break;
  const candidates=future.intervals.map(i=>atMinute(shiftDate(date,offset),i.open)).filter((t):t is number=>t!==null&&t>now);
  if(candidates.length){nextOpening=Math.min(...candidates);break;}
 }
 return {...base,status:'closed',nextOpening,reason:today.kind==='closed'?today.label:'Outside published opening hours'};
}
export function clockTime(minute:number){const m=minute%1440,h=Math.floor(m/60);return `${h%12||12}${m%60?':'+pad(m%60):''} ${h>=12?'PM':'AM'}${minute>=1440&&m!==0?' next day':''}`;}
export function dayHoursText(day:DayHours){return day.kind==='unknown'?'Confirm with UCLA':day.kind==='closed'?'Closed':day.intervals.map(i=>`${clockTime(i.open)}–${i.close===1440?'midnight':clockTime(i.close)}`).join(', ');}

export function attendanceDisplayMode(availability:Availability|null,snapshot:{oldestUpdatedAt:number|null;allClosed:boolean}|null,now=Date.now()){
 if(!availability)return 'waiting-hours';
 if(availability.status==='closed')return 'closed';
 if(availability.status==='unknown')return 'unknown-hours';
 if(snapshot&&(snapshot.oldestUpdatedAt===null||snapshot.oldestUpdatedAt<(availability.openedAt??Infinity)))return 'awaiting-count';
 if(snapshot?.allClosed){if(snapshot.oldestUpdatedAt!==null&&now-snapshot.oldestUpdatedAt<=60*60_000&&snapshot.oldestUpdatedAt-now<=5*60_000)return 'feed-closed';return 'awaiting-count';}
 return 'counts';
}

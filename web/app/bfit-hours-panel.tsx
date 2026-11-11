'use client';
import {CalendarDays,ChevronDown,Clock3,ExternalLink,Moon} from 'lucide-react';
import {clockTime,dayHoursText,shiftDate,type Availability,type HoursSchedule} from '../lib/bfit-hours';
import {CAMPUS_TIME_ZONE,UCLA_PAGE_URL} from '../lib/ucla-counts';

const dayLabel=(date:string)=>new Intl.DateTimeFormat('en-US',{timeZone:'UTC',weekday:'short',month:'short',day:'numeric'}).format(new Date(date+'T12:00:00Z'));
const time=(epoch:number)=>new Intl.DateTimeFormat('en-US',{timeZone:CAMPUS_TIME_ZONE,hour:'numeric',minute:'2-digit'}).format(epoch);
function key(epoch:number){const parts=new Intl.DateTimeFormat('en-US',{timeZone:CAMPUS_TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(epoch);const get=(type:string)=>parts.find(p=>p.type===type)!.value;return `${get('year')}-${get('month')}-${get('day')}`;}
function nextOpening(availability:Availability){
 if(availability.nextOpening===null)return 'Confirm the next opening time with UCLA.';
 const date=key(availability.nextOpening),label=date===availability.date?'today':date===shiftDate(availability.date,1)?'tomorrow':dayLabel(date);
 return `Opens ${label} at ${time(availability.nextOpening)} Pacific.`;
}
export default function BfitHoursPanel({schedule,availability,warning,liveClosed=false}:{schedule:HoursSchedule;availability:Availability|null;warning?:string;liveClosed?:boolean}){
 const status=liveClosed?'closed':availability?.status??'checking';
 const regular=[{label:'Monday–Thursday',days:[1,2,3,4]},{label:'Friday',days:[5]},{label:'Saturday',days:[6]},{label:'Sunday',days:[0]}];
 const weekly=regular.flatMap(group=>group.days.every(d=>JSON.stringify(schedule.weekly[String(d)])===JSON.stringify(schedule.weekly[String(group.days[0])]))?[{label:group.label,intervals:schedule.weekly[String(group.days[0])]}]:group.days.map(d=>({label:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d],intervals:schedule.weekly[String(d)]})));
 const special=Object.entries(schedule.overrides).filter(([date])=>!availability||date>=availability.date).sort(([a],[b])=>a.localeCompare(b));
 return <section className={`bfit-hours ${status}`} aria-label="BFit opening hours">
  <div className="hours-current"><span className="hours-icon">{status==='closed'?<Moon size={25}/>:<Clock3 size={25}/>}</span><div><p className="eyebrow">{availability?dayLabel(availability.date).toUpperCase()+' · PACIFIC TIME':'OPENING HOURS · PACIFIC TIME'}</p><h3>{status==='checking'?'Checking BFit’s hours…':status==='closed'?'BFit is closed':status==='unknown'?'Hours need confirmation':'BFit is open'}</h3>
   {liveClosed?<><p>UCLA’s live feed marks all workout areas as closed.</p><b>Check UCLA’s page before heading over.</b></>:availability&&<>
    <p>{availability.today.kind==='closed'?availability.today.label:availability.today.kind==='unknown'?availability.today.label:`Today’s hours: ${dayHoursText(availability.today)} Pacific`}</p>
    <b>{status==='closed'?nextOpening(availability):status==='open'&&availability.closesAt?`Closes at ${time(availability.closesAt)} Pacific.`:'Check the official BFit page before visiting.'}</b>
   </>}
   {(status==='closed'||status==='unknown')&&<p className="hidden-counts-note">Past attendance numbers are hidden here so they don’t look like current activity.</p>}
  </div></div>
  <details className="hours-details"><summary><CalendarDays size={16}/>View regular & special hours<ChevronDown size={15}/></summary><div className="hours-details-grid"><div><h4>Regular {schedule.season} hours</h4><p className="hours-small">Special hours below take priority. All times are Pacific.</p><dl>{weekly.map(row=><div key={row.label}><dt>{row.label}</dt><dd>{row.intervals?.length?row.intervals.map(i=>`${clockTime(i.open)}–${i.close===1440?'midnight':clockTime(i.close)}`).join(', '):'Closed'}</dd></div>)}</dl><p className="hours-small">For dates after {dayLabel(schedule.regularValidThrough)}, check UCLA’s updated break or winter hours.</p></div><div><h4>Upcoming special hours</h4><dl>{special.length?special.slice(0,10).map(([date,day])=><div key={date}><dt>{dayLabel(date)}<small>{day.label}</small></dt><dd>{dayHoursText(day)}</dd></div>):<p className="hours-small">No additional special hours have been confirmed in this schedule.</p>}</dl></div></div>{schedule.notes.map(note=><p key={note} className="hours-source-note">{note}</p>)}{warning&&<p className="hours-source-note">{warning}</p>}<a href={UCLA_PAGE_URL} target="_blank" rel="noreferrer">Check UCLA’s official hours <ExternalLink size={13}/></a><p className="hours-small">Hours checked {new Intl.DateTimeFormat('en-US',{timeZone:CAMPUS_TIME_ZONE,month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(schedule.checkedAt)} Pacific. The count feed’s older open/closed flag does not override a scheduled closure.</p></details>
 </section>;
}

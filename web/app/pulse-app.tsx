'use client';

import {useEffect,useRef,useState,type FormEvent} from 'react';
import {Activity,ArrowRight,CalendarDays,Check,ChevronDown,ChevronRight,Clock3,ExternalLink,Info,LayoutDashboard,MapPin,Radio,ShieldCheck,Users,X} from 'lucide-react';
import UclaCounts from './ucla-counts';
import BfitHoursPanel from './bfit-hours-panel';
import {useBfitHours} from './use-bfit-hours';
import {LEVELS,type Report} from '../lib/pulse';
import {UCLA_PAGE_URL,UCLA_WIDGET_URL} from '../lib/ucla-counts';

const AREA_NAMES:Record<string,string>={overall:'Whole gym',cardio:'Cardio',machines:'Strength machines',weights:'Free weights'};
function timeAgo(time:number,now:number){const minutes=Math.max(0,Math.floor((now-time)/60000));return minutes===0?'Just now':`${minutes} min ago`;}

function VisitHours(){const hours=useBfitHours();return <div className="visit-hours"><BfitHoursPanel schedule={hours.schedule} availability={hours.availability} warning={hours.warning}/></div>;}

export default function PulseApp(){
 const [tab,setTab]=useState('dashboard');
 const [reports,setReports]=useState<Report[]>([]);
 const [authenticated,setAuthenticated]=useState(false);
 const [reportLoading,setReportLoading]=useState(false);
 const [reportError,setReportError]=useState('');
 const [reportOpen,setReportOpen]=useState(false);
 const [level,setLevel]=useState<number|null>(null);
 const [onSite,setOnSite]=useState(false);
 const [saving,setSaving]=useState(false);
 const [formError,setFormError]=useState('');
 const [toast,setToast]=useState('');
 const [now,setNow]=useState(0);
 const closeRef=useRef<HTMLButtonElement>(null);
 const openerRef=useRef<HTMLElement|null>(null);
 useEffect(()=>{setNow(Date.now());const timer=setInterval(()=>setNow(Date.now()),15000);return()=>clearInterval(timer);},[]);
 async function refreshReports(){
  setReportLoading(true);setReportError('');
  try{const response=await fetch('/api/pulse',{cache:'no-store'});const data=await response.json() as {reports:Report[];authenticated:boolean;error?:string};if(!response.ok)throw new Error(data.error);setReports(data.reports);setAuthenticated(data.authenticated);}
  catch(e){setReportError(e instanceof Error?e.message:'Observations could not be loaded.');}
  finally{setReportLoading(false);}
 }
 function openReport(){openerRef.current=document.activeElement as HTMLElement;setLevel(null);setOnSite(false);setFormError('');setReportOpen(true);refreshReports();}
 useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),5000);return()=>clearTimeout(timer);},[toast]);
 useEffect(()=>{
  if(!reportOpen)return;
  closeRef.current?.focus();const oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
  function key(e:KeyboardEvent){
   if(e.key==='Escape')setReportOpen(false);
   if(e.key==='Tab'){
    const items=Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"] button:not([disabled]),[role="dialog"] input,[role="dialog"] a[href]'));
    const first=items[0],last=items.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
    if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
   }
  }
  document.addEventListener('keydown',key);
  return()=>{document.body.style.overflow=oldOverflow;document.removeEventListener('keydown',key);openerRef.current?.focus();};
 },[reportOpen]);
 async function submit(e:FormEvent){
  e.preventDefault();if(level===null||!onSite)return;
  setSaving(true);setFormError('');
  try{
   const response=await fetch('/api/pulse',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({area:'overall',level,source:'student',onSite})});
   const result=await response.json() as {error?:string};if(!response.ok)throw new Error(result.error);
   await refreshReports();setNow(Date.now());setReportOpen(false);setToast('Thanks! Your observation was shared separately from UCLA’s counts.');
  }catch(e){setFormError(e instanceof Error?e.message:'Could not save your observation. Please try again.');}
  finally{setSaving(false);}
 }
 function navigate(value:string){setTab(value);window.scrollTo({top:0,behavior:'smooth'});}
 const recent=reports.filter(r=>r.createdAt<=now&&now-r.createdAt<1800000).sort((a,b)=>b.createdAt-a.createdAt);
 return <div className="app-shell dedicated-app">
  <a className="skip-link" href="#main">Skip to content</a>
  <aside className="sidebar">
   <a className="brand" href="#" onClick={e=>{e.preventDefault();navigate('dashboard');}}><span className="brand-icon"><Activity size={24}/></span><span>BFit<span className="brand-light"> Pulse</span><small>LESS WAIT. MORE WORKOUT.</small></span></a>
   <div className="campus-label"><span className="tiny-dot"/> MADE FOR THE HILL</div>
   <nav aria-label="Main navigation"><button className={tab==='dashboard'?'active':''} onClick={()=>navigate('dashboard')}><LayoutDashboard size={19}/> Live counts <ChevronRight size={15}/></button><button className={tab==='visit'?'active':''} onClick={()=>navigate('visit')}><CalendarDays size={19}/> Your visit</button><button className={tab==='source'?'active':''} onClick={()=>navigate('source')}><Info size={19}/> About the data</button></nav>
   <div className="sidebar-bottom"><span className="little-spark"><Activity size={21}/></span><h3>Straight from the source.</h3><p>The counts UCLA shares, in one easy place. We keep the source’s update times visible.</p><a className="text-action" href={UCLA_WIDGET_URL} target="_blank" rel="noreferrer">View UCLA-linked source <ExternalLink size={13}/></a></div>
   <p className="sidebar-footer">An independent student project.<br/>Not affiliated with UCLA.</p>
  </aside>
  <div className="workspace"><header className="topbar"><div className="mobile-brand"><Activity size={23}/> BFit Pulse</div><span className="breadcrumb">Your campus <ChevronRight size={13}/><b>Bruin Fitness Center</b></span><div className="top-actions"><span className="pilot-badge">INDEPENDENT STUDENT PROJECT</span><button className="avatar" aria-label="About the data" onClick={()=>navigate('source')}>B<span/></button></div></header>
   <main id="main">
    {tab==='dashboard'&&<>
     <div className="page-heading dedicated-heading"><div><p className="eyebrow">YOUR GYM. AT A GLANCE.</p><h1>Know before you go<span>.</span></h1><p>A dedicated home for UCLA’s latest BFit counts.</p></div><a className="location-pill" href={UCLA_PAGE_URL} target="_blank" rel="noreferrer"><MapPin size={15}/><span>Carnesale Commons<br/><b>Bruin Fitness Center</b></span><ExternalLink size={12}/></a></div>
     <UclaCounts/>
     <details className="optional-reports" onToggle={e=>{if(e.currentTarget.open)refreshReports();}}><summary><span className="optional-report-icon"><Radio size={18}/></span><div><h2>Seeing something different?</h2><p>Optional community observations · separate from the source counts</p></div><ChevronDown size={18}/></summary><div className="optional-report-body"><div className="optional-report-intro"><p>Share how the gym feels right now. Observations stay visible for 30 minutes and never change the UCLA-linked numbers above.</p><button className="button outline" onClick={openReport}>Share an observation <ArrowRight size={15}/></button></div>{reportLoading?<p className="fine-print" role="status">Loading observations…</p>:reportError?<p className="form-error" role="alert">{reportError}</p>:recent.length?<div className="optional-recent">{recent.slice(0,3).map(r=><div className="update-row" key={r.id}><span className="update-icon"><Users size={17}/></span><div><b>{AREA_NAMES[r.area]||'Gym'} feels {LEVELS[r.level].name.toLowerCase()}</b><span>Community observation</span></div><time>{timeAgo(r.createdAt,now)}</time></div>)}</div>:<p className="fine-print">No recent community observations. Current hours and any available counts are shown above.</p>}</div></details>
     <section className="plan-strip"><span className="plan-strip-icon"><Clock3 size={23}/></span><div><h3>Heading over?</h3><p>Check official hours and directions before you go.</p></div><button className="button outline" onClick={()=>navigate('visit')}>Plan your visit <ArrowRight size={16}/></button></section>
    </>}
    {tab==='visit'&&<>
     <div className="page-heading"><div><p className="eyebrow">MAKE ROOM FOR YOUR WORKOUT</p><h1>See you at BFit<span>.</span></h1><p>A few useful details before you head down the Hill.</p></div></div>
     <VisitHours/><div className="planning-grid"><section className="white-card visit-card"><span className="round-icon"><MapPin size={25}/></span><h2>Bruin Fitness Center</h2><p>Carnesale Commons, underneath Bruin Plate<br/>251 Charles E Young Dr. W<br/>Los Angeles, CA 90095</p><a className="button primary" href={UCLA_PAGE_URL} target="_blank" rel="noreferrer">Check official hours <ExternalLink size={15}/></a><a className="text-action" href="https://www.google.com/maps/search/?api=1&query=Bruin+Fitness+Center+UCLA" target="_blank" rel="noreferrer">Get directions <ArrowRight size={15}/></a><div className="soft-note"><Clock3 size={18}/><p>Hours can change for holidays and campus events. UCLA’s page has the current schedule and access policies.</p></div></section><section className="white-card"><p className="eyebrow">CHECK THE PULSE FIRST</p><h2>One quick look.<br/>A little less guesswork.</h2><p className="body-text">When BFit is open, the live view shows the five areas in UCLA’s public count widget. During published closures, it shows Closed and hides old attendance numbers. After reopening, it waits for a post-opening update.</p><div className="soft-note"><Info size={19}/><p>A reported count can change between updates. Refreshing this site does not mean UCLA has taken a new count.</p></div><button className="button primary return-counts" onClick={()=>navigate('dashboard')}>Back to live counts <ArrowRight size={16}/></button></section></div>
    </>}
    {tab==='source'&&<>
     <div className="page-heading"><div><p className="eyebrow">CLEAR NUMBERS. CLEAR SOURCES.</p><h1>Know what you’re seeing<span>.</span></h1><p>Where the counts come from, and how they stay up to date.</p></div></div>
     <div className="about-grid"><section className="white-card"><span className="round-icon"><Activity size={25}/></span><h2>The same source UCLA links.</h2><p className="body-text">UCLA Recreation’s BFit page links to a public Connect2 “Live Facility Counts” widget. BFit Pulse reads that widget’s public data feed and displays the BFit zone names, reported counts, listed capacities, and source timestamps.</p><a className="text-action" href={UCLA_WIDGET_URL} target="_blank" rel="noreferrer">Open the original count widget <ExternalLink size={14}/></a><a className="text-action source-page-link" href={UCLA_PAGE_URL} target="_blank" rel="noreferrer">UCLA Recreation’s BFit page <ExternalLink size={14}/></a></section><section className="white-card"><span className="round-icon"><Clock3 size={25}/></span><h2>Automatic checks, every 15 seconds.</h2><p className="body-text">The live view checks the feed every 15 seconds while this page is visible, and when you return to the tab. Updates appear without reloading. A short shared cache limits repeated requests; source changes normally appear within about 30 seconds of becoming available.</p><p className="body-text">Published regular hours and dated special closures take priority over attendance. We use campus Pacific time, hide attendance while closed, and wait for new counts after reopening. The time shown beside each zone is the source’s update time, not the time this page refreshed. The provider currently omits a time zone; BFit Pulse interprets its timestamps as Pacific time.</p></section><section className="white-card"><h2>Reported counts, with context.</h2><p className="body-text">Percentages are the reported count divided by the source’s listed zone capacity. The total sums open-zone reports; it is not a deduplicated turnstile total or a verified building occupancy limit. Closed zones are labeled and excluded from that total.</p><div className="soft-note"><Info size={19}/><p>If the source is unavailable, we show the last saved counts with a warning and their original timestamps. Older or uncertain source timestamps are flagged. We never replace a missing source count with a sample number.</p></div></section><section className="white-card"><h2>Self-reports are optional.</h2><p className="body-text">Community observations can add a little context, but they never change the UCLA-linked counts. Submissions require sign-in and an on-site confirmation; names are not shown. Reports expire from view after 30 minutes.</p><p className="body-text">BFit Pulse is an independent student project, not an official UCLA or Connect2 app. Campus affiliation, physical presence, and observations are not independently verified.</p><button className="text-action" onClick={openReport}>Share an observation <ArrowRight size={15}/></button></section></div>
    </>}
    <footer className="page-footer"><span><Activity size={15}/> BFit Pulse <span>· A little more room for you.</span></span><span>Independent student project · Not affiliated with UCLA or Connect2</span></footer>
   </main>
  </div>
  <nav className="mobile-nav" aria-label="Mobile navigation">{[{key:'dashboard',name:'Live counts',Icon:LayoutDashboard},{key:'visit',name:'Your visit',Icon:CalendarDays},{key:'source',name:'About the data',Icon:Info}].map(({key,name,Icon})=><button key={key} className={tab===key?'active':''} onClick={()=>navigate(key)}><Icon size={20}/><span>{name}</span></button>)}</nav>
  {toast&&<div className="toast" role="status"><Check size={18}/>{toast}</div>}
  {reportOpen&&<div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget&&!saving)setReportOpen(false);}}><section className="report-modal" role="dialog" aria-modal="true" aria-labelledby="report-title"><button ref={closeRef} className="modal-close icon-button" aria-label="Close report" onClick={()=>setReportOpen(false)}><X size={21}/></button><span className="round-icon"><Radio size={25}/></span><p className="eyebrow">OPTIONAL COMMUNITY OBSERVATION</p><h2 id="report-title">How’s BFit feeling?</h2><p>Your observation stays separate from UCLA-linked counts.</p><form onSubmit={submit}><fieldset><legend className="field-label">Choose a crowd level</legend><div className="level-grid">{LEVELS.map((l,i)=><button type="button" key={l.name} aria-pressed={level===i} className={`level-choice ${l.color} ${level===i?'selected':''}`} onClick={()=>setLevel(i)}><span>{['🌿','☀️','🔥','⚡'][i]}</span><b>{l.name}</b><small>{['Lots of open equipment','Some equipment in use','Waiting for equipment','Most equipment occupied'][i]}</small>{level===i&&<Check size={16}/>}</button>)}</div></fieldset><label className="checkbox-label"><input type="checkbox" checked={onSite} onChange={e=>setOnSite(e.target.checked)}/><span>I am at BFit and reporting what I can see right now.</span></label>{formError&&<p className="form-error" role="alert">{formError}</p>}{reportLoading?<button className="button primary submit-button" disabled>Checking sign-in…</button>:!authenticated?<a className="button primary submit-button" href="/signin-with-chatgpt?return_to=%2F" target="_top">Sign in to contribute <ArrowRight size={17}/></a>:<button className="button primary submit-button" type="submit" disabled={saving||level===null||!onSite}>{saving?'Sending…':'Share observation'}<ArrowRight size={17}/></button>}<p className="fine-print">Your name is never shown. Your observation is visible for 30 minutes.</p></form></section></div>}
 </div>;
}

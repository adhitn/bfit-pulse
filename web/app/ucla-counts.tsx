'use client';

import { useEffect, useRef, useState } from 'react';
import { Activity, ArrowUpRight, ChevronDown, Clock3, ExternalLink, Info, RotateCcw, Users } from 'lucide-react';
import { CAMPUS_TIME_ZONE, UCLA_PAGE_URL, UCLA_WIDGET_URL, countsAreStale, type OfficialResponse, type OfficialZone } from '../lib/ucla-counts';
import { fetchJsonWithTimeout, RequestTimeoutError } from '../lib/network';
import { useBfitHours } from './use-bfit-hours';
import BfitHoursPanel from './bfit-hours-panel';
import {attendanceDisplayMode} from '../lib/bfit-hours';

const sourceTime = (value: number | null) => value===null ? 'Update time unavailable' : new Intl.DateTimeFormat('en-US',{timeZone:CAMPUS_TIME_ZONE,month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(value);
const areaNames: Record<number,string> = {4006:'Cardio',4008:'Stretching',4009:'Free weights & squat racks',4010:'Cable & Synergy machines',4011:'Weight machines'};
const areaName = (zone:OfficialZone) => areaNames[zone.id] || zone.name;
function age(value:number|null,now:number){
  if(value===null)return '';
  const minutes=Math.floor((now-value)/60_000);
  if(minutes<0)return 'update time needs checking';
  if(minutes===0)return 'less than a minute ago';
  if(minutes<60)return `${minutes} min ago`;
  const hours=Math.floor(minutes/60),remaining=minutes%60;
  if(hours<24)return `${hours} ${hours===1?'hour':'hours'}${remaining?` ${remaining} min`:''} ago`;
  const days=Math.floor(hours/24);return `${days} ${days===1?'day':'days'} ago`;
}
export default function UclaCounts() {
  const hours=useBfitHours();
  const [data,setData] = useState<OfficialResponse>({snapshot:null,cached:false});
  const [loading,setLoading] = useState(true);
  const [now,setNow] = useState(Date.now());
  const inFlight=useRef(false);
  async function refresh() {
    if(inFlight.current)return;
    inFlight.current=true;
    setLoading(true);
    try {
      const response = await fetchJsonWithTimeout<OfficialResponse>('/api/ucla-counts',{cache:'no-store'});
      const result = response.data;
      if(!result || !Object.prototype.hasOwnProperty.call(result,'snapshot'))throw new Error('The count service returned an unexpected response. Please try again.');
      if (!response.ok && !result.snapshot) throw new Error(result.error || 'Counts are temporarily unavailable.');
      setData(result);
    } catch(e) {
      setData(previous=>({...previous,cached:!!previous.snapshot,error:e instanceof RequestTimeoutError?'This update took too long. We’ll try again automatically; you can also use Check again.':e instanceof Error?e.message:'Counts are temporarily unavailable.'}));
    } finally {inFlight.current=false;setNow(Date.now());setLoading(false);}
  }
  useEffect(()=>{
    if(hours.availability?.status!=='open')return;
    refresh();
    const checkVisible=()=>{if(document.visibilityState==='visible')refresh();};
    const timer=setInterval(checkVisible,15_000);
    document.addEventListener('visibilitychange',checkVisible);
    window.addEventListener('focus',checkVisible);
    return ()=>{clearInterval(timer);document.removeEventListener('visibilitychange',checkVisible);window.removeEventListener('focus',checkVisible);};
  },[hours.availability?.status,hours.availability?.openedAt]);
  const snapshot=data.snapshot;
  const stale=snapshot?countsAreStale(snapshot,now):false;
  const openAreas=snapshot?.zones.filter(zone=>!zone.isClosed).length??0;
  const availability=hours.availability;
  const mode=attendanceDisplayMode(availability,snapshot,hours.now);
  const beforeOpening=mode==='awaiting-count';
  const liveClosed=mode==='feed-closed';
  const showNumbers=mode==='counts';
  const closed=mode==='closed'||liveClosed;
  return <section className="official-panel clear-counts" aria-labelledby="official-title">
    <div className="official-heading"><div><p className="eyebrow">COUNTS SHARED ON UCLA’S BFIT WEBSITE</p><h2 id="official-title">How busy is BFit?</h2><p className="counts-intro">{closed?(liveClosed?"UCLA’s live feed marks BFit as closed.":"Closed according to UCLA’s published schedule."):"Opening hours first. Fresh attendance counts when BFit is open."}</p></div><span className={`official-source-badge ${stale||data.cached?'older':''}`}><span className="tiny-dot"/>{closed?'CLOSED':availability?.status==='unknown'?'CONFIRM HOURS':!availability?'CHECKING HOURS':snapshot?(data.cached?'LAST SAVED COUNTS':stale?'OLDER COUNT':'UCLA COUNT DATA'):'CHECKING COUNTS'}</span></div>
    <BfitHoursPanel schedule={hours.schedule} availability={availability} warning={hours.warning} liveClosed={liveClosed}/>
    {availability?.status==='open'&&beforeOpening&&<div className="waiting-for-count" role="status"><Clock3 size={24}/><h3>Open — waiting for a new attendance count</h3><p>The saved report is from before this opening period. We’ll show attendance once UCLA updates its counts for this opening period.</p></div>}
    {showNumbers&&(!snapshot ? <div className="official-empty" role="status"><Activity size={26}/><h3>{loading?'Getting the latest BFit counts…':'Counts are temporarily unavailable'}</h3><p>{loading?'Checking the same counts shown on UCLA’s website.':data.error}</p>{!loading&&<p>We’ll retry automatically. You can also check UCLA’s original counts below.</p>}</div> : <>
      <div className="attendance-summary">
        <div className="attendance-total"><p className="summary-label">TOTAL PEOPLE COUNTED</p><div className="people-total"><strong>{snapshot.allClosed?'—':snapshot.reportedCount}</strong><span>{snapshot.allClosed?'areas marked closed':'people'}</span></div><p className="attendance-areas">{snapshot.allClosed?'UCLA marks every workout area as closed.':`Across ${openAreas} open workout ${openAreas===1?'area':'areas'}`}</p><p className="attendance-explanation">{snapshot.allClosed?'Check UCLA’s page for opening hours.':'This adds up the latest count from each open area below.'}</p></div>
        <div className="attendance-capacity"><p className="summary-label">HOW FULL ARE THESE AREAS?</p><div className="capacity-percent"><strong>{snapshot.percent===null?'—':`${snapshot.percent}%`}</strong><span>{snapshot.allClosed?'all areas closed':'of capacity in use'}</span></div>{!snapshot.allClosed&&<><div className="overall-capacity-meter" role="img" aria-label={`${snapshot.reportedCount} people counted out of a total listed capacity of ${snapshot.capacity}`}><span style={{width:`${Math.min(100,snapshot.percent??0)}%`}}/></div><p><b>{snapshot.reportedCount} people counted</b> out of a total listed capacity of <b>{snapshot.capacity}</b>.</p></>}</div>
      </div>
      <div className="area-breakdown-heading"><h3>People in each area</h3><p>Each card shows the latest count UCLA has shared.</p></div>
      <div className="official-zones">{snapshot.zones.map(zone=><article className={`official-zone ${zone.isClosed?'is-closed':''}`} key={zone.id}>
        <div className="zone-name"><span className="zone-glyph"><Users size={18}/></span><h3 title={zone.name}>{areaName(zone)}</h3></div>
        <div className="clear-zone-count"><strong>{zone.isClosed?'Closed':zone.count}</strong>{!zone.isClosed&&<span>{zone.count===1?'person counted':'people counted'}</span>}</div>
        <p className="clear-zone-capacity">{zone.isClosed?'Marked closed by UCLA':<>Listed capacity: <b>{zone.capacity} people</b></>}</p>
        <div className="zone-meter" role="img" aria-label={zone.isClosed?'Area marked closed':`${zone.count} people counted out of ${zone.capacity}, ${zone.percent}% of capacity in use`}><span style={{width:`${zone.isClosed?0:Math.min(100,zone.percent)}%`}}/></div>
        <p className="zone-use">{zone.isClosed?'Excluded from the total above':<><b>{zone.percent}%</b> of capacity in use</>}</p>
        <div className="zone-updated"><span>UCLA last updated</span><time dateTime={zone.sourceTimestamp}>{sourceTime(zone.updatedAt)}</time></div>
      </article>)}</div>
      {(stale||data.cached)&&<div className="official-warning" role="status"><Info size={17}/><p>{data.cached?'We couldn’t get a new update. These are the last counts we saved; check their times before relying on them.':'Some counts are over an hour old, or their update time is unclear. The gym may be busier or quieter now.'}</p></div>}
      <div className="clear-refresh-info"><div><Clock3 size={17}/><div><span>How recent are the counts?</span><b>Oldest area update: {sourceTime(snapshot.oldestUpdatedAt)}</b>{snapshot.oldestUpdatedAt!==null&&<small>{age(snapshot.oldestUpdatedAt,now)} · each area’s time is shown above</small>}</div></div><div><RotateCcw size={16}/><div><span>Our site checks every 15 seconds</span><b>Last checked: {new Intl.DateTimeFormat('en-US',{timeZone:CAMPUS_TIME_ZONE,hour:'numeric',minute:'2-digit',second:'2-digit',timeZoneName:'short'}).format(now)}</b><small>A check only changes the numbers if UCLA has shared new counts.</small></div></div></div>
    </>)}
    <div className="official-links"><a href={UCLA_WIDGET_URL} target="_blank" rel="noreferrer">See the original UCLA-linked counts <ArrowUpRight size={15}/></a><a href={UCLA_PAGE_URL} target="_blank" rel="noreferrer">UCLA BFit page <ExternalLink size={13}/></a><button onClick={()=>{hours.refresh();if(availability?.status==='open')refresh();}} disabled={availability?.status==='open'?loading:hours.loading} aria-label="Refresh UCLA counts"><RotateCcw size={14}/>{(availability?.status==='open'?loading:hours.loading)?'Checking…':'Check again'}</button></div>
    {showNumbers&&snapshot&&<details className="count-explanation"><summary>What do “count” and “capacity” mean?<ChevronDown size={15}/></summary><div><p><b>Count</b> is the number of people UCLA’s feed reports for an area. <b>Capacity</b> is the maximum listed for that area in the same feed. For example, 21 people in an area with a listed capacity of 100 means 21% of capacity is in use.</p><p>The total adds the latest counts from all open areas. Areas may be counted at different times, so this is a recent attendance snapshot. It does not tell you how many machines or benches are available. Listed capacities are not a verified building safety limit.</p><p>Data comes from the Connect2 widget linked on UCLA Recreation’s BFit page. Times are shown in Pacific time; the feed does not specify its time zone, so we interpret it as campus time.</p><p className="original-area-names"><b>Names used by UCLA:</b> {snapshot.zones.map(zone=>`${areaName(zone)} (${zone.name})`).join(' · ')}</p></div></details>}
  </section>;
}

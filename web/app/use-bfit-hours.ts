'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {bfitAvailability,RESEARCHED_HOURS,type HoursResponse} from '../lib/bfit-hours';
import {fetchJsonWithTimeout} from '../lib/network';
export function useBfitHours(){
 const [data,setData]=useState<HoursResponse>({schedule:RESEARCHED_HOURS,source:'researched',serverNow:0});
 const [now,setNow]=useState(0);
 const [offset,setOffset]=useState(0);
 const [loading,setLoading]=useState(false);
 const refresh=useCallback(async()=>{
  setLoading(true);
  try{const result=await fetchJsonWithTimeout<HoursResponse>('/api/hours',{cache:'no-store'});if(!result.ok||!result.data.schedule)throw new Error('Hours unavailable');setData(result.data);setOffset(result.data.serverNow-Date.now());}
  catch{setData(previous=>({...previous,warning:'We could not refresh the hours. The last verified schedule is shown; confirm with UCLA before visiting.'}));}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{refresh();const check=()=>{if(document.visibilityState==='visible')refresh();};const timer=setInterval(check,5*60_000);window.addEventListener('focus',check);document.addEventListener('visibilitychange',check);return()=>{clearInterval(timer);window.removeEventListener('focus',check);document.removeEventListener('visibilitychange',check);};},[refresh]);
 useEffect(()=>{const tick=()=>setNow(Date.now()+offset);tick();const timer=setInterval(tick,1000);return()=>clearInterval(timer);},[offset]);
 const availability=useMemo(()=>now?bfitAvailability(data.schedule,now):null,[data.schedule,now]);
 return {...data,availability,now,loading,refresh};
}

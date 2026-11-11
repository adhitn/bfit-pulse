import {env} from 'cloudflare:workers';
import {HOURS_CACHE_MS,parseBfitHours,RESEARCHED_HOURS,type HoursSchedule,type HoursResponse} from '../../../lib/bfit-hours';
import {UCLA_PAGE_URL} from '../../../lib/ucla-counts';
import {withTimeout} from '../../../lib/network';

const respond=(schedule:HoursSchedule,source:HoursResponse['source'],warning?:string)=>Response.json({schedule,source,warning,serverNow:Date.now()} satisfies HoursResponse,{headers:{'Cache-Control':'no-store'}});
export async function GET(){
 let cached:HoursSchedule|null=null;
 try{if(env.DB){const row=await withTimeout(env.DB.prepare('SELECT payload FROM official_snapshots WHERE id = ?').bind('bfit-hours-v1').first<{payload:string}>(),1500);if(row)cached=JSON.parse(row.payload) as HoursSchedule;}}catch{}
 if(cached&&Date.now()-cached.checkedAt<HOURS_CACHE_MS)return respond(cached,'live');
 const controller=new AbortController();
 try{
  const operation=(async()=>{const result=await fetch(UCLA_PAGE_URL,{headers:{Accept:'text/html'},signal:controller.signal});if(!result.ok)throw new Error('Hours unavailable');const html=await result.text();if(html.length>2_000_000)throw new Error('Unexpected hours response');return parseBfitHours(html);})();
  const schedule=await withTimeout(operation,6000,()=>controller.abort());
  try{if(env.DB)await withTimeout(env.DB.prepare('INSERT INTO official_snapshots (id,payload,fetched_at) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,fetched_at=excluded.fetched_at').bind('bfit-hours-v1',JSON.stringify(schedule),schedule.checkedAt).run(),1500);}catch{}
  return respond(schedule,'live');
 }catch{return respond(cached??RESEARCHED_HOURS,cached?'cached':'researched','The hours page could not be refreshed or needs review. Using the last verified schedule within its date limits; confirm with UCLA before visiting.');}
}

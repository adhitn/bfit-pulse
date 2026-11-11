export const UCLA_PAGE_URL = 'https://recreation.ucla.edu/facilities/bfit';
// This is the public, browser-visible widget URL published by UCLA, not a private API credential.
export const UCLA_WIDGET_URL = 'https://www.connect2mycloud.com/Widgets/Data/locationCount?facility=803&key=73829a91-48cb-4b7b-bd0b-8cf4134c04cd&type=bar';
export const COUNTS_API_URL = 'https://goboardapi.azurewebsites.net/api/FacilityCount/GetCountsByAccount?AccountAPIKey=73829a91-48cb-4b7b-bd0b-8cf4134c04cd';
export const CACHE_MS = 15_000;
export const STALE_MS = 60 * 60_000;
export const CAMPUS_TIME_ZONE = 'America/Los_Angeles';

export type OfficialZone = {
  id: number; name: string; count: number; capacity: number; percent: number;
  isClosed: boolean; sourceTimestamp: string; updatedAt: number | null;
};
export type OfficialSnapshot = {
  zones: OfficialZone[]; reportedCount: number; capacity: number; percent: number | null;
  fetchedAt: number; oldestUpdatedAt: number | null; allClosed: boolean;
  assumedTimeZone: typeof CAMPUS_TIME_ZONE;
};
export type OfficialResponse = { snapshot: OfficialSnapshot | null; cached: boolean; error?: string };

// The provider currently omits its UTC offset. Interpret these wall times as campus
// Pacific time, including DST. Keep the original timestamp and disclose the assumption.
export function parseSourceTime(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(value)) {
    const timestamp = Date.parse(value); return Number.isFinite(timestamp) ? timestamp : null;
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(value)) return null;
  const wallTime = Date.parse(value + 'Z');
  if (!Number.isFinite(wallTime)) return null;
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone:CAMPUS_TIME_ZONE, timeZoneName:'shortOffset' });
  let result = wallTime;
  for (let i = 0; i < 2; i++) {
    const zone = formatter.formatToParts(result).find(p=>p.type==='timeZoneName')?.value;
    const match = zone?.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/);
    if (!match) return null;
    const offset = (Number(match[2])*60 + Number(match[3] || 0))*60_000*(match[1]==='-'?-1:1);
    result = wallTime - offset;
  }
  // Reject normalized invalid dates and nonexistent spring-transition wall times.
  const parts = new Intl.DateTimeFormat('en-CA',{timeZone:CAMPUS_TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(result);
  const get = (type:string)=>parts.find(p=>p.type===type)?.value;
  if (`${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}` !== value.slice(0,19)) return null;
  return result;
}

export function normalizeUclaCounts(data: unknown, fetchedAt = Date.now()): OfficialSnapshot {
  if (!Array.isArray(data)) throw new Error('Unexpected counts response');
  const ids = new Set<number>();
  const zones: OfficialZone[] = [];
  for (const entry of data) {
    if (!entry || typeof entry !== 'object' || entry.FacilityId !== 803) continue;
    const {LocationId:id,LocationName:name,LastCount:count,TotalCapacity:capacity,IsClosed:isClosed} = entry;
    if (!Number.isInteger(id) || ids.has(id) || typeof name!=='string' || !name.trim() || !Number.isInteger(count) || count<0 || !Number.isInteger(capacity) || capacity<=0 || typeof isClosed!=='boolean') throw new Error('Incomplete BFit counts');
    ids.add(id);
    zones.push({id,name:name.slice(0,120),count,capacity,percent:Math.round(count/capacity*100),isClosed,sourceTimestamp:typeof entry.LastUpdatedDateAndTime==='string'?entry.LastUpdatedDateAndTime:'',updatedAt:parseSourceTime(entry.LastUpdatedDateAndTime)});
  }
  if (!zones.length) throw new Error('No BFit zones in counts response');
  const open = zones.filter(z=>!z.isClosed);
  const reportedCount = open.reduce((sum,z)=>sum+z.count,0);
  const capacity = open.reduce((sum,z)=>sum+z.capacity,0);
  const oldestUpdatedAt = zones.every(z=>z.updatedAt!==null) ? Math.min(...zones.map(z=>z.updatedAt!)) : null;
  return {zones,reportedCount,capacity,percent:capacity?Math.round(reportedCount/capacity*100):null,fetchedAt,oldestUpdatedAt,allClosed:open.length===0,assumedTimeZone:CAMPUS_TIME_ZONE};
}

export function countsAreStale(snapshot: OfficialSnapshot, now = Date.now()) {
  return snapshot.oldestUpdatedAt===null || now-snapshot.oldestUpdatedAt>STALE_MS || snapshot.oldestUpdatedAt-now>5*60_000;
}

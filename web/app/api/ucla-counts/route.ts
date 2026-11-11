import { env } from 'cloudflare:workers';
import { CACHE_MS, COUNTS_API_URL, normalizeUclaCounts, type OfficialSnapshot, type OfficialResponse } from '../../../lib/ucla-counts';
import { fetchJsonWithTimeout, withTimeout } from '../../../lib/network';

const respond = (data: OfficialResponse, status=200) => Response.json(data,{status,headers:{'Cache-Control':'no-store'}});

async function fetchCounts(): Promise<OfficialSnapshot> {
  const response = await fetchJsonWithTimeout<unknown>(COUNTS_API_URL,{headers:{Accept:'application/json'}},6000);
  if (!response.ok) throw new Error('Provider unavailable');
  return normalizeUclaCounts(response.data);
}

export async function GET() {
  let cached: OfficialSnapshot | null = null;
  try {
    if (env.DB) {
      const row = await withTimeout(env.DB.prepare('SELECT payload FROM official_snapshots WHERE id = ?').bind('bfit').first<{payload:string}>(),1500);
      if (row) cached = JSON.parse(row.payload) as OfficialSnapshot;
    }
  } catch { /* A cache problem must not prevent reading the public provider. */ }
  if (cached && Date.now()-cached.fetchedAt<CACHE_MS) return respond({snapshot:cached,cached:false});
  try {
    // Fetch promises belong to this request. A canceled visitor's I/O must not
    // be reused by another request; only serialized snapshots are shared in D1.
    const snapshot = await fetchCounts();
    try {
      if (env.DB) await withTimeout(env.DB.prepare('INSERT INTO official_snapshots (id,payload,fetched_at) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,fetched_at=excluded.fetched_at').bind('bfit',JSON.stringify(snapshot),snapshot.fetchedAt).run(),1500);
    } catch { /* Return the real provider result even if cache storage is unavailable. */ }
    return respond({snapshot,cached:false});
  } catch {
    return respond({snapshot:cached,cached:!!cached,error:cached?'The provider could not be refreshed. Showing the last saved counts.':'UCLA-linked counts are temporarily unavailable. You can still open the source or read community reports.'},cached?200:503);
  }
}

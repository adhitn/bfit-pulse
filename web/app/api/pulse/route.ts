import { env } from 'cloudflare:workers';
import { AREAS, TTL, type Report } from '../../../lib/pulse';
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export async function GET(request: Request) {
  try {
    if (!env.DB) return json({ error: 'The shared database is unavailable. Please try again.' }, 503);
    const now = Date.now();
    const result = await env.DB.prepare('SELECT id, area, level, source, created_at AS createdAt FROM reports WHERE created_at > ? ORDER BY created_at DESC LIMIT 500').bind(now - TTL).all<Report>();
    const userId = request.headers.get('oai-authenticated-user-id');
    const staffIds = ((env as unknown as Record<string,string>).STAFF_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
    return json({ reports: result.results, authenticated: !!userId, canStaff: !!userId && staffIds.includes(userId), now });
  } catch { return json({ error: 'Could not load reports. Try refreshing in a moment.' }, 503); }
}
export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return json({ error: 'Please submit from BFit Pulse.' }, 403);
  const userId = request.headers.get('oai-authenticated-user-id');
  if (!userId) return json({ error: 'Sign in to contribute a report.' }, 401);
  try {
    if (!env.DB) return json({ error: 'The shared database is unavailable.' }, 503);
    const body = await request.json() as { area?: string; level?: number; source?: string; onSite?: boolean };
    if (!AREAS.includes(body.area as typeof AREAS[number]) || !Number.isInteger(body.level) || body.level! < 0 || body.level! > 3 || !['student', 'staff'].includes(body.source || '') || body.onSite !== true) return json({ error: 'Choose an area and crowd level, and confirm you are at BFit.' }, 400);
    const staffIds = ((env as unknown as Record<string,string>).STAFF_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
    if (body.source === 'staff' && !staffIds.includes(userId)) return json({ error: 'Staff access has not been enabled for your account.' }, 403);
    const now = Date.now();
    const result = await env.DB.prepare('INSERT INTO reports (id,user_id,area,level,source,created_at) SELECT ?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM reports WHERE user_id = ? AND created_at > ?)').bind(crypto.randomUUID(), userId, body.area, body.level, body.source, now, userId, now - 60000).run();
    if (!result.meta.changes) return json({ error: 'Thanks! Please wait one minute before submitting another report.' }, 429);
    await env.DB.prepare('DELETE FROM reports WHERE created_at < ?').bind(now - 24 * 60 * 60000).run();
    return json({ ok: true }, 201);
  } catch { return json({ error: 'We could not save that report. Please try again.' }, 503); }
}

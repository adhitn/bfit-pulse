import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeUclaCounts,parseSourceTime,countsAreStale,STALE_MS} from '../lib/ucla-counts.ts';
const now=Date.parse('2026-11-09T23:30:00Z');
const row=(id,extra={})=>({FacilityId:803,LocationId:id,LocationName:'Test zone',LastCount:21,CountOfParticipants:0,TotalCapacity:100,IsClosed:false,LastUpdatedDateAndTime:'2026-11-09T15:20:00',...extra});
test('uses the same LastCount/capacity fields as the public widget and only BFit',()=>{
 const s=normalizeUclaCounts([row(4006),row(4009,{LastCount:27,TotalCapacity:80}),row(999,{FacilityId:1,LastCount:999})],now);
 assert.equal(s.zones.length,2);assert.equal(s.reportedCount,48);assert.equal(s.capacity,180);assert.equal(s.percent,27);assert.equal(s.zones[0].percent,21);
});
test('preserves source names and timestamps, not the time of fetching',()=>{
 const s=normalizeUclaCounts([row(4006)],now);
 assert.equal(s.zones[0].sourceTimestamp,'2026-11-09T15:20:00');
 assert.equal(s.oldestUpdatedAt,Date.parse('2026-11-09T23:20:00Z'));assert.equal(s.fetchedAt,now);
});
test('interprets campus time in winter and summer and preserves explicit offsets',()=>{
 assert.equal(parseSourceTime('2026-11-09T15:20:20.207'),Date.parse('2026-11-09T23:20:20.207Z'));
 assert.equal(parseSourceTime('2026-07-09T15:20:00'),Date.parse('2026-07-09T22:20:00Z'));
 assert.equal(parseSourceTime('2026-07-09T22:20:00Z'),Date.parse('2026-07-09T22:20:00Z'));
 assert.equal(parseSourceTime('2026-11-09T15:20:00-08:00'),Date.parse('2026-11-09T23:20:00Z'));
 assert.equal(parseSourceTime('2026-03-08T02:30:00'),null);
});
test('does not misread missing or invalid timestamps as fresh',()=>{
 assert.equal(parseSourceTime('not a date'),null);assert.equal(parseSourceTime('2026-02-31T15:00:00'),null);
 const s=normalizeUclaCounts([row(1,{LastUpdatedDateAndTime:null})],now);assert.equal(s.oldestUpdatedAt,null);assert.equal(countsAreStale(s,now),true);
});
test('an old or future source timestamp triggers a freshness warning',()=>{
 const s=normalizeUclaCounts([row(1)],now);
 assert.equal(countsAreStale(s,now),false);assert.equal(countsAreStale(s,s.oldestUpdatedAt+STALE_MS+1),true);assert.equal(countsAreStale(s,s.oldestUpdatedAt-6*60000),true);
});
test('closed zones keep their source count but do not contribute to open-zone totals',()=>{
 const s=normalizeUclaCounts([row(1),row(2,{IsClosed:true,LastCount:70})],now);
 assert.equal(s.reportedCount,21);assert.equal(s.capacity,100);assert.equal(s.zones[1].count,70);
 const closed=normalizeUclaCounts([row(2,{IsClosed:true})],now);assert.equal(closed.allClosed,true);assert.equal(closed.percent,null);
});
test('does not fabricate a zero for null counts or return double-counted zones',()=>{
 for(const data of [[],{},[row(1,{LastCount:null})],[row(1),row(1)],[row(1,{TotalCapacity:0})],[row(1,{LastCount:-1})]]) assert.throws(()=>normalizeUclaCounts(data,now));
});
test('over-capacity counts are preserved rather than silently reduced',()=>{
 const s=normalizeUclaCounts([row(1,{LastCount:110})],now);assert.equal(s.reportedCount,110);assert.equal(s.percent,110);
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {RESEARCHED_HOURS,parseBfitHours,bfitAvailability,dayHours,dayHoursText,attendanceDisplayMode} from '../lib/bfit-hours.ts';
const fixture=readFileSync(new URL('./fixtures/bfit-hours-fall-2026.html',import.meta.url),'utf8');
const at=(date,time,offset='-08:00')=>Date.parse(`${date}T${time}${offset}`);
const state=(date,time,schedule=RESEARCHED_HOURS,offset='-08:00')=>bfitAvailability(schedule,at(date,time,offset));

test('research fixture parses all regular days, dated closures, and the source typo',()=>{
 const schedule=parseBfitHours(fixture,1234);
 assert.equal(Object.keys(schedule.weekly).length,7);assert.equal(schedule.checkedAt,1234);
 assert.equal(dayHoursText(dayHours(schedule,'2026-11-12')),'6 AM–midnight');
 assert.equal(dayHours(schedule,'2026-11-11').kind,'closed');
 assert.equal(dayHours(schedule,'2026-11-28').kind,'closed');
 assert.equal(dayHours(schedule,'2026-11-29').kind,'unknown');
 assert.match(schedule.notes[0],/weekday and date do not match/);
});
test('early mornings are closed and opening is inclusive at 6 AM',()=>{
 assert.equal(state('2026-11-12','05:59:59').status,'closed');
 assert.equal(state('2026-11-12','06:00:00').status,'open');
 assert.equal(state('2026-11-12','00:00:00').status,'closed');
 assert.equal(state('2026-11-12','05:59:59').nextOpening,at('2026-11-12','06:00:00'));
});
test('midnight is a closing boundary, never 24-hour opening',()=>{
 assert.equal(state('2026-11-12','23:59:59').status,'open');
 assert.equal(state('2026-11-13','00:00:00').status,'closed');
 assert.equal(state('2026-11-13','00:00:00').nextOpening,at('2026-11-13','06:00:00'));
});
test('Friday, Saturday, and Sunday each have their own opening/closing times',()=>{
 for(const [date,close] of [['2026-11-13','21:00:00'],['2026-11-14','18:00:00'],['2026-11-15','21:00:00']])assert.equal(state(date,close).status,'closed');
 assert.equal(state('2026-11-14','08:59:59').status,'closed');
 assert.equal(state('2026-11-14','09:00:00').status,'open');
 assert.equal(state('2026-11-15','09:00:00').status,'open');
});
test('Veterans Day closure overrides a normally open Wednesday all day',()=>{
 for(const time of ['00:00:00','06:00:00','12:00:00','23:59:59'])assert.equal(state('2026-11-11',time).status,'closed');
 const result=state('2026-11-11','12:00:00');assert.equal(result.reason,'Veterans Day');assert.equal(result.nextOpening,at('2026-11-12','06:00:00'));
});
test('special early closing times override normal weekday hours',()=>{
 assert.equal(state('2026-11-10','20:59:59').status,'open');assert.equal(state('2026-11-10','21:00:00').status,'closed');
 assert.equal(state('2026-11-25','14:59:59').status,'open');assert.equal(state('2026-11-25','15:00:00').status,'closed');
});
test('Thanksgiving and the published Friday/Saturday closure range are closed',()=>{
 for(const date of ['2026-11-26','2026-11-27','2026-11-28'])for(const time of ['00:00:00','12:00:00','23:59:59'])assert.equal(state(date,time).status,'closed');
});
test('a date/weekday conflict is not guessed, and next opening does not skip an unknown day',()=>{
 assert.equal(state('2026-11-29','16:00:00').status,'unknown');
 assert.equal(state('2026-11-28','12:00:00').nextOpening,null);
});
test('if UCLA corrects its Sunday date, the live parser uses the newly published hours',()=>{
 const corrected=parseBfitHours(fixture.replace('Sunday 11/28','Sunday 11/29'));
 assert.equal(corrected.notes.length,0);
 assert.equal(state('2026-11-29','14:59:59',corrected).status,'closed');
 assert.equal(state('2026-11-29','15:00:00',corrected).status,'open');
 assert.equal(state('2026-11-29','21:00:00',corrected).status,'closed');
 assert.equal(state('2026-11-28','12:00:00',corrected).nextOpening,at('2026-11-29','15:00:00'));
});
test('published 1 AM special closing properly carries into the next date',()=>{
 assert.equal(state('2026-10-06','00:30:00',RESEARCHED_HOURS,'-07:00').status,'open');
 assert.equal(state('2026-10-06','01:00:00',RESEARCHED_HOURS,'-07:00').status,'closed');
 assert.equal(state('2026-10-07','00:30:00',RESEARCHED_HOURS,'-07:00').status,'open');
 assert.equal(state('2026-10-07','01:00:00',RESEARCHED_HOURS,'-07:00').status,'closed');
});
test('campus Pacific time is used even when the instant is expressed in UTC',()=>{
 assert.equal(bfitAvailability(RESEARCHED_HOURS,Date.parse('2026-11-13T05:59:00Z')).status,'open');
 assert.equal(bfitAvailability(RESEARCHED_HOURS,Date.parse('2026-11-13T08:01:00Z')).status,'closed');
});
test('unpublished winter break and a later year never inherit old fall or holiday rules',()=>{
 assert.equal(state('2026-12-12','12:00:00').status,'unknown');
 assert.equal(state('2027-11-11','12:00:00').status,'unknown');
});
test('changed regular hours are read from the live page, with incomplete/new-season schedules rejected',()=>{
 const changed=parseBfitHours(fixture.replace('Sunday: 9:00 AM','Sunday: 10:00 AM'));
 assert.equal(state('2026-11-15','09:30:00',changed).status,'closed');assert.equal(state('2026-11-15','10:00:00',changed).status,'open');
 assert.throws(()=>parseBfitHours(fixture.replace('Fall Hours Begin','Winter Hours Begin')));
 assert.throws(()=>parseBfitHours('<h2>Hours</h2><p>Unavailable</p>'));
});
test('closed/unknown hours suppress old attendance even when the feed claims open',()=>{
 const yesterday={oldestUpdatedAt:at('2026-11-10','20:00:00'),allClosed:false};
 assert.equal(attendanceDisplayMode(state('2026-11-11','12:00:00'),yesterday),'closed');
 assert.equal(attendanceDisplayMode(state('2026-11-29','12:00:00'),yesterday),'unknown-hours');
 assert.equal(attendanceDisplayMode(null,yesterday),'waiting-hours');
});
test('reopening waits for a post-opening count; a fresh live closure can also hide counts',()=>{
 const open=state('2026-11-12','06:30:00'),now=at('2026-11-12','06:30:00');
 assert.equal(attendanceDisplayMode(open,{oldestUpdatedAt:at('2026-11-10','20:00:00'),allClosed:false},now),'awaiting-count');
 assert.equal(attendanceDisplayMode(open,{oldestUpdatedAt:at('2026-11-12','06:20:00'),allClosed:false},now),'counts');
 assert.equal(attendanceDisplayMode(open,{oldestUpdatedAt:at('2026-11-12','06:20:00'),allClosed:true},now),'feed-closed');
});

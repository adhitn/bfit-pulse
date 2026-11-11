import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fetchJsonWithTimeout,withTimeout,RequestTimeoutError} from '../lib/network.ts';

test('a hung transport is bounded and receives an abort signal',async()=>{
 let signal;
 const hung=(_url,options)=>{signal=options.signal;return new Promise(()=>{});};
 await assert.rejects(fetchJsonWithTimeout('https://example.test',{},10,hung),RequestTimeoutError);
 assert.equal(signal.aborted,true);
});
test('a response whose body never completes is also bounded',async()=>{
 const hungBody=async()=>({ok:true,status:200,text:()=>new Promise(()=>{})});
 await assert.rejects(fetchJsonWithTimeout('https://example.test',{},10,hungBody),RequestTimeoutError);
});
test('a request after a timeout can succeed independently',async()=>{
 let attempt=0;
 const fetcher=()=>++attempt===1?new Promise(()=>{}):Promise.resolve(new Response(JSON.stringify({snapshot:{reportedCount:110}})));
 await assert.rejects(fetchJsonWithTimeout('https://example.test',{},10,fetcher),RequestTimeoutError);
 const result=await fetchJsonWithTimeout('https://example.test',{},100,fetcher);
 assert.equal(result.ok,true);assert.equal(result.data.snapshot.reportedCount,110);
});
test('non-JSON failures get a readable error and HTTP JSON failures keep their status',async()=>{
 await assert.rejects(fetchJsonWithTimeout('https://example.test',{},100,async()=>new Response('<html>gateway failure</html>',{status:502})),/unreadable response/);
 const result=await fetchJsonWithTimeout('https://example.test',{},100,async()=>Response.json({error:'Unavailable'},{status:503}));
 assert.equal(result.ok,false);assert.equal(result.status,503);
});
test('a stalled optional cache operation times out without blocking the route forever',async()=>{
 await assert.rejects(withTimeout(new Promise(()=>{}),10),RequestTimeoutError);
 assert.equal(await withTimeout(Promise.resolve('healthy'),100),'healthy');
});

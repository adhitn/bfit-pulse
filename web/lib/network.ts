export class RequestTimeoutError extends Error {
  constructor() { super('The request took too long. Please try again.'); this.name='RequestTimeoutError'; }
}

// Bound the whole operation, including reading the body. Aborting fetch alone
// does not provide a deadline for every transport/browser failure mode.
export async function withTimeout<T>(operation:PromiseLike<T>, milliseconds:number, onTimeout?:()=>void):Promise<T> {
  let timer:ReturnType<typeof setTimeout>|undefined;
  const deadline=new Promise<never>((_,reject)=>{
    timer=setTimeout(()=>{ reject(new RequestTimeoutError()); onTimeout?.(); },milliseconds);
  });
  try { return await Promise.race([operation,deadline]); }
  finally { if(timer!==undefined)clearTimeout(timer); }
}

export async function fetchJsonWithTimeout<T>(url:string, options:RequestInit={}, milliseconds=12_000, fetcher:typeof fetch=fetch):Promise<{ok:boolean;status:number;data:T}> {
  const controller=new AbortController();
  const operation=(async()=>{
    const response=await fetcher(url,{...options,signal:controller.signal});
    const text=await response.text();
    if(text.length>1_000_000)throw new Error('The count service returned an unexpected response. Please try again.');
    let data:T;
    try {data=JSON.parse(text) as T;}
    catch {throw new Error('The count service returned an unreadable response. Please try again.');}
    return {ok:response.ok,status:response.status,data};
  })();
  return withTimeout(operation,milliseconds,()=>controller.abort());
}

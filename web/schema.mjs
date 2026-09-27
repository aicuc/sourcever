const assert=(ok,msg)=>{if(!ok)throw new Error(msg);};
const strings=(xs)=>Array.isArray(xs)&&xs.every(s=>typeof s==='string');
const fields=(obj,keys)=>keys.every(k=>typeof obj?.[k]==='string');
const url=(s)=>{try{return ['https:','http:'].includes(new URL(s).protocol);}catch{return false;}};
export function validateCase(c,db){
 for(const key of ['resources','sources','access']){assert(Array.isArray(db[key])&&db[key].length<=200,'Invalid collection');assert(new Set(db[key].map(x=>x.id)).size===db[key].length,'Duplicate entity IDs');}
 assert(fields(c,['id','title','want','need','summary','failureNote','mode','updatedAt']),'Invalid case metadata');
 assert(Array.isArray(c.nodes)&&c.nodes.length>=2&&c.nodes.length<=30,'Invalid nodes');
 const ids=new Set(c.nodes.map(n=>n.id));assert(ids.size===c.nodes.length,'Duplicate nodes');
 for(const n of c.nodes)assert(fields(n,['id','name','era','solves','limitation','representative','evidence','reason'])&&strings(n.sourceIds)&&Number.isInteger(n.lane)&&Number.isInteger(n.stage),'Invalid node');
 assert(Array.isArray(c.edges),'Invalid edges');
 for(const e of c.edges)assert(ids.has(e.fromId)&&ids.has(e.toId)&&e.fromId!==e.toId&&fields(e,['why','oldCapability','oldLimit','newCapability','newProblem','evidence'])&&strings(e.sourceIds),'Invalid edge');
 assert(c.frontier&&strings(c.frontier.mature)&&strings(c.frontier.growing)&&Array.isArray(c.frontier.gaps)&&c.frontier.gaps.every(g=>fields(g,['title','evidence','experiment'])),'Invalid frontier');
 assert(Array.isArray(c.failures)&&c.failures.every(f=>fields(f,['name','when','promise','innovation','outcome','reason','lesson'])&&strings(f.sourceIds)),'Invalid failures');
 assert(strings(c.resourceIds)&&strings(c.sourceIds),'Invalid references');
 for(const s of db.sources)assert(fields(s,['id','name','url','tier','description'])&&url(s.url),'Invalid source');
 const sourceIds=new Set(db.sources.map(s=>s.id));
 for(const id of [...c.sourceIds,...c.nodes.flatMap(n=>n.sourceIds),...c.edges.flatMap(e=>e.sourceIds),...c.failures.flatMap(f=>f.sourceIds)])assert(sourceIds.has(id),'Missing source '+id);
 for(const id of c.resourceIds){const r=db.resources.find(r=>r.id===id);assert(r&&fields(r,['name','description','url','pricing','status','solutionId','sourceId','accessId'])&&url(r.url)&&ids.has(r.solutionId)&&sourceIds.has(r.sourceId),'Invalid resource');const a=db.access.find(a=>a.id===r.accessId);assert(a&&a.resourceId===r.id&&fields(a,['how','eligibility','conditions','region','window','sourceId'])&&strings(a.alternativeIds)&&sourceIds.has(a.sourceId),'Invalid access');}
 return true;
}

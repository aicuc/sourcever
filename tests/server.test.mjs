import {test, before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer,matchCase,db} from '../server.mjs';
import {validateCase} from '../web/schema.mjs';
let server,base;
before(async()=>{server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}`;});
after(()=>new Promise(r=>server.close(r)));
const post=body=>fetch(base+'/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
test('all curated cases satisfy contract',()=>{for(const c of db.cases)assert.equal(validateCase(c,db),true);});
test('topic matching preserves unknown needs',()=>{assert.equal(matchCase('我想做团队在线文档').id,'collaboration');assert.equal(matchCase('我想自动备份文件').id,'cloud-storage');assert.equal(matchCase('我想培育番茄'),null);});
test('analyze returns clearly matched curated case',async()=>{const r=await post({query:'我想快速搭建网站'});assert.equal(r.status,200);const data=await r.json();assert.equal(data.case.id,'website');assert.equal(data.matched,true);});
test('unknown need is not silently replaced',async()=>{const key=process.env.AI_API_KEY;delete process.env.AI_API_KEY;try{const r=await post({query:'我想培育番茄'});assert.equal(r.status,422);assert.equal((await r.json()).code,'AI_NOT_CONFIGURED');}finally{if(key)process.env.AI_API_KEY=key;}});
test('rejects invalid and excessive requests',async()=>{for(const query of ['',1,null,'x'.repeat(601)])assert.equal((await post({query})).status,400);assert.equal((await post({query:'x'.repeat(9000)})).status,413);});
test('private files and traversal never served',async()=>{for(const p of ['/.env','/server.mjs','/data/cases.json','/../package.json','/%2e%2e/.env'])assert.equal((await fetch(base+p)).status,404);});
test('cross-origin model requests rejected',async()=>{const r=await fetch(base+'/api/analyze',{method:'POST',headers:{Origin:'https://unrelated.example','Content-Type':'application/json'},body:JSON.stringify({query:'网站搭建'})});assert.equal(r.status,403);});
test('static app and security headers available',async()=>{const r=await fetch(base);assert.equal(r.status,200);assert.match(await r.text(),/Sourcever/);assert.match(r.headers.get('content-security-policy'),/script-src 'self'/);assert.equal((await fetch(base+'/app.mjs')).status,200);});
test('reject dangling model citations and unsafe URLs',()=>{const c=structuredClone(db.cases[0]);c.nodes[0].sourceIds=['invented'];assert.throws(()=>validateCase(c,db),/Missing source/);const data=structuredClone(db);data.sources[0].url='javascript:alert(1)';assert.throws(()=>validateCase(db.cases[0],data),/Invalid source/);});
test('provider failures do not disclose API key or upstream body',async()=>{const mock=createServer();await new Promise(r=>mock.listen(0,'127.0.0.1',r));const saved={key:process.env.AI_API_KEY,model:process.env.AI_MODEL,url:process.env.AI_BASE_URL};process.env.AI_API_KEY='test-secret-never-return';process.env.AI_MODEL='mock';process.env.AI_BASE_URL=`http://127.0.0.1:${mock.address().port}`;try{const r=await post({query:'我想培育番茄'});assert.equal(r.status,502);assert.doesNotMatch(await r.text(),/test-secret/);}finally{for(const [k,v] of Object.entries({AI_API_KEY:saved.key,AI_MODEL:saved.model,AI_BASE_URL:saved.url})){if(v===undefined)delete process.env[k];else process.env[k]=v;}await new Promise(r=>mock.close(r));}});
test('valid AI response gets unverified provenance and sources reset',async()=>{
 const http=await import('node:http');
 const c=structuredClone(db.cases[1]);const resources=db.resources.filter(r=>c.resourceIds.includes(r.id));const access=db.access.filter(a=>resources.some(r=>r.accessId===a.id));
 const payload={case:c,resources,sources:db.sources,access};
 const mock=http.createServer((req,res)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{message:{content:JSON.stringify(payload)}}]}));});
 await new Promise(r=>mock.listen(0,'127.0.0.1',r));const keys=['AI_API_KEY','AI_MODEL','AI_BASE_URL'];const saved=keys.map(k=>process.env[k]);
 process.env.AI_API_KEY='local-test-key';process.env.AI_MODEL='mock';process.env.AI_BASE_URL=`http://127.0.0.1:${mock.address().port}`;
 try{const r=await post({query:'我想改善团队决策',forceAI:true});assert.equal(r.status,200);const data=await r.json();assert.equal(data.case.mode,'ai');assert.equal(data.case.want,'我想改善团队决策');assert.ok(data.sources.every(s=>s.checkedAt===null));}finally{keys.forEach((k,i)=>{if(saved[i]===undefined)delete process.env[k];else process.env[k]=saved[i];});await new Promise(r=>mock.close(r));}
});

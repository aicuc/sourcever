import {readFile} from 'node:fs/promises';
import {validateCase} from '../web/schema.mjs';
const names=['cases','needs','solutions','resources','sources','access','relations','evolution-events'];
const db=Object.fromEntries(await Promise.all(names.map(async n=>[n,JSON.parse(await readFile(new URL(`../data/${n}.json`,import.meta.url),'utf8'))])));
for(const c of db.cases){validateCase(c,db);for(const n of c.nodes){const stored=db.solutions.find(s=>s.id===n.id);if(!stored||Object.keys(n).some(k=>JSON.stringify(n[k])!==JSON.stringify(stored[k])))throw new Error('Aggregate mismatch '+n.id);}}
const ids=new Set();
for(const table of ['needs','solutions','resources','sources','access','evolution-events'])for(const row of db[table]){if(ids.has(row.id))throw new Error('Duplicate global ID '+row.id);ids.add(row.id);}
for(const r of db.relations)if(!ids.has(r.fromId)||!ids.has(r.toId))throw new Error('Dangling relation '+JSON.stringify(r));
for(const a of db.access)for(const id of a.alternativeIds)if(!db.resources.some(r=>r.id===id))throw new Error('Missing alternative');
for(const c of db.cases){const visited=new Set(),stack=new Set();const walk=id=>{if(stack.has(id))throw new Error('Evolution cycle');if(visited.has(id))return;stack.add(id);for(const e of c.edges.filter(e=>e.fromId===id))walk(e.toId);stack.delete(id);visited.add(id);};for(const n of c.nodes)walk(n.id);}
console.log(`Validated ${db.cases.length} cases, ${db.solutions.length} solutions, ${db.resources.length} resources and ${db.relations.length} relations.`);

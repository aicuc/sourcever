import { findCase } from './match.mjs';
export const isStaticDemo = document.querySelector('meta[name="sourcever-mode"]')?.content === 'static';
export async function loadBootstrap() {
 const response = await fetch(isStaticDemo ? './demo-data.json' : './api/bootstrap');
 if (!response.ok) throw new Error('无法加载图谱');
 return response.json();
}
export async function analyzeQuery(query, forceAI, db) {
 if (isStaticDemo) {
  const selected = findCase(db.cases, query);
  if (!selected) throw new Error('公开 Demo 尚未收录这个需求。请从上方或左侧选择一个公开案例；任意需求的 AI 分析可在本地版本中配置。');
  return { case: selected, resources: db.resources, sources: db.sources, access: db.access, matched: true };
 }
 const response = await fetch('./api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, forceAI }) });
 const result = await response.json();
 if (!response.ok) throw new Error(result.error);
 return result;
}

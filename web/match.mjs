export function findCase(cases, query) {
 const q = query.toLowerCase();
 const ranked = cases.map(c => [c, c.keywords.reduce((score, keyword) => score + (q.includes(keyword) ? keyword.length : 0), 0)]).sort((a, b) => b[1] - a[1]);
 return ranked[0]?.[1] > 0 ? ranked[0][0] : null;
}

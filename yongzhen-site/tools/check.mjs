// 驗收檢查（靜態）：node tools/check.mjs  ——對應合約「技術規格與搜尋可見性」二、三、四
import fs from 'node:fs';
import path from 'node:path';
const DIST = 'dist';
const S = JSON.parse(fs.readFileSync('src/site.json', 'utf8'));
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') && files.push(p); } })(DIST);
const res = { pass: 0, fail: [] };
const ok = (c, msg) => c ? res.pass++ : res.fail.push(msg);
const urlOf = f => '/' + path.relative(DIST, f).replace(/index\.html$/, '').replace(/\\/g, '/');
const m1 = (h, re) => (h.match(re) || [])[1];

const sitemap = fs.readFileSync(`${DIST}/sitemap.xml`, 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)/g)].map(m => m[1]);
const allPaths = new Set(files.map(urlOf));
const pub = files.filter(f => !/404\.html$|admin/.test(f));

for (const f of pub) {
  const h = fs.readFileSync(f, 'utf8'), u = urlOf(f), tag = `[${u}]`;
  // 二、SEO 基礎
  const title = m1(h, /<title>([^<]*)/), desc = m1(h, /<meta name="description" content="([^"]*)/);
  ok(title && title.length >= 8 && title.length <= 70, `${tag} title 長度不佳（${title && title.length}）`);
  ok(desc && desc.length >= 30 && desc.length <= 200, `${tag} description 長度不佳（${desc && desc.length}）`);
  ok(m1(h, /<link rel="canonical" href="([^"]+)/) === S.siteUrl + u, `${tag} canonical 不正確`);
  for (const k of ['og:title', 'og:description', 'og:url', 'og:image', 'og:type']) ok(h.includes(`property="${k}"`), `${tag} 缺 ${k}`);
  ok(/<html lang="zh-Hant-TW"/.test(h), `${tag} 缺 lang`);
  ok(/name="viewport" content="width=device-width,initial-scale=1"/.test(h), `${tag} 缺 viewport`);
  ok(sitemapUrls.includes(S.siteUrl + u), `${tag} 不在 sitemap`);
  ok(!/noindex/.test(h), `${tag} 不應 noindex`);
  // 四、GEO：標題層級
  const hs = [...h.matchAll(/<h([1-6])[\s>]/g)].map(m => +m[1]);
  ok(hs.filter(x => x === 1).length === 1, `${tag} H1 數量應為 1（${hs.filter(x => x === 1).length}）`);
  let prev = 0, skip = false; for (const x of hs) { if (prev && x > prev + 1) skip = true; prev = x; }
  ok(!skip, `${tag} 標題層級跳級：${hs.join('')}`);
  // 圖片 alt、內部連結
  for (const m of h.matchAll(/<img\b[^>]*>/g)) ok(/\salt=/.test(m[0]), `${tag} img 缺 alt`);
  for (const m of h.matchAll(/<a [^>]*href="(\/[^"#]*)/g)) { const t = m[1].endsWith('/') || m[1].includes('.') ? m[1] : m[1] + '/'; ok(allPaths.has(t) || fs.existsSync(path.join(DIST, t)), `${tag} 內部連結失效：${m[1]}`); }
  // 三、JSON-LD
  const blocks = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const nodes = []; let bad = false;
  for (const b of blocks) { try { const o = JSON.parse(b); nodes.push(o); } catch { bad = true; } }
  ok(!bad, `${tag} JSON-LD 無法解析`);
  const types = n => [].concat(n['@type']);
  const has = t => nodes.some(n => types(n).includes(t));
  ok(has('LocalBusiness') && has('Organization') === false || nodes.some(n => types(n).includes('LocalBusiness')), `${tag} 缺 LocalBusiness`);
  const org = nodes.find(n => types(n).includes('LocalBusiness'));
  if (org) { ok(org.name && org.address?.['@type'] === 'PostalAddress' && org.telephone && org.image, `${tag} LocalBusiness 欄位不全`); }
  if (u !== '/') ok(has('BreadcrumbList'), `${tag} 缺 BreadcrumbList`);
  nodes.filter(n => types(n).includes('BreadcrumbList')).forEach(n => n.itemListElement.forEach((it, i) => ok(it.position === i + 1 && it.name && it.item, `${tag} Breadcrumb 項目不全`)));
  nodes.filter(n => types(n).includes('FAQPage')).forEach(n => { ok(n.mainEntity.length > 0, `${tag} FAQPage 無問題`); n.mainEntity.forEach(q => ok(q.name && q.acceptedAnswer?.text, `${tag} FAQ 項目不全`)); });
  if (u.startsWith('/courses/')) {
    ok(has('Course') && has('Service') && has('FAQPage'), `${tag} 課程頁缺 Course/Service/FAQPage`);
    const c = nodes.find(n => types(n).includes('Course')); if (c) ok(c.name && c.description && c.provider?.name, `${tag} Course 必填欄位不全`);
  }
  if (/^\/articles\/[^/]+\/$/.test(u) && !S.categories.some(c => `/articles/${c.slug}/` === u) ) { const a = nodes.find(n => types(n).includes('Article')); ok(a && a.headline && a.datePublished && a.author && a.image, `${tag} Article 欄位不全`); }
  if (u === '/') ok(has('FAQPage') && has('ItemList'), `${tag} 首頁缺 FAQPage/ItemList`);
}
// 404、admin
const nf = fs.readFileSync(`${DIST}/404.html`, 'utf8'); ok(/noindex/.test(nf), '404 應 noindex');
ok(/noindex/.test(fs.readFileSync(`${DIST}/admin/index.html`, 'utf8')), 'admin 應 noindex');
// robots / sitemap / headers / 其他
const robots = fs.readFileSync(`${DIST}/robots.txt`, 'utf8');
ok(/Sitemap: /.test(robots), 'robots 缺 Sitemap');
const blocked = new Set(S.aiBlock || []);
for (const bot of ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'Google-Extended', 'PerplexityBot', 'ClaudeBot']) {
  const m = robots.match(new RegExp(`User-agent: ${bot}\\n([^]*?)(?:\\n\\n|$)`));
  ok(m && (blocked.has(bot) ? /Disallow: \/\s*$/m.test(m[1]) : /Allow: \//.test(m[1]) && !/Disallow: \/\s*$/m.test(m[1])), `robots：${bot} 設定不符（aiBlock=${[...blocked]}）`);
}
ok(/Disallow: \/admin/.test(robots), 'robots 應擋 /admin');
ok(fs.existsSync(`${DIST}/404.html`) && fs.existsSync(`${DIST}/og.png`) && fs.existsSync(`${DIST}/llms.txt`) && fs.existsSync(`${DIST}/_redirects`), '缺 404/og.png/llms.txt/_redirects');
ok(sitemapUrls.every(u => u.startsWith(S.siteUrl)), 'sitemap 含非本站網址');
// 301：舊網址全部有對照，且目的地存在
const red = fs.readFileSync(`${DIST}/_redirects`, 'utf8').split('\n').filter(l => /301$/.test(l));
for (const l of red) { const [from, to] = l.split(/\s+/); ok(from.startsWith('/') && (to === '/' || allPaths.has(to)), `301 目的地不存在：${l}`); }
for (const c of S.courses) ok(red.some(l => l.startsWith(c.old + ' ')), `缺 301：${c.old}`);

console.log(`檢查頁面 ${pub.length} 頁、301 規則 ${red.length} 條`);
console.log(`通過 ${res.pass} 項，失敗 ${res.fail.length} 項`);
res.fail.forEach(f => console.log('  ✗', f));
process.exit(res.fail.length ? 1 : 0);

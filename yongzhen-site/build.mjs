import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { convert, convertBlocks, parseFaq, indexImages, imgSize, esc } from './tools/md.mjs';
const Y = createRequire(import.meta.url)('./src/blocks.js');

const S = JSON.parse(fs.readFileSync('src/site.json', 'utf8'));
const OUT = 'dist';
// 後台「發布檔」：既有頁面的內文覆蓋與新增頁面／文章。正式版由 CONTENT_URL（Google Apps Script）提供；示範版讀 src/content/overrides.json
let OV = { pages: {}, custom: [] };
try {
  let j = null;
  if (process.env.CONTENT_URL) { const res = await fetch(process.env.CONTENT_URL); if (res.ok) j = await res.json(); else console.warn('CONTENT_URL 讀取失敗：', res.status); }
  else if (fs.existsSync('src/content/overrides.json')) j = JSON.parse(fs.readFileSync('src/content/overrides.json', 'utf8'));
  if (j) OV = { pages: j.pages || {}, custom: Array.isArray(j.custom) ? j.custom : [] };
} catch (e) { console.warn('發布檔讀取失敗，改用預設內容：', e.message); }
const RESERVED = new Set(['admin', 'img', 'news', 'courses', 'articles', 'schedule', 'faq', 'about', 'booking', 'contact', 'privacy', 'terms', 'teachers', 'stories', 'partners', 'media', 'videos', 'knowledge', 'classroom', 'uploads', 'api', 'style', 'app']);
const CUSTOM = OV.custom.filter(c => c && c.status === 'published' && typeof c.slug === 'string' && Y.SLUG.test(c.slug) && typeof c.title === 'string' && c.title.trim() && (c.type === 'article' || (c.type === 'page' && !RESERVED.has(c.slug))));
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
if (fs.existsSync('public')) fs.cpSync('public', OUT, { recursive: true });
const IMAGES = indexImages('public/img');
const write = (p, c) => { const f = path.join(OUT, p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, c); };
const abs = p => S.siteUrl + p;
const has = p => fs.existsSync(path.join('public', p));
const LOGO_SEAL = ['/img/logo/logo-seal.png', '/img/logo/logo-seal.jpg', '/img/logo/logo-seal.svg', '/img/logo/logo-seal.webp'].find(has);
const LOGO_YOGA = ['/img/logo/logo-loveyoga.png', '/img/logo/logo-loveyoga.jpg', '/img/logo/logo-loveyoga.svg', '/img/logo/logo-loveyoga.webp'].find(has);
const k = (key, v, tag = 'span', extra = '') => `<${tag} data-k="${key}"${extra}>${esc(v)}</${tag}>`;
const slug = s => s.replace(/[^\w一-龥]+/g, '-').replace(/^-|-$/g, '');

// ---------- 圖示 ----------
const IC = {
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  heart: '<path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z"/>',
  building: '<path d="M4 21V5l8-3 8 3v16M9 21v-5h6v5M8 9h2M14 9h2M8 13h2M14 13h2"/>',
  book: '<path d="M5 4h13a1 1 0 0 1 1 1v14H6a1 1 0 0 0-1 1zM5 4v16"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5l6 3.5-6 3.5z"/>',
  tv: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 22l5-3 5 3-1.5-8"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5"/>',
  brain: '<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3 2 2 0 0 0 3-1V5a2 2 0 0 0-3-1zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3 2 2 0 0 1-3-1"/>',
  leaf: '<path d="M5 19c0-9 5-14 15-14 0 10-5 15-14 15M5 19c3-3 6-6 9-8"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  map: '<path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="M5 12l4 4 10-10"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>'
};
const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${IC[n] || IC.star}</svg>`;

// ---------- 舊網址 → 新網址 ----------
const MAP = new Map([['index.html', '/'], ['index.php', '/'], ['news.html', '/news/'], ['contactus.html', '/contact/'], ['content_16.html', '/articles/'], ['content_1.html', '/courses/'],
  ['page_64.html', '/courses/tquk-ofqual/'], ['page_19.html', '/courses/four-in-one/'], ['page_18.html', '/classroom/'], ['page_26.html', '/teachers/'], ['page_27.html', '/schedule/'],
  ['photos.html', '/classroom/'], ['movie.html', '/videos/'], ['sitemap.html', '/'], ['aromatherapy.html', '/courses/aromatherapy/']]);
for (const c of S.courses) MAP.set(c.old.slice(1), `/courses/${c.slug}/`);
for (const p of S.pages) MAP.set(p.old.slice(1), `/${p.slug}/`);
for (const f of S.faqPages) MAP.set(f.old.slice(1), `/${f.slug}/`);
for (const c of S.categories) MAP.set(c.old.slice(1), `/articles/${c.slug}/`);
// 最新消息：原站 43 篇全文（src/news-meta.json 提供日期與列表標題）
const NEWS_META = JSON.parse(fs.readFileSync('src/news-meta.json', 'utf8'));
const thin = id => fs.readFileSync(`source/pages/news_details_${id}.html.md`, 'utf8').replace(/\[圖:[^\]]*\]/g, '').replace(/[^\u4e00-\u9fa5]/g, '').length < 200;
const THIN = new Set(Object.keys(NEWS_META).filter(thin));
const NEWS = Object.entries(NEWS_META).filter(([id]) => !THIN.has(id)).map(([id, m]) => ({ id, ...m, src: `news_details_${id}.html.md` })).sort((a, b) => (b.date || '0') < (a.date || '0') ? -1 : 1);
for (const n of NEWS) MAP.set(`news_details_${n.id}.html`, `/news/${n.id}/`);
for (const id of THIN) MAP.set(`news_details_${id}.html`, '/news/');
const todayIsoB = new Date().toISOString().slice(0, 10);
const CART = CUSTOM.filter(c => c.type === 'article' && !NEWS_META[c.slug]).map(c => ({ id: c.slug, date: c.date || todayIsoB, title: c.title }));
const NEWS_ALL = [...NEWS, ...CART].sort((a, b) => (b.date || '0') < (a.date || '0') ? -1 : 1);
S.news = NEWS_ALL.map(n => ({ id: 'n' + n.id, date: n.date, title: n.title, href: `/news/${n.id}/` }));
const newsIds = new Set(NEWS.map(n => n.id));
function mapLink(u) {
  if (/^(tel:|mailto:|#)/.test(u)) return u;
  let m = u.match(/^https?:\/\/(?:www\.)?loveyogalohas\.com\.tw\/?([^?#]*)/i);
  if (!m && /^https?:\/\//i.test(u)) return u;
  const f = (m ? m[1] : u.replace(/^\.?\//, '')).replace(/[?#].*$/, '') || 'index.html';
  if (MAP.has(f)) return MAP.get(f);
  const nd = f.match(/^news_details_(\d+)\.html$/); if (nd) return newsIds.has(nd[1]) ? `/news/${nd[1]}/` : '/news/';
  return null;
}
const DROP = [/特惠\s*\$/, /兩人同行/, /本期獨享特別優惠/];
const LABELS = new Map([['/', '首頁'], ['/contact/', '聯絡我們'], ['/news/', '最新消息'], ['/schedule/', '最新開課資訊'], ['/teachers/', '授課講師介紹'], ['/articles/', '好書佳文分享'], ['/courses/', '全部課程'], ['/classroom/', '桃園瑜珈中心']]);
for (const c of S.courses) LABELS.set(`/courses/${c.slug}/`, c.name);
for (const p of S.pages) LABELS.set(`/${p.slug}/`, p.h1);
for (const f of S.faqPages) LABELS.set(`/${f.slug}/`, f.h1);
for (const c of S.categories) LABELS.set(`/articles/${c.slug}/`, c.name);
const linkLabel = to => LABELS.get(to.replace(/#.*$/, ''));
const RENDER_OPTS = { cta: t => cta(t || '想進一步了解？'), imgSize: src => src.startsWith('/img/') ? imgSize('public' + src) : null };
const EDITABLE = [];
function applyOv(key, base, kind, path, mdBlocks) {
  EDITABLE.push({ key, kind, path, h1: base.h1, title: base.title, desc: base.desc, blocks: mdBlocks });
  const o = OV.pages[key]; if (!o) return { ...base, faq: [] };
  let html = base.html, faq = [];
  if (Array.isArray(o.blocks)) { const rr = Y.render(o.blocks, RENDER_OPTS); html = rr.html; faq = rr.faq; }
  return { html, faq, h1: (o.h1 || '').trim() || base.h1, title: (o.seoTitle || '').trim() || base.title, desc: (o.seoDesc || '').trim() || base.desc };
}
const mdBlocks = (src, alt) => convertBlocks(fs.readFileSync(`source/pages/${src}`, 'utf8'), { links: mapLink, linkLabel, images: IMAGES, alt, drop: DROP });
const conv = (src, alt) => convert(fs.readFileSync(`source/pages/${src}`, 'utf8'), { links: mapLink, linkLabel, images: IMAGES, alt, drop: DROP });
function prose(html) {
  let n = 0;
  const toc = [];
  let last = 1; // 頁面已有 H1；之後的標題不可跳級
  html = html.replace(/<h([23])>(.*?)<\/h\1>/g, (m, l, t) => { const lv = Math.min(+l, last + 1); last = lv; return `<h${lv}>${t}</h${lv}>`; });
  html = html.replace(/<h2>(.*?)<\/h2>/g, (m, t) => { const id = 's' + (++n); toc.push([id, t.replace(/<[^>]+>/g, '')]); return `<h2 id="${id}">${t}</h2>`; });
  html = html.replace(/(?:<div class="day">[\s\S]*?<\/div>\n?){2,}/g, m => `<div class="days">${m.trim()}</div>\n`);
  return { html, toc };
}

// ---------- 版面 ----------
const NAV = [
  ['/', '首頁'],
  ...S.courses.map(c => [`/courses/${c.slug}/`, c.name]),
  ['/schedule/', '最新開課資訊'], ['/booking/', '預約說明會'], ['/teachers/', '授課講師介紹'], ['/courses/', '其他課程'], ['/news/', '最新消息'],
  ...CUSTOM.filter(c => c.type === 'page' && c.menu).map(c => [`/${c.slug}/`, (c.navLabel || c.title).slice(0, 12)]),
  ['label', '好書佳文分享'], ...S.categories.map(c => [`/articles/${c.slug}/`, c.name]),
  ['/about/', '關於我們'], ['/contact/', '聯絡我們']
];
const todayIso = new Date().toISOString().slice(0, 10);
const allSessions = S.schedule.groups.flatMap(g => g.items.map(i => ({ ...i, group: g.name }))).sort((a, b) => a.iso < b.iso ? -1 : 1);
const upcoming = n => allSessions.filter(s => s.iso >= todayIso).slice(0, n);
const dateBadge = iso => { const [, m, d] = iso.split('-'); return `<span class="dbadge"><b>${+d}</b><small>${+m} 月</small></span>`; };
const sessionRow = s => `<li data-iso="${s.iso}">${dateBadge(s.iso)}<span class="stx"><a href="${s.href || '/schedule/'}">${esc(s.kind)}</a><small>${esc(s.date)}・${esc(s.status)}</small></span></li>`;

const pagesIndex = []; // sitemap
function layout({ path: p, title, desc, body, ld = [], crumbs = [], cur = '', extraScript = '', noindex = false, wide = false }) {
  const nav = NAV.map(([h, t]) => h === 'label' ? `<li class="grp">${esc(t)}</li>` : `<li><a href="${h}"${h === p || h === cur ? ' aria-current="page"' : ''}>${esc(t)}</a></li>`).join('');
  const org = {
    '@context': 'https://schema.org', '@type': ['LocalBusiness', 'EducationalOrganization'], '@id': abs('/#org'),
    name: S.brandFull, alternateName: S.assoc, url: S.siteUrl, telephone: S.phone, email: S.email, image: abs(LOGO_SEAL || S.ogImage), ...(LOGO_SEAL ? { logo: abs(LOGO_SEAL) } : {}),
    address: { '@type': 'PostalAddress', addressCountry: S.addr.country, addressRegion: S.addr.region, addressLocality: S.addr.locality, streetAddress: S.addr.street },
    areaServed: S.addr.region, sameAs: [S.lineUrl],
    hasOfferCatalog: { '@type': 'OfferCatalog', name: '國際證照班', itemListElement: S.courses.map(c => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: c.name, url: abs(`/courses/${c.slug}/`) } })) }
  };
  const bc = crumbs.length ? [{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map(([h, t], i) => ({ '@type': 'ListItem', position: i + 1, name: t, item: h ? abs(h) : abs(p) })) }] : [];
  const jsonld = [org, ...bc, ...ld.filter(o => o['@type'] !== 'BreadcrumbList')].map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n');
  const quick = S.quick.map(q => `<a class="qt" href="${q.href}">${icon(q.icon)}<b>${esc(q.t)}</b><small>${esc(q.s)}</small></a>`).join('');
  const faviconHref = LOGO_SEAL || `data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 32 32%27%3E%3Crect width=%2732%27 height=%2732%27 rx=%277%27 fill=%27%231f5fa8%27/%3E%3Ctext x=%2716%27 y=%2723%27 font-size=%2720%27 text-anchor=%27middle%27 fill=%27white%27%3E永%3C/text%3E%3C/svg%3E`;
  const logos = (LOGO_SEAL || LOGO_YOGA) ? `<div class="logos">${LOGO_SEAL ? `<img src="${LOGO_SEAL}" alt="${esc(S.brandFull)}標誌" width="64" height="64">` : ''}${LOGO_YOGA ? `<img src="${LOGO_YOGA}" alt="${esc(S.assoc)}標誌（Love Yoga）" width="64" height="64">` : ''}</div>` : '';
  pagesIndex.push(p);
  return `<!doctype html>
<html lang="zh-Hant-TW"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${abs(p)}">
<meta name="robots" content="${noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large'}">
<meta property="og:type" content="website"><meta property="og:locale" content="zh_TW"><meta property="og:site_name" content="${esc(S.brand)}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${abs(p)}">
<meta property="og:image" content="${abs(S.ogImage)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${esc(S.brandFull)}"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${faviconHref}">
<link rel="stylesheet" href="/style.css">
${jsonld}
</head><body>
<div class="demo">${esc(S.demoNotice)}</div>
<div class="layout">
<aside class="left">
${logos}<a class="brand" href="/">${esc(S.brand)}</a><div class="tag">${esc(S.tagline)}</div>
<nav aria-label="主選單"><ul class="nav">${nav}</ul></nav>
<div class="cta-side">
<a class="btn primary" href="${S.phoneHref}" data-k="phoneBtn" data-prefix="電話 ">${icon('phone')}電話 ${esc(S.phone)}</a>
<a class="btn ghost" href="${S.lineUrl}" data-line>${icon('chat')}官方帳號 LINE</a>
</div>
</aside>
<main>
${crumbs.length ? `<nav class="crumb" aria-label="麵包屑">${crumbs.map(([h, t]) => h ? `<a href="${h}">${esc(t)}</a>` : `<span>${esc(t)}</span>`).join(' › ')}</nav>` : ''}
${body}
</main>
<aside class="right">
<section class="box soon"><h2>${icon('calendar')}最新開課</h2><ul class="soonlist" data-soon="4">${upcoming(4).map(sessionRow).join('')}</ul><a class="more-link" href="/schedule/">全部開課資訊 ${icon('arrow', 'sm')}</a></section>
<section class="quick" aria-label="快速入口">${quick}</section>
<section class="box"><h2>${icon('book')}最新消息</h2><ul data-news="3">${S.news.slice(0, 3).map(n => `<li><a href="${n.href}">${esc(n.title)}</a> <small>${n.date}</small></li>`).join('')}</ul><a class="more-link" href="/news/">更多消息 ${icon('arrow', 'sm')}</a></section>
<section class="box" id="contact"><h2>${icon('phone')}聯絡資訊</h2><p>電話：${k('phone', S.phone, 'a', ` href="${S.phoneHref}"`)}</p><p>地址：${k('address', S.address)}</p><p>LINE：${k('lineId', S.lineId)}</p><p>E-mail：<a href="mailto:${S.email}">${k('email', S.email)}</a></p></section>
</aside>
<footer>
<div class="fcols"><div><b>${esc(S.brandFull)}</b><p>${esc(S.assoc)}</p><p>${esc(S.address)}</p><p><a href="${S.phoneHref}">${esc(S.phone)}</a>・<a href="${S.phone2Href}">${esc(S.phone2)}</a></p></div>
<div><b>課程</b>${S.courses.map(c => `<a href="/courses/${c.slug}/">${esc(c.name)}</a>`).join('')}<a href="/courses/">其他課程</a><a href="/schedule/">最新開課資訊</a></div>
<div><b>資訊</b><a href="/about/">關於我們</a><a href="/teachers/">授課講師介紹</a><a href="/news/">最新消息</a><a href="/faq/four-in-one/">常見問答</a><a href="/contact/">聯絡我們</a></div></div>
<p class="legal">本站所有內容版權皆屬「${esc(S.brandFull)}」及「${esc(S.assoc)}」所有，未經授權不得轉載。<a href="/privacy/">隱私權政策</a>・<a href="/terms/">服務條款</a></p>
</footer>
</div>
<div class="float"><a class="btn primary" href="${S.phoneHref}" data-k="floatPhone">${icon('phone')}電話諮詢</a><a class="btn ghost" style="background:var(--bg)" href="${S.lineUrl}" data-line>${icon('chat')}官方帳號</a></div>
<dialog id="lineDlg"><h3>用手機掃描加入官方帳號</h3><img class="qrimg" src="/img/misc/line-qr-original.png" alt="LINE 官方帳號 ${esc(S.lineId)} QR Code" width="200" height="200"><p>${esc(S.lineId)}</p><form method="dialog"><button class="btn primary">關閉</button></form></dialog>
<dialog id="lb" aria-label="圖片檢視"><button class="lbx" aria-label="關閉">×</button><button class="lbp" aria-label="上一張">‹</button><img alt=""><button class="lbn" aria-label="下一張">›</button></dialog>
<script>window.LINE_URL=${JSON.stringify(S.lineUrl)}</script>
<script src="/app.js" defer></script>${extraScript}
</body></html>`;
}

const cta = (t = '想先了解適不適合？') => `<div class="band"><div><b>${esc(t)}</b><small>歡迎先聊聊你的學習背景與未來方向，不一定要報名。</small></div><a class="btn primary" href="${S.phoneHref}">${icon('phone')}電話諮詢</a><a class="btn ghost" href="${S.lineUrl}" data-line>${icon('chat')}官方帳號</a><a class="btn ghost" href="/booking/">${icon('calendar')}預約說明會</a></div>`;
const faqHtml = (items, open = false) => `<div class="faq">${items.map(([q, a]) => `<details${open ? ' open' : ''}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
const faqLd = items => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
const stripTags = h => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

// ---------- 首頁 ----------
const thumb = p => { const t = `/img/t/${path.basename(p).replace(/\.\w+$/, '')}-640.jpg`; return has(t) ? t : p; };
const slideImgs = ['/img/banner/20260904123025.jpg', '/img/banner/20260703203821.jpg', '/img/side/20200923225250.jpg'];
const slideAlt = ['四合一身心整合知識中心：NLP、瑜伽、芳療、經絡', '國際NLP教練認證課程全球菁英班：四大國際認證標章', '英國Ofqual官方高階證照'];
const slides = S.courses.map((c, i) => i === 0
  ? `<div class="slide on" aria-hidden="false"><div class="sl-txt"><span class="eyebrow">${esc(S.assoc)}</span><h1 data-k="heroTitle">${esc(S.heroTitle)}</h1><p data-k="heroSub">${esc(S.heroSub)}</p><div class="row"><a class="btn primary" href="/schedule/">${icon('calendar')}看開課資訊</a><a class="btn ghost" href="/booking/">預約說明會</a></div></div><div class="sl-img"><img data-photo="slide.1" src="${thumb(slideImgs[i])}" srcset="${thumb(slideImgs[i])} 640w, ${slideImgs[i]} 1489w" sizes="(max-width:860px) 90vw, 380px" alt="${esc(slideAlt[i])}" width="640" height="473" fetchpriority="high" decoding="async"></div></div>`
  : `<div class="slide" aria-hidden="true"><div class="sl-txt"><span class="badge">${esc(c.badge)}</span><h2 class="sl-h">${esc(c.name)}</h2><p>${esc(c.summary)}</p><div class="row"><a class="btn primary" href="/courses/${c.slug}/" tabindex="-1">了解課程</a><a class="btn ghost" href="/booking/" tabindex="-1">預約說明會</a></div></div><div class="sl-img"><img data-photo="slide.${i + 1}" src="${thumb(slideImgs[i])}" alt="${esc(slideAlt[i])}" width="640" height="480" loading="lazy" decoding="async"></div></div>`).join('');
const courseCards = S.courses.map(c => `<article class="card course"><img class="cimg" data-photo="course.${c.slug}" src="${thumb(c.img)}" alt="${esc(c.imgAlt)}" width="640" height="360" loading="lazy" decoding="async"><div class="cbody"><span class="badge">${esc(c.badge)}</span><h3><a href="/courses/${c.slug}/">${esc(c.name)}</a></h3>${k(`course.${c.slug}.summary`, c.summary, 'p')}<ul class="chips">${c.chips.map(x => `<li>${esc(x)}</li>`).join('')}</ul><a class="more" href="/courses/${c.slug}/">課程介紹與報名 ${icon('arrow', 'sm')}</a></div></article>`).join('');
const homeFaq = [...S.courses[0].faq.slice(0, 2), ...S.courses[1].faq.slice(0, 2)];
const t0 = S.teachersData?.[0];
write('index.html', layout({
  path: '/', title: `${S.brand}｜三大國際證照班：四合一國證班・NLP教練證照・TQUK/Ofqual高階班`,
  desc: `${S.assoc}（${S.brandFull}）提供四合一國際證照班、NLP教練證照班、TQUK／Ofqual高階班，小班教學，桃園實體與線上直播，歡迎電話或官方帳號諮詢。`,
  body: `<section class="carousel" aria-roledescription="carousel" aria-label="首頁主視覺"><div class="slides">${slides}</div><button class="cp" aria-label="上一張">‹</button><button class="cn" aria-label="下一張">›</button><div class="dots" role="group" aria-label="切換投影片"></div></section>
<ul class="stats">${S.stats.map(([a, b]) => `<li><b>${esc(a)}</b><span>${esc(b)}</span></li>`).join('')}</ul>
<h2 class="sec">三大證照班</h2><div class="cards">${courseCards}</div>
<h2 class="sec">最新開課</h2><ul class="sessions" id="homeSessions">${upcoming(4).map(s => `<li data-iso="${s.iso}">${dateBadge(s.iso)}<div><b>${esc(s.kind)}</b><small>${esc(s.group)}</small><div class="meta"><span class="pill ${s.status === '招生中' ? 'on' : ''}">${esc(s.status)}</span><span>${esc(s.mode)}</span>${s.size ? `<span>${esc(s.size)}</span>` : ''}</div></div><a class="btn ghost sm" href="${s.href || '/schedule/'}">詳情</a></li>`).join('')}</ul><p class="tc"><a class="btn primary" href="/schedule/">${icon('calendar')}查看全部開課資訊</a></p>
<h2 class="sec">為什麼選擇我們</h2><div class="why">${S.why.map(([t, d]) => `<div>${icon('check')}<b>${esc(t)}</b><p>${esc(d)}</p></div>`).join('')}</div>
<h2 class="sec">報名流程</h2><ol class="steps">${S.steps.map(([t, d], i) => `<li><i>${i + 1}</i><b>${esc(t)}</b><span>${esc(d)}</span></li>`).join('')}</ol>
<h2 class="sec">常見問題</h2><div data-k="faq" data-faq>${faqHtml(homeFaq)}</div>
<p class="tc"><a href="/faq/four-in-one/">更多：四合一常見問答</a>・<a href="/faq/nlp/">NLP 學習指南</a></p>
${cta('想先了解適不適合？')}
<form class="lead" id="leadForm"><h2 class="sec" style="margin-top:0">預約諮詢</h2>
<label>姓名<input name="name" required autocomplete="name"></label>
<label>電話<input name="phone" required inputmode="tel" autocomplete="tel"></label>
<label>想了解的班別<select name="course">${S.courses.map(c => `<option>${esc(c.name)}</option>`).join('')}<option>其他</option></select></label>
<label>留言<textarea name="msg" rows="3"></textarea></label>
<button class="btn primary" type="submit">送出</button><p class="ok" hidden>已收到，我們會盡快與您聯絡（示範模式：資料只存在這台瀏覽器）。</p></form>`,
  ld: [{ '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: S.courses.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, url: abs(`/courses/${c.slug}/`) })) }, faqLd(homeFaq)]
}));

// ---------- 三大證照班 ----------
for (const c of S.courses) {
  const p = `/courses/${c.slug}/`;
  const r = conv(c.src, `${c.name}：課程相關圖片`);
  const e = applyOv(`courses/${c.slug}`, { html: r.html, h1: c.h1, title: c.title, desc: c.desc }, '證照班', p, mdBlocks(c.src, `${c.name}：課程相關圖片`));
  const { html, toc } = prose(e.html);
  const facts = c.facts.map(([a, b], i) => `<div class="fact"><dt>${esc(a)}</dt><dd data-k="course.${c.slug}.fact.${i}">${esc(b)}</dd></div>`).join('');
  write(`courses/${c.slug}/index.html`, layout({
    path: p, title: e.title, desc: e.desc, crumbs: [['/', '首頁'], [null, c.name]],
    body: `<header class="chero"><div class="ctx"><span class="badge">${esc(c.badge)}</span><h1>${esc(e.h1)}</h1><p class="lead-p">${esc(c.summary)}</p><ul class="chips">${c.chips.map(x => `<li>${esc(x)}</li>`).join('')}</ul><div class="row"><a class="btn primary" href="${S.phoneHref}">${icon('phone')}電話諮詢</a><a class="btn ghost" href="${S.lineUrl}" data-line>${icon('chat')}官方帳號</a><a class="btn ghost" href="/booking/">${icon('calendar')}預約說明會</a></div></div><div class="cim"><img class="zoomable" data-photo="course.${c.slug}" src="${c.img}" alt="${esc(c.imgAlt)}" width="960" height="540"></div></header>
<dl class="facts">${facts}</dl>
${toc.length > 2 ? `<nav class="toc" aria-label="本頁目錄"><b>本頁目錄</b>${toc.slice(0, 12).map(([id, t]) => `<a href="#${id}">${esc(t.length > 20 ? t.slice(0, 20) + '…' : t)}</a>`).join('')}</nav>` : ''}
<div class="prose">${html}</div>
<h2 class="sec" id="faq">常見問題</h2>${faqHtml(c.faq, true)}
${cta()}`,
    ld: [
      { '@context': 'https://schema.org', '@type': 'Course', name: c.h1, description: c.desc, provider: { '@type': 'Organization', name: S.brandFull, url: S.siteUrl }, keywords: c.keywords.join(','), inLanguage: 'zh-TW' },
      { '@context': 'https://schema.org', '@type': 'Service', name: c.name, description: c.desc, serviceType: '國際證照課程', provider: { '@id': abs('/#org') }, areaServed: S.addr.region, url: abs(p) },
      faqLd(c.faq)
    ]
  }));
}

// ---------- 最新開課資訊 ----------
const modeOf = m => /線上|視訊|直播/.test(m) && /實體/.test(m) ? 'blended' : /線上|視訊|直播/.test(m) ? 'online' : 'onsite';
const gcards = S.schedule.groups.map(g => `<section class="sgroup"><header><h2>${esc(g.name)}</h2>${g.note ? `<p>${esc(g.note)}</p>` : ''}</header><ul class="sessions">${g.items.map(s => `<li data-iso="${s.iso}">${dateBadge(s.iso)}<div><b>${esc(s.kind)}</b><small>${esc(s.no)}・${esc(s.date)}</small><div class="meta"><span class="pill ${s.status === '招生中' ? 'on' : ''}">${esc(s.status)}</span><span>${esc(s.mode)}</span>${s.size ? `<span>${esc(s.size)}</span>` : ''}</div></div>${s.href ? `<a class="btn ghost sm" href="${s.href}">詳情</a>` : `<a class="btn ghost sm" href="${S.lineUrl}" data-line>洽詢</a>`}</li>`).join('')}</ul></section>`).join('');
const sched = S.schedule;
write('schedule/index.html', layout({
  path: '/schedule/', title: `最新開課資訊｜四合一・NLP教練・TQUK/Ofqual高階班 開課日期與名額｜${S.brand}`,
  desc: `${S.assoc}最新開課資訊：四合一國際證照班、NLP教練證照班、TQUK／Ofqual高階班與專班的開課日期、上課方式、小班名額與上課地點。`, crumbs: [['/', '首頁'], [null, '最新開課資訊']],
  body: `<header class="phead"><h1>最新開課資訊</h1><p>各班別開課日期、上課方式與名額。小班教學，額滿不收；開課日期以官方公告為準，歡迎先來電或加入官方帳號詢問。</p></header>
<div id="schedGroups">${gcards}</div>
<h2 class="sec">${icon('clock')}上課時間與地點</h2><p><b>上課時間：</b>${esc(sched.time)}</p>
<div class="centers">${sched.centers.map(c => `<div class="center">${icon('map')}<b>${esc(c.name)}</b><p>${esc(c.addr)}</p><small>${esc(c.note)}</small></div>`).join('')}</div>
<h2 class="sec">${icon('award')}英國 TQUK 2025 卓越獎</h2><p>本中心獲頒 2025 年【英國 TQUK 資歷培訓機構】卓越獎：榮譽中心獎、榮譽導師獎、卓越學員獎。</p>
<div class="awards">${sched.awards.map(a => `<img class="zoomable" src="${a}" alt="英國 TQUK Excellence Awards 2025" loading="lazy" width="1600" height="533">`).join('')}</div>
${cta('想了解哪一班適合你？')}`,
  ld: S.schedule.groups.filter(g => g.course).map(g => { const c = S.courses.find(x => x.slug === g.course); return { '@context': 'https://schema.org', '@type': 'Course', name: c.h1, description: c.desc, provider: { '@id': abs('/#org') }, hasCourseInstance: g.items.map(s => ({ '@type': 'CourseInstance', name: `${s.kind}（${s.date}開課）`, startDate: s.iso, courseMode: modeOf(s.mode), location: { '@type': 'Place', name: S.assoc, address: S.address } })) }; })
}));

// ---------- 授課講師介紹 ----------
function parseTeachers() {
  const lines = fs.readFileSync('source/pages/page_26.html.md', 'utf8').split('\n').map(l => l.trim());
  const out = []; let cur = null, mode = '';
  for (const l of lines) {
    if (!l) continue;
    let m = l.match(/^姓名[:：]\s*(.*)$/); if (m) { cur = { name: m[1], creds: [], certs: [] }; out.push(cur); mode = ''; continue; }
    if (!cur) continue;
    if (/^資歷[:：]/.test(l)) { mode = 'creds'; continue; }
    if (/^證照[:：]/.test(l)) { mode = 'certs'; continue; }
    if (mode) cur[mode].push(l.replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&#33304;/g, '館'));
  }
  return out;
}
const teachers = parseTeachers();
const tcards = teachers.map((t, i) => {
  const [first, ...rest] = t.name.split(/\s*暨\s*/); const nm = first.trim(); const role = rest.join('、');
  const base = nm.replace(/\s*(教練|老師)\s*$/, ''); const mono = /^[A-Za-z]/.test(base) ? base[0].toUpperCase() : base.slice(0, 2);
  return `<article class="teacher"><header><span class="avatar" aria-hidden="true">${esc(mono)}</span><div><h2>${esc(nm)}</h2>${role ? `<p>${esc(role)}</p>` : ''}${i === 0 ? '<small>創辦人・首席講師：劉台斌老師</small>' : ''}</div></header>
<div class="tcols"><section><h3>${icon('user')}資歷</h3><ul class="tl">${t.creds.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section><section><h3>${icon('award')}證照</h3><ul class="certs">${t.certs.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section></div></article>`;
}).join('');
write('teachers/index.html', layout({
  path: '/teachers/', title: `授課講師介紹｜Robin 教練與國際認證專業師資群｜${S.brand}`,
  desc: `${S.assoc}授課講師介紹：Robin 教練（劉台斌老師）、菁菁老師與國際認證專業師資群的資歷與國際證照。`, crumbs: [['/', '首頁'], [null, '授課講師介紹']],
  body: `<header class="phead"><h1>授課講師介紹</h1><p>專業講師群的現職資歷與持有的國際證照。照片與細節將由講師本人提供並同意後放上。</p></header>${tcards}${cta('想認識授課老師？')}`,
  ld: teachers.map(t => ({ '@context': 'https://schema.org', '@type': 'Person', name: t.name.split(/\s*暨\s*/)[0].trim(), worksFor: { '@id': abs('/#org') }, jobTitle: t.creds[0] || '講師', hasCredential: t.certs.slice(0, 12).map(x => ({ '@type': 'EducationalOccupationalCredential', name: x })) }))
}));

// ---------- 其他內容頁 ----------
const parentOf = p => p.group === 'schedule' ? ['/schedule/', '最新開課資訊'] : p.group === 'more' ? (p.parent ? ['/courses/', '其他課程'] : ['/courses/', '其他課程']) : null;
for (const pg of S.pages) {
  const p = `/${pg.slug}/`;
  const r = conv(pg.src, `${pg.h1}：相關圖片`);
  const e = applyOv(pg.slug, { html: r.html, h1: pg.h1, title: pg.title, desc: pg.desc }, pg.group === 'more' ? '課程頁' : pg.group === 'schedule' ? '開課頁' : '資訊頁', p, mdBlocks(pg.src, `${pg.h1}：相關圖片`));
  const { html, toc } = prose(e.html);
  const par = parentOf(pg);
  const crumbs = [['/', '首頁'], ...(par ? [par] : []), [null, e.h1.length > 24 ? e.h1.slice(0, 24) + '…' : e.h1]];
  const cur = pg.group === 'schedule' ? '/schedule/' : pg.group === 'more' ? '/courses/' : pg.slug.startsWith('about') ? '/about/' : '';
  write(`${pg.slug}/index.html`, layout({
    path: p, cur, title: e.title, desc: e.desc, crumbs,
    body: `<header class="phead"><span class="badge">${icon(pg.icon)}${esc(par ? par[1] : '永真樂活')}</span><h1>${esc(e.h1)}</h1></header>
${toc.length > 3 ? `<nav class="toc" aria-label="本頁目錄"><b>本頁目錄</b>${toc.slice(0, 10).map(([id, t]) => `<a href="#${id}">${esc(t.length > 20 ? t.slice(0, 20) + '…' : t)}</a>`).join('')}</nav>` : ''}
<div class="prose">${html}</div>${cta()}`,
    ld: [...(e.faq.length ? [faqLd(e.faq)] : []), pg.group === 'more'
      ? { '@context': 'https://schema.org', '@type': 'Course', name: pg.h1, description: pg.desc, provider: { '@type': 'Organization', name: S.brandFull, url: S.siteUrl }, inLanguage: 'zh-TW' }
      : { '@context': 'https://schema.org', '@type': pg.slug === 'about' ? 'AboutPage' : 'WebPage', name: pg.h1, description: pg.desc, url: abs(p), isPartOf: { '@id': abs('/#org') } }]
  }));
  pg._text = r.text;
}
// FAQ 頁
for (const f of S.faqPages) {
  const p = `/${f.slug}/`;
  const items = parseFaq(fs.readFileSync(`source/pages/${f.src}`, 'utf8'), { links: mapLink, linkLabel, images: IMAGES, alt: f.h1, drop: DROP });
  let last = ''; const body = items.map(it => { const head = it.section && it.section !== last ? `<h2 class="sec">${esc(it.section)}</h2>` : ''; last = it.section; return `${head}<details class="qa"><summary>${esc(it.q)}</summary><div class="prose">${it.a}</div></details>`; }).join('');
  write(`${f.slug}/index.html`, layout({
    path: p, title: f.title, desc: f.desc, crumbs: [['/', '首頁'], [null, f.h1]],
    body: `<header class="phead"><span class="badge">${icon('help')}常見問答</span><h1>${esc(f.h1)}</h1><p>${esc(f.lead)}</p></header><div class="faq">${body}</div>${cta('看完還有疑問？')}`,
    ld: [faqLd(items.map(it => [it.q, stripTags(it.a)]))]
  }));
}
// 好書佳文六系列
for (const c of S.categories) {
  const p = `/articles/${c.slug}/`;
  const r = conv(c.src, `${c.name}：文章配圖`);
  const e = applyOv(`articles/${c.slug}`, { html: r.html, h1: c.name, title: `${c.name}｜好書佳文分享｜${S.brand}`, desc: c.desc.length >= 30 ? c.desc : `${c.desc}（${S.assoc}好書佳文分享）` }, '好書佳文', p, mdBlocks(c.src, `${c.name}：文章配圖`));
  const { html, toc } = prose(e.html);
  write(`articles/${c.slug}/index.html`, layout({
    path: p, title: e.title, desc: e.desc, crumbs: [['/', '首頁'], ['/articles/', '好書佳文分享'], [null, c.name]],
    body: `<header class="phead"><span class="badge">${icon('book')}好書佳文分享</span><h1>${esc(e.h1)}</h1></header>${toc.length > 3 ? `<nav class="toc" aria-label="本頁目錄"><b>本頁目錄</b>${toc.slice(0, 10).map(([id, t]) => `<a href="#${id}">${esc(t.length > 20 ? t.slice(0, 20) + '…' : t)}</a>`).join('')}</nav>` : ''}<div class="prose">${html}</div>${cta('喜歡這些文章？')}`,
    ld: [{ '@context': 'https://schema.org', '@type': 'Article', headline: c.name, description: c.desc, author: { '@type': 'Organization', name: S.brandFull }, publisher: { '@id': abs('/#org') }, image: abs(S.ogImage), mainEntityOfPage: abs(p), inLanguage: 'zh-TW' }]
  }));
}
write('articles/index.html', layout({
  path: '/articles/', title: `好書佳文分享｜${S.brand}`, desc: `${S.assoc}的好書佳文分享：${S.categories.map(c => c.name).join('、')}。`, crumbs: [['/', '首頁'], [null, '好書佳文分享']],
  body: `<header class="phead"><h1>好書佳文分享</h1><p>六個系列都可以直接從左側選單進入。</p></header><div class="cards">${S.categories.map(c => `<article class="card"><span class="badge">${icon('book')}系列</span><h2><a href="/articles/${c.slug}/">${esc(c.name)}</a></h2><p>${esc(c.desc)}</p></article>`).join('')}</div>`
}));
// 其他課程總覽
const moreCards = grp => S.pages.filter(x => x.group === 'more' && !!x.parent === grp).map(x => `<article class="card"><span class="badge">${icon(x.icon)}${esc(x.parent || '課程')}</span><h2><a href="/${x.slug}/">${esc(x.h1)}</a></h2><p>${esc(x.desc)}</p></article>`).join('');
write('courses/index.html', layout({
  path: '/courses/', title: `全部課程｜證照班、瑜珈師資、芳療與中醫經絡｜${S.brand}`, desc: `${S.assoc}全部課程：三大國際證照班，以及瑜珈師資、芳療證照、中醫經絡理療、國際認證課程。`, crumbs: [['/', '首頁'], [null, '全部課程']],
  body: `<header class="phead"><h1>全部課程</h1><p>主力是三大國際證照班；也提供單科的瑜珈、芳療、經絡與國際認證課程。</p></header>
<h2 class="sec">三大國際證照班</h2><div class="cards">${courseCards}</div>
<h2 class="sec">其他課程</h2><div class="cards">${moreCards(false)}</div>
<h2 class="sec">國際認證課程</h2><div class="cards">${moreCards(true)}</div>${cta()}`
}));

// ---------- 最新消息 ----------
const fit = (t, n) => t.length > n ? t.slice(0, n - 1) + '…' : t;
const plainDesc = (html, fallback) => { const t = stripTags(html.replace(/<h[23][^>]*>.*?<\/h[23]>/g, ' ')).replace(/\s+/g, ' '); return t.length >= 40 ? fit(t, 110) : fallback; };
for (const n of NEWS) {
  const raw = fs.readFileSync(`source/pages/${n.src}`, 'utf8');
  // 檔頭到「首頁 > 最新消息」麵包屑與文章標題行之前不要
  const ls = raw.replace(/\r/g, '').split('\n');
  const bi = ls.findIndex(l => /首頁\s*>\s*最新消息/.test(l));
  let j = bi + 1; while (j < ls.length && !ls[j].trim()) j++; j++; // 略過標題行
  let body = ls.slice(j);
  // 第一個「# 標題」當作文章 H1
  const hi = body.findIndex(l => /^#\s*\S/.test(l)); let h1 = '';
  if (hi >= 0 && hi < 6) { h1 = body[hi].replace(/^#\s*/, '').trim(); body.splice(hi, 1); }
  const r = convert('H2:\n\n' + body.join('\n'), { links: mapLink, linkLabel, images: IMAGES, alt: `${h1 || n.title}：文章配圖`, drop: DROP });
  const t1 = h1 || n.title, p = `/news/${n.id}/`;
  const d1 = plainDesc(r.html, `${fit(t1, 40)}：${S.assoc}最新消息，選課指南與國際證照解析。`);
  const e = applyOv(`news/${n.id}`, { html: r.html, h1: t1, title: `${fit(t1, 46)}｜最新消息｜${S.brand}`, desc: d1 }, '最新消息', p, convertBlocks('H2:\n\n' + body.join('\n'), { links: mapLink, linkLabel, images: IMAGES, alt: `${t1}：文章配圖`, drop: DROP }));
  const { html, toc } = prose(e.html);
  const title1 = e.h1;
  n.h1 = title1; n.html = html; n.toc = toc; n.text = r.text; n.img = r.images[0]; n.desc = e.desc;
  write(`news/${n.id}/index.html`, layout({
    path: p, cur: '/news/', title: e.title, desc: e.desc, crumbs: [['/', '首頁'], ['/news/', '最新消息'], [null, fit(title1, 22)]],
    body: `<article><header class="phead">${n.date ? `<time datetime="${n.date}">${n.date}</time>` : ''}<h1>${esc(title1)}</h1>${n.title !== title1 ? `<p>${esc(n.title)}</p>` : ''}</header>
${toc.length > 3 ? `<nav class="toc" aria-label="本文目錄"><b>本文目錄</b>${toc.slice(0, 10).map(([id, t]) => `<a href="#${id}">${esc(fit(t, 20))}</a>`).join('')}</nav>` : ''}<div class="prose">${html}</div></article>${cta('想進一步了解？')}`,
    ld: [{ '@context': 'https://schema.org', '@type': 'Article', headline: fit(title1, 110), description: n.desc, ...(n.date ? { datePublished: n.date, dateModified: n.date } : {}), author: { '@type': 'Organization', name: S.brandFull }, publisher: { '@id': abs('/#org') }, image: abs(n.img || S.ogImage), mainEntityOfPage: abs(p), inLanguage: 'zh-TW' }]
  }));
}
write('news/index.html', layout({
  path: '/news/', title: `最新消息｜選課指南與國際證照解析｜${S.brand}`, desc: `${S.assoc}最新消息：選課指南、國際證照解析、第二專長與身心整合學習文章，以及開課公告與說明會資訊。`, crumbs: [['/', '首頁'], [null, '最新消息']],
  body: `<header class="phead"><h1>最新消息</h1><p>選課指南、證照解析、說明會與開課公告，共 ${NEWS_ALL.length} 篇。</p></header><div id="newsList" data-news="all">${NEWS_ALL.map(n => `<article class="news-item" id="n${n.id}"><time datetime="${n.date}">${n.date || '　'}</time><h2><a href="/news/${n.id}/">${esc(n.title)}</a></h2></article>`).join('')}</div>`
}));

// ---------- 後台新增的頁面與文章（發布檔 custom）----------
for (const c of CUSTOM) {
  const isArt = c.type === 'article', p = isArt ? `/news/${c.slug}/` : `/${c.slug}/`;
  if (pagesIndex.includes(p) || (isArt && NEWS_META[c.slug])) { console.warn('自訂頁網址重複，略過：', p); continue; }
  const rr = Y.render(c.blocks || [], RENDER_OPTS), { html, toc } = prose(rr.html);
  let desc = (c.seoDesc || '').trim() || Y.firstText(c.blocks, 110) || c.title; if (desc.length < 30) desc = `${desc}｜${S.brandFull}・${S.assoc}`;
  const title = (c.seoTitle || '').trim() || `${fit(c.title, 40)}｜${S.brand}`;
  const hero = c.image && Y.okImg(c.image) ? `<figure><img class="zoomable" src="${esc(c.image)}" alt="${esc(c.title)}" width="1200" height="630"></figure>` : '';
  const crumbs = isArt ? [['/', '首頁'], ['/news/', '最新消息'], [null, fit(c.title, 22)]] : [['/', '首頁'], [null, fit(c.title, 24)]];
  write(`${isArt ? 'news/' : ''}${c.slug}/index.html`, layout({
    path: p, cur: isArt ? '/news/' : '', title, desc, crumbs,
    body: `<article><header class="phead"><span class="badge">${icon(isArt ? 'book' : 'building')}${isArt ? '最新消息' : esc(S.assoc)}</span>${isArt && c.date ? `<time datetime="${esc(c.date)}"> ${esc(c.date)}</time>` : ''}<h1>${esc(c.title)}</h1></header>${hero}${toc.length > 3 ? `<nav class="toc" aria-label="本頁目錄"><b>本頁目錄</b>${toc.slice(0, 10).map(([id, t]) => `<a href="#${id}">${esc(fit(t, 20))}</a>`).join('')}</nav>` : ''}<div class="prose">${html}</div></article>${cta()}`,
    ld: [{ '@context': 'https://schema.org', '@type': isArt ? 'Article' : 'WebPage', ...(isArt ? { headline: fit(c.title, 110), ...(c.date ? { datePublished: c.date, dateModified: c.date } : {}), author: { '@type': 'Organization', name: S.brandFull }, publisher: { '@id': abs('/#org') }, image: abs(c.image && Y.okImg(c.image) && !c.image.startsWith('data:') ? c.image : S.ogImage) } : { name: c.title, isPartOf: { '@id': abs('/#org') } }), description: desc, url: abs(p), mainEntityOfPage: abs(p), inLanguage: 'zh-TW' }, ...(rr.faq.length ? [faqLd(rr.faq)] : [])]
  }));
}

// ---------- 聯絡我們 ----------
write('contact/index.html', layout({
  path: '/contact/', title: `聯絡我們｜電話、LINE 官方帳號與桃園中心地址｜${S.brand}`, desc: `聯絡${S.brandFull}：電話 ${S.phone}、LINE 官方帳號 ${S.lineId}、E-mail 與桃園市桃園區中山路549號15樓中心地址。`, crumbs: [['/', '首頁'], [null, '聯絡我們']],
  body: `<header class="phead"><h1>聯絡我們</h1><p>若您有任何疑問或建議，歡迎利用以下方式與我們聯絡，我們收到訊息後會儘快回覆。想做好課程評估的同學，也歡迎先加入 LINE，由劉老師說明辦學理念與獨特價值。</p></header>
<div class="ccards">
<div class="cc">${icon('phone')}<b>諮詢專線</b><a href="${S.phoneHref}">${esc(S.phone)}（台灣大哥大）</a><a href="${S.phone2Href}">${esc(S.phone2)}（中華電信）</a><small>劉老師</small></div>
<div class="cc">${icon('chat')}<b>LINE 官方帳號</b><a href="${S.lineUrl}" data-line>${esc(S.lineId)}</a><small>劉老師 LINE ID：120196250</small></div>
<div class="cc">${icon('mail')}<b>E-mail</b><a href="mailto:${S.email}">${esc(S.email)}</a></div>
<div class="cc">${icon('map')}<b>中心地址</b><span>${esc(S.address)}</span><small>${esc(S.addrNote)}</small><a href="${S.mapUrl}" target="_blank" rel="noopener">開啟 Google 地圖</a></div></div>
<form class="lead" id="contactForm"><h2 class="sec" style="margin-top:0">給我們建議</h2>
<label>姓名<input name="name" required autocomplete="name"></label>
<label>E-mail<input name="email" type="email" required autocomplete="email"></label>
<label>電話<input name="phone" required inputmode="tel" autocomplete="tel"></label>
<label>所在地區<input name="area" required></label>
<label>給我們建議<textarea name="msg" rows="4" required></textarea></label>
<button class="btn primary" type="submit">送出</button><p class="ok" hidden>已收到，我們會盡快回覆（示範模式：資料只存在這台瀏覽器）。</p></form>
<p class="note-line">${esc(S.brandFull)}｜${esc(S.assoc)}｜英國 Ofqual／TQUK／IPHM 暨美國 iNLP 授權國際認證中心</p>`,
  ld: [{ '@context': 'https://schema.org', '@type': 'ContactPage', name: '聯絡我們', url: abs('/contact/'), mainEntity: { '@id': abs('/#org') } }]
}));

// ---------- 預約說明會（場次預約） ----------
write('booking/index.html', layout({
  path: '/booking/', title: `預約說明會／試聽場次｜${S.brand}`, desc: `線上預約${S.assoc}的證照班說明會與試聽場次，查看日期、時段與剩餘名額。`, crumbs: [['/', '首頁'], [null, '預約說明會']],
  body: `<header class="phead"><h1>預約說明會／試聽場次</h1><p>選擇想參加的場次，留下聯絡方式即可預約。名額有限，額滿請改以電話或官方帳號洽詢。</p></header>
<div id="slots" class="slots" aria-live="polite"><p>載入場次中…（若沒有顯示，請直接<a href="${S.phoneHref}">來電</a>預約）</p></div>
<form class="lead" id="bookForm" hidden><h2 class="sec" style="margin-top:0">填寫預約資料</h2><p id="picked" class="ok"></p>
<label>姓名<input name="name" required autocomplete="name"></label>
<label>電話<input name="phone" required inputmode="tel" autocomplete="tel"></label>
<label>備註<textarea name="note" rows="2"></textarea></label>
<button class="btn primary" type="submit">確認預約</button><p class="ok" id="bookOk" hidden>預約成功！我們會再與您確認（示範模式：資料只存在這台瀏覽器）。</p><p id="bookErr" style="color:#b3261e;margin:0" hidden></p></form>`,
  extraScript: `\n<script src="/shared.js" defer></script><script>window.SITE_COURSES=${JSON.stringify(S.courses.map(c => ({ name: c.name })))}</script><script src="/booking.js" defer></script>`
}));

// ---------- 隱私權／服務條款 ----------
const draftNote = `<p class="draft">本頁為基本版草稿，正式內容請由${esc(S.brandFull)}確認，必要時請法務人員檢視。</p>`;
write('privacy/index.html', layout({
  path: '/privacy/', title: `隱私權政策｜${S.brand}`, desc: `${S.brandFull}隱私權政策：個人資料的蒐集、處理、利用與當事人權利。`, crumbs: [['/', '首頁'], [null, '隱私權政策']],
  body: `<h1>隱私權政策</h1>${draftNote}
<h2>一、蒐集目的與類別</h2><p>為提供課程諮詢、說明會預約、報名聯繫與課務通知，本網站會蒐集您主動填寫的姓名、電話、電子郵件、所在地區、留言與預約內容。</p>
<h2>二、利用期間、地區、對象與方式</h2><p>資料僅在前述目的之必要期間內，於中華民國境內，由${esc(S.brandFull)}及${esc(S.assoc)}以電話、訊息或電子郵件方式聯繫與利用，不會任意提供給第三人，法律另有規定者除外。</p>
<h2>三、當事人權利</h2><p>依個人資料保護法，您得就個人資料請求查詢或閱覽、製給複製本、補充或更正、停止蒐集處理或利用，以及刪除。請以下列方式聯絡我們：電話 ${esc(S.phone)}、電子郵件 ${esc(S.email)}。</p>
<h2>四、不提供資料的影響</h2><p>您可以選擇不提供個人資料，但可能無法完成預約或獲得後續聯繫。</p>
<h2>五、網站使用紀錄與外部服務</h2><p>本網站可能使用網站分析工具（如 Google Analytics）統計瀏覽狀況，此類資料不用於識別個人。網站可能連結至第三方（如 LINE、Facebook、YouTube），其隱私權作法不適用本政策。</p>
<h2>六、未成年人</h2><p>未成年人預約或報名，請由法定代理人同意與陪同。</p>
<h2>七、政策修訂</h2><p>本政策得隨法令或服務調整而修訂，修訂後公布於本頁。</p>`
}));
write('terms/index.html', layout({
  path: '/terms/', title: `服務條款｜${S.brand}`, desc: `${S.brandFull}網站服務條款：內容著作權、課程資訊、預約與免責說明。`, crumbs: [['/', '首頁'], [null, '服務條款']],
  body: `<h1>服務條款</h1>${draftNote}
<h2>一、著作權</h2><p>本網站所有內容（文字、圖片、影片、版面）之權利屬${esc(S.brandFull)}及${esc(S.assoc)}所有，未經授權不得轉載、重製或作商業使用。</p>
<h2>二、課程與資訊</h2><p>課程內容、開班日期、費用與師資以現場公告或客服確認為準，網站資訊可能隨時調整。證照之名稱與認證範圍，以發證單位公告為準；國際證書的實際用途，仍應依各國法規、雇主、學校、專業協會或接收機構之要求確認。</p>
<h2>三、預約、報名與取消</h2><p>預約說明會或試聽不代表完成課程報名。報名以完成繳費程序並確立席位為準。TQUK／Ofqual 高階班之退費規則：開課前退還已繳學費七成；開課後未逾全期 1/4 退還一半；已逾 1/4 恕不退費。其他班別之退費與改期規則：【待客戶提供】。</p>
<h2>四、使用者責任</h2><p>請提供正確的聯絡資料，並不得利用本網站從事違法、侵害他人權益或干擾網站運作之行為。</p>
<h2>五、免責聲明</h2><p>本網站內容供課程介紹與一般資訊參考，不提供疾病診斷，也不取代醫療診斷、藥物治療、復健、心理治療或其他專業醫療服務；個人學習成果因人而異。</p>
<h2>六、準據法與管轄</h2><p>本條款以中華民國法律為準據法，如有爭議，以【待客戶提供】地方法院為第一審管轄法院。</p>`
}));

write('404.html', layout({ noindex: true, path: '/404', title: `找不到頁面｜${S.brand}`, desc: '找不到頁面', body: '<h1>找不到這個頁面</h1><p>這個網址可能已經更新。請<a href="/">回首頁</a>，或從左側選單選擇課程。</p>' }));

// ---------- 靜態檔、SEO 檔 ----------
for (const f of ['style.css', 'app.js', 'shared.js', 'blocks.js', 'booking.js', 'admin.css', 'admin.js']) fs.copyFileSync(`src/${f}`, `${OUT}/${f}`);
write('admin/index.html', fs.readFileSync('src/admin.html', 'utf8').replace('/*SITE_JSON*/null', JSON.stringify({ brand: S.brand, courses: S.courses.map(c => ({ slug: c.slug, name: c.name, summary: c.summary, facts: c.facts })), schedule: S.schedule, heroTitle: S.heroTitle, heroSub: S.heroSub, phone: S.phone, address: S.address, hours: S.hours, lineId: S.lineId, email: S.email, faq: S.courses[0].faq.slice(0, 2).concat(S.courses[1].faq.slice(0, 2)) })));
fs.copyFileSync('src/og.png', `${OUT}/og.png`);
write('admin/pages.json', JSON.stringify(EDITABLE));
const urls = [...new Set(pagesIndex.filter(u => u !== '/404'))].sort();
const today = new Date().toISOString().slice(0, 10);
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `<url><loc>${abs(u)}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`);
const AI_BOTS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'Google-Extended', 'PerplexityBot', 'ClaudeBot', 'Claude-SearchBot', 'anthropic-ai', 'Applebot-Extended', 'CCBot'];
const blocked = new Set(S.aiBlock || []);
write('robots.txt', `# 一般搜尋引擎與 AI 搜尋／生成式引擎皆可擷取公開頁面；甲方得於 src/site.json 的 aiBlock 指定排除\nUser-agent: *\nAllow: /\nDisallow: /admin\n\n${AI_BOTS.map(b => `User-agent: ${b}\n${blocked.has(b) ? 'Disallow: /' : 'Allow: /\nDisallow: /admin'}\n`).join('\n')}\nSitemap: ${abs('/sitemap.xml')}\n`);
write('_headers', `/admin/*\n  X-Robots-Tag: noindex, nofollow\n  Cache-Control: no-store\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: SAMEORIGIN\n/*.css\n  Cache-Control: public, max-age=3600\n/*.js\n  Cache-Control: public, max-age=3600\n/img/*\n  Cache-Control: public, max-age=86400\n`);
write('llms.txt', `# ${S.brandFull}\n\n> ${S.tagline}。${S.heroSub}\n\n## 三大國際證照班\n${S.courses.map(c => `- [${c.name}](${abs(`/courses/${c.slug}/`)}): ${c.desc}`).join('\n')}\n\n## 開課與資訊\n- [最新開課資訊](${abs('/schedule/')})\n- [授課講師介紹](${abs('/teachers/')})\n- [關於我們](${abs('/about/')})\n- [四合一常見問答](${abs('/faq/four-in-one/')})\n- [NLP 學習指南](${abs('/faq/nlp/')})\n\n## 好書佳文分享\n${S.categories.map(c => `- [${c.name}](${abs(`/articles/${c.slug}/`)})`).join('\n')}\n${CUSTOM.length ? `\n## 其他頁面與文章\n${CUSTOM.map(c => `- [${c.title}](${abs(c.type === 'article' ? `/news/${c.slug}/` : `/${c.slug}/`)})`).join('\n')}\n` : ''}`);
// 301：舊網址 → 新網址（Cloudflare Pages）
const redirects = [...MAP.entries()].filter(([f]) => !['index.html'].includes(f) || true).map(([f, to]) => `/${f} ${to} 301`);
const srcFiles = fs.readdirSync('source/pages').map(f => f.replace(/\.md$/, ''));
for (const f of srcFiles) { if (MAP.has(f)) continue; redirects.push(`/${f} ${/^content_/.test(f) || /^page_/.test(f) ? '/news/' : '/'} 301`); }
write('_redirects', `# 舊站 301 轉址（Cloudflare Pages）\n${[...new Set(redirects)].join('\n')}\n/index.php / 301\n`);
console.log('built', urls.length, 'pages');

import fs from 'node:fs';
import path from 'node:path';
const S = JSON.parse(fs.readFileSync('src/site.json', 'utf8'));
const OUT = 'dist';
fs.rmSync(OUT, { recursive: true, force: true });
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const write = (p, c) => { const f = path.join(OUT, p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, c); };
const abs = p => S.siteUrl + p;

const navItems = [
  ['/', '首頁'],
  ...S.courses.map(c => [`/courses/${c.slug}/`, c.name]),
  ['/articles/', '好書佳文分享'],
  ['/#contact', '聯絡我們']
];

function layout({ path: p, title, desc, h1, body, ld = [], crumbs = [] }) {
  const nav = navItems.map(([h, t]) =>
    `<li><a href="${h}"${h === p ? ' aria-current="page"' : ''}>${esc(t)}</a></li>`).join('');
  const org = {
    '@context': 'https://schema.org', '@type': ['LocalBusiness', 'EducationalOrganization'],
    name: S.brandFull, url: S.siteUrl, telephone: S.phone, address: S.address,
    openingHours: S.hours, sameAs: [S.lineUrl]
  };
  const jsonld = [org, ...ld].map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n');
  return `<!doctype html>
<html lang="zh-Hant-TW"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${abs(p)}">
<meta property="og:type" content="website"><meta property="og:locale" content="zh_TW">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${abs(p)}">
<link rel="stylesheet" href="/style.css">
${jsonld}
</head><body>
<div class="demo">${esc(S.demoNotice)}</div>
<div class="layout">
<aside class="left">
<a class="brand" href="/">${esc(S.brand)}</a><div class="tag">${esc(S.tagline)}</div>
<nav aria-label="主選單"><ul class="nav">${nav}</ul></nav>
<div class="cta-side">
<a class="btn primary" href="${S.phoneHref}">電話 ${esc(S.phone)}</a>
<a class="btn ghost" href="${S.lineUrl}" data-line>官方帳號 LINE</a>
</div>
</aside>
<main>
${crumbs.length ? `<div class="crumb">${crumbs.map(([h, t]) => h ? `<a href="${h}">${esc(t)}</a>` : esc(t)).join(' › ')}</div>` : ''}
${body}
</main>
<aside class="right">
<div class="box"><h2>最新消息</h2><ul>${S.news.map(n => `<li>${esc(n)}</li>`).join('')}</ul></div>
<div class="box" id="contact"><h2>聯絡資訊</h2><p>電話：<a href="${S.phoneHref}">${esc(S.phone)}</a></p><p>地址：${esc(S.address)}</p><p>時間：${esc(S.hours)}</p><p>LINE：${esc(S.lineId)}</p></div>
<div class="box"><h2>好書佳文</h2><ul>${S.articles.map(a => `<li><a href="/articles/${a.slug}/">${esc(a.title)}</a></li>`).join('')}</ul></div>
</aside>
<footer>© ${esc(S.brandFull)}</footer>
</div>
<div class="float"><a class="btn primary" href="${S.phoneHref}">電話諮詢</a><a class="btn ghost" style="background:var(--bg)" href="${S.lineUrl}" data-line>官方帳號</a></div>
<dialog id="lineDlg"><h3>用手機掃描加入官方帳號</h3><div class="qr">LINE QR（待客戶提供）</div><p>${esc(S.lineId)}</p><form method="dialog"><button class="btn primary">關閉</button></form></dialog>
<script src="/app.js" defer></script>
</body></html>`;
}

// Home
const cards = S.courses.map(c => `<article class="card"><h3><a href="/courses/${c.slug}/">${esc(c.name)}</a></h3><p>${esc(c.summary)}</p><a class="more" href="/courses/${c.slug}/">看課程與報名 →</a></article>`).join('');
const homeFaq = S.courses.flatMap(c => c.faq).slice(0, 3);
write('index.html', layout({
  path: '/', title: `${S.brand}｜三大瑜珈教師證照班`,
  desc: `${S.brand}提供三大瑜珈教師證照班，小班制教學、結業認證，歡迎電話或官方帳號諮詢。`,
  body: `<section class="hero"><h1>三大證照班，找到適合你的瑜珈專業之路</h1><p>${esc(S.brand)}提供三種證照班別，依你的程度與目標選擇，開班資訊歡迎洽詢。</p>
<div class="row"><a class="btn primary" href="${S.phoneHref}">電話諮詢</a><a class="btn ghost" href="${S.lineUrl}" data-line>加入官方帳號</a></div></section>
<h2>三大證照班</h2><div class="cards">${cards}</div>
<h2>常見問題</h2><div class="faq">${homeFaq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`,
  ld: [{ '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: S.courses.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, url: abs(`/courses/${c.slug}/`) })) }]
}));

// Courses
for (const c of S.courses) {
  const p = `/courses/${c.slug}/`;
  const secs = c.sections.map(s => `<h2>${esc(s.h)}</h2>${(s.p || []).map(t => `<p>${esc(t)}</p>`).join('')}${s.list ? `<ul>${s.list.map(i => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}`).join('');
  write(`courses/${c.slug}/index.html`, layout({
    path: p, title: `${c.h1}｜${S.brand}`, desc: c.desc, crumbs: [['/', '首頁'], [null, c.name]],
    body: `<h1>${esc(c.h1)}</h1><p><strong>${esc(c.summary)}</strong></p>
<table class="facts">${c.facts.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</table>
<div class="hero" style="padding:14px"><div class="row" style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn primary" href="${S.phoneHref}">電話報名諮詢</a><a class="btn ghost" href="${S.lineUrl}" data-line>官方帳號詢問</a></div></div>
${secs}<h2>常見問題</h2><div class="faq">${c.faq.map(([q, a]) => `<details open><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`,
    ld: [
      { '@context': 'https://schema.org', '@type': 'Course', name: c.h1, description: c.desc, provider: { '@type': 'Organization', name: S.brandFull, url: S.siteUrl }, keywords: c.keywords.join(',') },
      { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: c.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
      { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: '首頁', item: S.siteUrl + '/' }, { '@type': 'ListItem', position: 2, name: c.name, item: abs(p) }] }
    ]
  }));
}

// Articles (flat, top-level)
write('articles/index.html', layout({
  path: '/articles/', title: `好書佳文分享｜${S.brand}`, desc: `${S.brand}的好書佳文分享，整理瑜珈與樂活生活的閱讀心得。`,
  crumbs: [['/', '首頁'], [null, '好書佳文分享']],
  body: `<h1>好書佳文分享</h1><div class="cards">${S.articles.map(a => `<article class="card"><h3><a href="/articles/${a.slug}/">${esc(a.title)}</a></h3><p>${esc(a.desc)}</p><time datetime="${a.date}">${a.date}</time></article>`).join('')}</div>`
}));
for (const a of S.articles) {
  const p = `/articles/${a.slug}/`;
  write(`articles/${a.slug}/index.html`, layout({
    path: p, title: `${a.title}｜${S.brand}`, desc: a.desc, crumbs: [['/', '首頁'], ['/articles/', '好書佳文分享'], [null, a.title]],
    body: `<article><h1>${esc(a.title)}</h1><time datetime="${a.date}">${a.date}</time>${a.body.map(t => `<p>${esc(t)}</p>`).join('')}</article>`,
    ld: [{ '@context': 'https://schema.org', '@type': 'Article', headline: a.title, datePublished: a.date, author: { '@type': 'Organization', name: S.brandFull }, mainEntityOfPage: abs(p) }]
  }));
}

write('404.html', layout({ path: '/404', title: `找不到頁面｜${S.brand}`, desc: '找不到頁面', body: '<h1>找不到這個頁面</h1><p><a href="/">回首頁</a>，或從左側選單選擇三大證照班。</p>' }));

// Static + SEO files
fs.copyFileSync('src/style.css', `${OUT}/style.css`); fs.copyFileSync('src/app.js', `${OUT}/app.js`);
const urls = ['/', ...S.courses.map(c => `/courses/${c.slug}/`), '/articles/', ...S.articles.map(a => `/articles/${a.slug}/`)];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `<url><loc>${abs(u)}</loc></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${abs('/sitemap.xml')}\n`);
write('llms.txt', `# ${S.brandFull}\n\n> ${S.tagline}\n\n## 三大證照班\n${S.courses.map(c => `- [${c.name}](${abs(`/courses/${c.slug}/`)}): ${c.desc}`).join('\n')}\n\n## 文章\n- [好書佳文分享](${abs('/articles/')})\n`);
// Cloudflare Pages 301 redirects (old URL -> new URL)
write('_redirects', `# 舊站 301 轉址（Cloudflare Pages）\n${S.courses.map(c => `${c.old} /courses/${c.slug}/ 301`).join('\n')}\n/index.php / 301\n`);
console.log('built', urls.length, 'pages');

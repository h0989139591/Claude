import fs from 'node:fs';
import path from 'node:path';
const S = JSON.parse(fs.readFileSync('src/site.json', 'utf8'));
const OUT = 'dist';
fs.rmSync(OUT, { recursive: true, force: true });
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const write = (p, c) => { const f = path.join(OUT, p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, c); };
const abs = p => S.siteUrl + p;
const k = (key, v, tag = 'span', extra = '') => `<${tag} data-k="${key}"${extra}>${esc(v)}</${tag}>`;

const navItems = [
  ['/', '首頁'],
  ...S.courses.map(c => [`/courses/${c.slug}/`, c.name]),
  ['label', '好書佳文分享'],
  ...S.categories.map(c => [`/articles/${c.slug}/`, c.name]),
  ['/#contact', '聯絡我們']
];
const catOf = name => S.categories.find(c => c.name === name);

function layout({ path: p, title, desc, body, ld = [], crumbs = [], cur = '' }) {
  const nav = navItems.map(([h, t]) => h === 'label' ? `<li class="grp">${esc(t)}</li>` : `<li><a href="${h}"${h === p || h === cur ? ' aria-current="page"' : ''}>${esc(t)}</a></li>`).join('');
  const org = { '@context': 'https://schema.org', '@type': ['LocalBusiness', 'EducationalOrganization'], name: S.brandFull, alternateName: S.assoc, url: S.siteUrl, telephone: S.phone, address: S.address, sameAs: [S.lineUrl] };
  const jsonld = [org, ...ld].map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n');
  const tiles = S.courses.map(c => `<a class="tile" href="/courses/${c.slug}/"><span class="ph" aria-hidden="true"></span><b>${esc(c.name)}</b></a>`).join('');
  return `<!doctype html>
<html lang="zh-Hant-TW"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${abs(p)}">
<meta property="og:type" content="website"><meta property="og:locale" content="zh_TW">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${abs(p)}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 32 32%27%3E%3Crect width=%2732%27 height=%2732%27 rx=%277%27 fill=%27%231f5fa8%27/%3E%3Ctext x=%2716%27 y=%2723%27 font-size=%2720%27 text-anchor=%27middle%27 fill=%27white%27%3E樂%3C/text%3E%3C/svg%3E">
<link rel="stylesheet" href="/style.css">
${jsonld}
</head><body>
<div class="demo">${esc(S.demoNotice)}</div>
<div class="layout">
<aside class="left">
<a class="brand" href="/">${esc(S.brand)}</a><div class="tag">${esc(S.tagline)}</div>
<nav aria-label="主選單"><ul class="nav">${nav}</ul></nav>
<div class="cta-side">
<a class="btn primary" href="${S.phoneHref}" data-k="phoneBtn" data-prefix="電話 ">電話 ${esc(S.phone)}</a>
<a class="btn ghost" href="${S.lineUrl}" data-line>官方帳號 LINE</a>
</div>
</aside>
<main>
${crumbs.length ? `<div class="crumb">${crumbs.map(([h, t]) => h ? `<a href="${h}">${esc(t)}</a>` : esc(t)).join(' › ')}</div>` : ''}
${body}
</main>
<aside class="right">
<div class="box"><h2>最新消息</h2><ul data-k="news" data-list>${S.news.map(n => `<li>${esc(n)}</li>`).join('')}</ul></div>
<div class="tiles">${tiles}</div>
<div class="box" id="contact"><h2>聯絡資訊</h2><p>電話：${k('phone', S.phone, 'a', ` href="${S.phoneHref}"`)}</p><p>地址：${k('address', S.address)}</p><p>時間：${k('hours', S.hours)}</p><p>LINE：${k('lineId', S.lineId)}</p></div>
</aside>
<footer>© ${esc(S.brandFull)}・${esc(S.assoc)}</footer>
</div>
<div class="float"><a class="btn primary" href="${S.phoneHref}" data-k="floatPhone">電話諮詢</a><a class="btn ghost" style="background:var(--bg)" href="${S.lineUrl}" data-line>官方帳號</a></div>
<dialog id="lineDlg"><h3>用手機掃描加入官方帳號</h3><div class="qr">LINE QR（待客戶提供）</div><p>${esc(S.lineId)}</p><form method="dialog"><button class="btn primary">關閉</button></form></dialog>
<script src="/app.js" defer></script>
</body></html>`;
}

const leadForm = `<form class="lead" id="leadForm"><h2 style="margin-top:0">預約諮詢</h2>
<label>姓名<input name="name" required autocomplete="name"></label>
<label>電話<input name="phone" required inputmode="tel" autocomplete="tel"></label>
<label>想了解的班別<select name="course">${S.courses.map(c => `<option>${esc(c.name)}</option>`).join('')}<option>其他</option></select></label>
<label>留言<textarea name="msg" rows="3"></textarea></label>
<button class="btn primary" type="submit">送出</button><p class="ok" hidden>已收到，我們會盡快與您聯絡（示範模式：資料只存在這台瀏覽器）。</p></form>`;

const allFaq = S.courses.flatMap(c => c.faq).slice(0, 4);
const cards = S.courses.map(c => `<article class="card"><span class="ph" data-photo="course.${c.slug}" aria-hidden="true">照片待補</span><span class="badge">${esc(c.badge)}</span><h3><a href="/courses/${c.slug}/">${esc(c.name)}</a></h3>${k(`course.${c.slug}.summary`, c.summary, 'p')}<a class="more" href="/courses/${c.slug}/">課程介紹與報名 →</a></article>`).join('');
write('index.html', layout({
  path: '/', title: `${S.brand}｜三大國際證照班：四合一國證班・NLP證照・TQUK/Ofqual高階班`,
  desc: `${S.assoc}（${S.brand}）提供四合一國證班、NLP證照課程、TQUK/Ofqual高階班，名師授課、桃園交通便利，歡迎電話或官方帳號諮詢。`,
  body: `<section class="hero"><span class="eyebrow">${esc(S.assoc)}</span><h1 data-k="heroTitle">${esc(S.heroTitle)}</h1><p data-k="heroSub">${esc(S.heroSub)}</p>
<div class="row"><a class="btn primary" href="${S.phoneHref}">電話諮詢</a><a class="btn ghost" href="${S.lineUrl}" data-line>加入官方帳號</a></div></section>
<h2>三大證照班</h2><div class="cards">${cards}</div>
<h2>為什麼選擇我們</h2><div class="why">${S.why.map(([t, d]) => `<div><b>${esc(t)}</b><p>${esc(d)}</p></div>`).join('')}</div>
<h2>報名流程</h2><ol class="steps">${S.steps.map(([t, d], i) => `<li><i>${i + 1}</i><b>${esc(t)}</b><span>${esc(d)}</span></li>`).join('')}</ol>
<h2>常見問題</h2><div class="faq" data-k="faq" data-faq>${allFaq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
${leadForm}`,
  ld: [{ '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: S.courses.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, url: abs(`/courses/${c.slug}/`) })) },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: allFaq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }]
}));

for (const c of S.courses) {
  const p = `/courses/${c.slug}/`;
  const secs = c.sections.map(s => `<h2>${esc(s.h)}</h2>${(s.p || []).map(t => `<p>${esc(t)}</p>`).join('')}${s.list ? `<ul>${s.list.map(i => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}`).join('');
  write(`courses/${c.slug}/index.html`, layout({
    path: p, title: `${c.h1}｜${S.brand}`, desc: c.desc, crumbs: [['/', '首頁'], [null, c.name]],
    body: `<span class="badge">${esc(c.badge)}</span><h1>${esc(c.h1)}</h1><p class="lead-p"><strong>${esc(c.summary)}</strong></p>
<span class="ph wide" data-photo="course.${c.slug}" aria-hidden="true">課程照片待補</span>
<table class="facts">${c.facts.map(([a, b]) => `<tr><th>${esc(a)}</th><td>${esc(b)}</td></tr>`).join('')}</table>
<div class="band"><b>想了解開班資訊？</b><a class="btn primary" href="${S.phoneHref}">電話報名諮詢</a><a class="btn ghost" href="${S.lineUrl}" data-line>官方帳號詢問</a></div>
${secs}<h2>常見問題</h2><div class="faq">${c.faq.map(([q, a]) => `<details open><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`,
    ld: [
      { '@context': 'https://schema.org', '@type': 'Course', name: c.h1, description: c.desc, provider: { '@type': 'Organization', name: S.brandFull, url: S.siteUrl }, keywords: c.keywords.join(',') },
      { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: c.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
      { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: '首頁', item: S.siteUrl + '/' }, { '@type': 'ListItem', position: 2, name: c.name, item: abs(p) }] }
    ]
  }));
}

const artCard = a => `<article class="card"><span class="badge">${esc(a.cat)}</span><h3><a href="/articles/${a.slug}/">${esc(a.title)}</a></h3><p>${esc(a.desc)}</p><time datetime="${a.date}">${a.date}</time></article>`;
write('articles/index.html', layout({
  path: '/articles/', title: `好書佳文分享｜${S.brand}`, desc: `${S.assoc}的好書佳文分享：${S.categories.map(c => c.name).join('、')}。`,
  crumbs: [['/', '首頁'], [null, '好書佳文分享']],
  body: `<h1>好書佳文分享</h1><p>各系列文章也可以直接從左側選單進入。</p><div class="cards">${S.articles.map(artCard).join('')}</div>`
}));
for (const c of S.categories) {
  const list = S.articles.filter(a => a.cat === c.name);
  write(`articles/${c.slug}/index.html`, layout({
    path: `/articles/${c.slug}/`, title: `${c.name}｜好書佳文分享｜${S.brand}`, desc: `${S.assoc}好書佳文分享：${c.name}的文章列表。`,
    crumbs: [['/', '首頁'], ['/articles/', '好書佳文分享'], [null, c.name]],
    body: `<h1>${esc(c.name)}</h1><div class="cards">${list.map(artCard).join('') || '<p>文章整理中。</p>'}</div>`
  }));
}
for (const a of S.articles) {
  const p = `/articles/${a.slug}/`, c = catOf(a.cat);
  write(`articles/${a.slug}/index.html`, layout({
    path: p, cur: `/articles/${c.slug}/`, title: `${a.title}｜${S.brand}`, desc: a.desc, crumbs: [['/', '首頁'], [`/articles/${c.slug}/`, c.name], [null, a.title]],
    body: `<article><span class="badge">${esc(a.cat)}</span><h1>${esc(a.title)}</h1><time datetime="${a.date}">${a.date}</time>${a.body.map(t => `<p>${esc(t)}</p>`).join('')}</article>`,
    ld: [{ '@context': 'https://schema.org', '@type': 'Article', headline: a.title, datePublished: a.date, articleSection: a.cat, author: { '@type': 'Organization', name: S.brandFull }, mainEntityOfPage: abs(p) }]
  }));
}
write('404.html', layout({ path: '/404', title: `找不到頁面｜${S.brand}`, desc: '找不到頁面', body: '<h1>找不到這個頁面</h1><p><a href="/">回首頁</a>，或從左側選單選擇證照班。</p>' }));

for (const f of ['style.css', 'app.js', 'admin.css', 'admin.js']) fs.copyFileSync(`src/${f}`, `${OUT}/${f}`);
let adminHtml = fs.readFileSync('src/admin.html', 'utf8').replace('/*SITE_JSON*/null', JSON.stringify(S));
write('admin/index.html', adminHtml);
const urls = ['/', ...S.courses.map(c => `/courses/${c.slug}/`), '/articles/', ...S.categories.map(c => `/articles/${c.slug}/`), ...S.articles.map(a => `/articles/${a.slug}/`)];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `<url><loc>${abs(u)}</loc></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${abs('/sitemap.xml')}\n`);
write('llms.txt', `# ${S.brandFull}\n\n> ${S.tagline}\n\n## 三大證照班\n${S.courses.map(c => `- [${c.name}](${abs(`/courses/${c.slug}/`)}): ${c.desc}`).join('\n')}\n\n## 好書佳文分享\n${S.categories.map(c => `- [${c.name}](${abs(`/articles/${c.slug}/`)})`).join('\n')}\n`);
write('_redirects', `# 舊站 301 轉址（Cloudflare Pages）\n${S.courses.map(c => `${c.old} /courses/${c.slug}/ 301`).join('\n')}\n/index.php / 301\n/index.html / 301\n/content_16.html /articles/ 301\n${S.categories.map(c => `${c.old} /articles/${c.slug}/ 301`).join('\n')}\n`);
console.log('built', urls.length, 'pages');

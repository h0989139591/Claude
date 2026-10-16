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
  ['/booking/', '預約說明會'],
  ['/news/', '最新消息'],
  ['label', '好書佳文分享'],
  ...S.categories.map(c => [`/articles/${c.slug}/`, c.name]),
  ['/#contact', '聯絡我們']
];
const catOf = name => S.categories.find(c => c.name === name);

function layout({ path: p, title, desc, body, ld = [], crumbs = [], cur = '', extraScript = '' }) {
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
<div class="box"><h2>最新消息</h2><ul data-news="3">${S.news.slice(0, 3).map(n => `<li><a href="/news/#${n.id}">${esc(n.title)}</a> <small>${n.date}</small></li>`).join('')}</ul><a class="more-link" href="/news/">更多消息 →</a></div>
<div class="tiles">${tiles}</div>
<div class="box" id="contact"><h2>聯絡資訊</h2><p>電話：${k('phone', S.phone, 'a', ` href="${S.phoneHref}"`)}</p><p>地址：${k('address', S.address)}</p><p>時間：${k('hours', S.hours)}</p><p>LINE：${k('lineId', S.lineId)}</p></div>
</aside>
<footer>© ${esc(S.brandFull)}・${esc(S.assoc)}　<a href="/news/">最新消息</a>・<a href="/privacy/">隱私權政策</a>・<a href="/terms/">服務條款</a></footer>
</div>
<div class="float"><a class="btn primary" href="${S.phoneHref}" data-k="floatPhone">電話諮詢</a><a class="btn ghost" style="background:var(--bg)" href="${S.lineUrl}" data-line>官方帳號</a></div>
<dialog id="lineDlg"><h3>用手機掃描加入官方帳號</h3><div class="qr">LINE QR（待客戶提供）</div><p>${esc(S.lineId)}</p><form method="dialog"><button class="btn primary">關閉</button></form></dialog>
<dialog id="lb" aria-label="圖片檢視"><button class="lbx" aria-label="關閉">×</button><button class="lbp" aria-label="上一張">‹</button><img alt=""><button class="lbn" aria-label="下一張">›</button></dialog>
<script src="/app.js" defer></script>${extraScript}
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
  body: `<section class="carousel" aria-roledescription="carousel" aria-label="首頁主視覺">
<div class="slides">
<div class="slide on" data-photo="slide.1"><span class="eyebrow">${esc(S.assoc)}</span><h1 data-k="heroTitle">${esc(S.heroTitle)}</h1><p data-k="heroSub">${esc(S.heroSub)}</p><div class="row"><a class="btn primary" href="${S.phoneHref}">電話諮詢</a><a class="btn ghost" href="${S.lineUrl}" data-line>加入官方帳號</a></div></div>
${S.courses.slice(1).map((c, i) => `<div class="slide" data-photo="slide.${i + 2}" aria-hidden="true"><span class="badge">${esc(c.badge)}</span><h2 class="sl-h">${esc(c.name)}</h2><p>${esc(c.summary)}</p><div class="row"><a class="btn primary" href="/courses/${c.slug}/" tabindex="-1">了解課程</a><a class="btn ghost" href="/booking/" tabindex="-1">預約說明會</a></div></div>`).join('')}
</div>
<button class="cp" aria-label="上一張">‹</button><button class="cn" aria-label="下一張">›</button><div class="dots" role="group" aria-label="切換投影片"></div>
</section>
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

// News
write('news/index.html', layout({
  path: '/news/', title: `最新消息｜${S.brand}`, desc: `${S.assoc}最新消息與開班公告。`, crumbs: [['/', '首頁'], [null, '最新消息']],
  body: `<h1>最新消息</h1><div id="newsList" data-news="all">${S.news.map(n => `<article class="news-item" id="${n.id}"><time datetime="${n.date}">${n.date}</time><h2>${esc(n.title)}</h2><p>${esc(n.body)}</p></article>`).join('')}</div>`
}));

// Booking (說明會／試聽場次)
write('booking/index.html', layout({
  path: '/booking/', title: `預約說明會／試聽場次｜${S.brand}`, desc: `線上預約${S.assoc}的證照班說明會與試聽場次，查看日期、時段與剩餘名額。`, crumbs: [['/', '首頁'], [null, '預約說明會']],
  body: `<h1>預約說明會／試聽場次</h1><p>選擇想參加的場次，留下聯絡方式即可預約。名額有限，額滿請改以電話或官方帳號洽詢。</p>
<div id="slots" class="slots" aria-live="polite"><p>載入場次中…（若沒有顯示，請直接<a href="${S.phoneHref}">來電</a>預約）</p></div>
<form class="lead" id="bookForm" hidden><h2 style="margin-top:0">填寫預約資料</h2><p id="picked" class="ok"></p>
<label>姓名<input name="name" required autocomplete="name"></label>
<label>電話<input name="phone" required inputmode="tel" autocomplete="tel"></label>
<label>備註<textarea name="note" rows="2"></textarea></label>
<button class="btn primary" type="submit">確認預約</button><p class="ok" id="bookOk" hidden>預約成功！我們會再與您確認（示範模式：資料只存在這台瀏覽器）。</p><p id="bookErr" style="color:#b3261e;margin:0" hidden></p></form>`,
  extraScript: `\n<script src="/shared.js" defer></script><script>window.SITE_COURSES=${JSON.stringify(S.courses.map(c => ({ name: c.name })))}</script><script src="/booking.js" defer></script>`
}));

// Privacy / Terms (基本版草稿，內容由客戶確認)
const draftNote = `<p class="draft">本頁為基本版草稿，正式內容請由${esc(S.brandFull)}確認，必要時請法務人員檢視。</p>`;
write('privacy/index.html', layout({
  path: '/privacy/', title: `隱私權政策｜${S.brand}`, desc: `${S.brandFull}隱私權政策：個人資料的蒐集、處理、利用與當事人權利。`, crumbs: [['/', '首頁'], [null, '隱私權政策']],
  body: `<h1>隱私權政策</h1>${draftNote}
<h2>一、蒐集目的與類別</h2><p>為提供課程諮詢、說明會預約、報名聯繫與課務通知，本網站會蒐集您主動填寫的姓名、電話、電子郵件、留言與預約內容。</p>
<h2>二、利用期間、地區、對象與方式</h2><p>資料僅在前述目的之必要期間內，於中華民國境內，由${esc(S.brandFull)}及${esc(S.assoc)}以電話、訊息或電子郵件方式聯繫與利用，不會任意提供給第三人，法律另有規定者除外。</p>
<h2>三、當事人權利</h2><p>依個人資料保護法，您得就個人資料請求查詢或閱覽、製給複製本、補充或更正、停止蒐集處理或利用，以及刪除。請以下列方式聯絡我們：電話 ${esc(S.phone)}、電子郵件【待客戶提供】。</p>
<h2>四、不提供資料的影響</h2><p>您可以選擇不提供個人資料，但可能無法完成預約或獲得後續聯繫。</p>
<h2>五、網站使用紀錄與外部服務</h2><p>本網站可能使用網站分析工具（如 Google Analytics）統計瀏覽狀況，此類資料不用於識別個人。網站可能連結至第三方（如 LINE、Facebook、YouTube），其隱私權作法不適用本政策。</p>
<h2>六、未成年人</h2><p>未成年人預約或報名，請由法定代理人同意與陪同。</p>
<h2>七、政策修訂</h2><p>本政策得隨法令或服務調整而修訂，修訂後公布於本頁。</p>`
}));
write('terms/index.html', layout({
  path: '/terms/', title: `服務條款｜${S.brand}`, desc: `${S.brandFull}網站服務條款：內容著作權、課程資訊、預約與免責說明。`, crumbs: [['/', '首頁'], [null, '服務條款']],
  body: `<h1>服務條款</h1>${draftNote}
<h2>一、著作權</h2><p>本網站所有內容（文字、圖片、影片、版面）之權利屬${esc(S.brandFull)}及${esc(S.assoc)}所有，未經授權不得轉載、重製或作商業使用。</p>
<h2>二、課程與資訊</h2><p>課程內容、開班日期、費用與師資以現場公告或客服確認為準，網站資訊可能隨時調整。證照之名稱與認證範圍，以發證單位公告為準。</p>
<h2>三、預約、報名與取消</h2><p>預約說明會或試聽不代表完成課程報名。正式報名、費用、退費與改期規則：【待客戶提供】。</p>
<h2>四、使用者責任</h2><p>請提供正確的聯絡資料，並不得利用本網站從事違法、侵害他人權益或干擾網站運作之行為。</p>
<h2>五、免責聲明</h2><p>本網站內容供課程介紹與一般資訊參考，不構成醫療、診斷或療效保證；個人學習成果因人而異。</p>
<h2>六、準據法與管轄</h2><p>本條款以中華民國法律為準據法，如有爭議，以【待客戶提供】地方法院為第一審管轄法院。</p>`
}));

write('404.html', layout({ path: '/404', title: `找不到頁面｜${S.brand}`, desc: '找不到頁面', body: '<h1>找不到這個頁面</h1><p><a href="/">回首頁</a>，或從左側選單選擇證照班。</p>' }));

for (const f of ['style.css', 'app.js', 'shared.js', 'booking.js', 'admin.css', 'admin.js']) fs.copyFileSync(`src/${f}`, `${OUT}/${f}`);
let adminHtml = fs.readFileSync('src/admin.html', 'utf8').replace('/*SITE_JSON*/null', JSON.stringify(S));
write('admin/index.html', adminHtml);
const urls = ['/', ...S.courses.map(c => `/courses/${c.slug}/`), '/articles/', '/news/', '/booking/', '/privacy/', '/terms/', ...S.categories.map(c => `/articles/${c.slug}/`), ...S.articles.map(a => `/articles/${a.slug}/`)];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `<url><loc>${abs(u)}</loc></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${abs('/sitemap.xml')}\n`);
write('llms.txt', `# ${S.brandFull}\n\n> ${S.tagline}\n\n## 三大證照班\n${S.courses.map(c => `- [${c.name}](${abs(`/courses/${c.slug}/`)}): ${c.desc}`).join('\n')}\n\n## 好書佳文分享\n${S.categories.map(c => `- [${c.name}](${abs(`/articles/${c.slug}/`)})`).join('\n')}\n`);
write('_redirects', `# 舊站 301 轉址（Cloudflare Pages）\n${S.courses.map(c => `${c.old} /courses/${c.slug}/ 301`).join('\n')}\n/index.php / 301\n/index.html / 301\n/news.html /news/ 301\n/content_16.html /articles/ 301\n${S.categories.map(c => `${c.old} /articles/${c.slug}/ 301`).join('\n')}\n`);
console.log('built', urls.length, 'pages');

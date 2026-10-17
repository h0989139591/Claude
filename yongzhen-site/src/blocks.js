// 內容積木：後台編輯、後台預覽與網站建置共用同一套渲染，確保所見即所得。
// 積木種類：h2 h3 p ul img note cta faq。版面樣式由系統控制，客戶只改內容。
(function (root, factory) { if (typeof module === 'object' && module.exports) module.exports = factory(); else root.YZB = factory(); })(this, function () {
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var okUrl = function (u) { return /^(https?:\/\/|\/|tel:|mailto:|#)/.test(u); };
  var okImg = function (u) { return /^(\/img\/|\/uploads\/|https:\/\/|data:image\/(png|jpe?g|webp|gif);base64,)/.test(u); };

  // 內文：支援 **粗體**、[文字](網址)、換行
  function inline(s) {
    s = esc(s);
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, t, u) {
      u = u.replace(/&amp;/g, '&');
      if (!okUrl(u)) return t;
      var ext = /^https?:\/\//.test(u);
      return '<a href="' + esc(u) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + t + '</a>';
    });
    return s.replace(/\r?\n/g, '<br>');
  }
  function plain(s) { return String(s || '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1'); }

  // opts: { cta:()=>html, imgSize:(src)=>[w,h]|null }
  function render(blocks, opts) {
    opts = opts || {};
    var out = [], faq = [], open = null, i, b;
    function close() { if (open) { out.push('</div>'); open = null; } }
    for (i = 0; i < (blocks || []).length; i++) {
      b = blocks[i]; if (!b) continue;
      if (b.type === 'h2' || b.type === 'h3') {
        close();
        var day = b.type === 'h3' && b.day;
        if (day) { out.push('<div class="day">'); open = 'day'; }
        out.push('<' + b.type + '>' + inline(b.text) + '</' + b.type + '>');
      } else if (b.type === 'p') { out.push('<p>' + inline(b.text) + '</p>');
      } else if (b.type === 'ul') {
        var items = (b.items || []).filter(function (x) { return String(x).trim(); });
        if (items.length) out.push('<ul>' + items.map(function (x) { return '<li>' + inline(x) + '</li>'; }).join('') + '</ul>');
      } else if (b.type === 'img') {
        close();
        if (b.src && okImg(b.src)) {
          var sz = opts.imgSize && opts.imgSize(b.src);
          out.push('<figure><img class="zoomable" src="' + esc(b.src) + '" alt="' + esc(b.alt || '') + '" loading="lazy"' + (sz ? ' width="' + sz[0] + '" height="' + sz[1] + '"' : '') + '>' + (b.caption ? '<figcaption>' + inline(b.caption) + '</figcaption>' : '') + '</figure>');
        }
      } else if (b.type === 'note') {
        close();
        out.push('<div class="note">' + (b.title ? '<h2>' + inline(b.title) + '</h2>' : '') + String(b.text || '').split(/\n{2,}|\n/).filter(function (x) { return x.trim(); }).map(function (x) { return '<p>' + inline(x) + '</p>'; }).join('') + '</div>');
      } else if (b.type === 'cta') {
        close(); out.push(opts.cta ? opts.cta(b.text) : '<p><a class="btn primary" href="/contact/">' + esc(b.text || '聯絡我們') + '</a></p>');
      } else if (b.type === 'faq') {
        close();
        var qs = (b.items || []).filter(function (x) { return x && x.q && x.a; });
        qs.forEach(function (x) { faq.push([plain(x.q), plain(x.a)]); });
        if (qs.length) out.push('<div class="faq">' + qs.map(function (x) { return '<details><summary>' + esc(plain(x.q)) + '</summary><p>' + inline(x.a) + '</p></details>'; }).join('') + '</div>');
      }
    }
    close();
    var html = out.join('\n')
      .replace(/(?:<figure>[\s\S]*?<\/figure>\n?){2,}/g, function (m) { return '<div class="gallery">' + m.trim().split('\n').join('') + '</div>\n'; })
      .replace(/(?:<div class="day">[\s\S]*?<\/div>\n?){2,}/g, function (m) { return '<div class="days">' + m.trim() + '</div>\n'; });
    return { html: html, faq: faq };
  }
  function firstText(blocks, n) {
    var t = (blocks || []).filter(function (b) { return b.type === 'p' && b.text; }).map(function (b) { return plain(b.text); }).join(' ').replace(/\s+/g, ' ');
    return n && t.length > n ? t.slice(0, n - 1) + '…' : t;
  }
  var SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  return { esc: esc, inline: inline, plain: plain, render: render, firstText: firstText, okUrl: okUrl, okImg: okImg, SLUG: SLUG };
});

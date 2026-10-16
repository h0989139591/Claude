// 原站正文（行銷工作階段抓取的 .md）→ 乾淨 HTML。供 build.mjs 使用。
import fs from 'node:fs';
import path from 'node:path';

export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// 讀圖片尺寸（PNG／JPEG），避免版面跳動
export function imgSize(p) {
  try {
    const d = fs.readFileSync(p);
    if (d.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') return [d.readUInt32BE(16), d.readUInt32BE(20)];
    let i = 2; while (i < d.length) { if (d[i] !== 0xFF) { i++; continue; } const m = d[i + 1]; if (m >= 0xC0 && m <= 0xC2) return [d.readUInt16BE(i + 7), d.readUInt16BE(i + 5)]; i += 2 + d.readUInt16BE(i + 2); }
  } catch {}
  return null;
}

export function indexImages(root = 'public/img') {
  const map = new Map();
  if (!fs.existsSync(root)) return map;
  (function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : map.set(f, p); } })(root);
  return map;
}

// opts: { links:(url)=>string|null, images:Map, alt:string, drop:RegExp[] }
export function convert(md, opts) {
  const lines = md.replace(/\r/g, '').split('\n');
  let i = lines.findIndex(l => /^H2:/.test(l)) + 1;
  { let j = i; while (j < lines.length && !lines[j].trim()) j++;
    if (/^# \S/.test(lines[j] || '')) { for (let k = j + 1; k < Math.min(j + 6, lines.length); k++) if (/ico_1\.gif/.test(lines[k])) { i = j + 1; break; } } }
  const out = [], meta = { text: 0, imgs: 0, images: [] };
  let list = null, para = [], firstHeading = null, open = null; // open: 'day' | 'note'
  const closeBox = () => { if (open) { out.push('</div>'); open = null; } };
  const flushList = () => { if (list) { out.push('<ul>' + list.map(x => `<li>${x}</li>`).join('') + '</ul>'); list = null; } };
  const flushPara = () => { if (para.length) { out.push(`<p>${para.join('<br>')}</p>`); para = []; } };
  const inline = s => {
    s = s.replace(/\[圖:[^\]]*\]/g, '');
    s = s.replace(/\[([^\]]*)\]\(([^)\s]+)\)/g, (m, t, u) => {
      t = t.trim(); if (!t) return '';
      const to = opts.links(u); if (to === null) return /^https?:\/\//i.test(t) ? '' : esc(t);
      if (/^https?:\/\//i.test(t)) { let host = ''; try { host = new URL(to, 'http://x').host; } catch {} t = (opts.linkLabel && opts.linkLabel(to)) || (host && host !== 'x' ? host : '連結'); }
      const ext = /^https?:\/\//.test(to) && !to.includes('loveyogalohas.com.tw');
      return `<a href="${esc(to)}"${ext ? ' target="_blank" rel="noopener"' : ''}>${esc(t)}</a>`;
    });
    const parts = s.split(/(<a [^>]*>.*?<\/a>)/g).map(p => p.startsWith('<a ') ? p : p.replace(/&(?!#?\w+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
    return parts.join('').replace(/\s+/g, ' ').trim();
  };
  const drop = l => (opts.drop || []).some(r => r.test(l));
  const imgTag = url => {
    const base = decodeURIComponent(url.split('?')[0].split('/').pop());
    const p = opts.images.get(base); if (!p) return '';
    const sz = imgSize(p), rel = '/' + p.replace(/^public\//, '');
    meta.imgs++; meta.images.push(rel);
    return `<figure><img class="zoomable" src="${rel}" alt="${esc(opts.alt || '')}" loading="lazy"${sz ? ` width="${sz[0]}" height="${sz[1]}"` : ''}></figure>`;
  };
  for (; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l || l === '[' || l === ']') { flushPara(); continue; }
    if (/^\[圖:images\/ico_1\.gif\]/.test(l) || /^首頁\s*>|^\[首頁\]\(index\.html\)\s*>/.test(l)) continue;
    if (drop(l)) continue;
    const im = l.match(/^\[圖:([^\]]+)\]$/);
    if (im) { flushPara(); flushList(); out.push(imgTag(im[1])); continue; }
    if (/^\]\(/.test(l)) continue;
    const hm = l.match(/^(#{1,4})\s*(.*)$/);
    if (hm) {
      flushPara(); flushList();
      let text = hm[2].trim();
      if (!text) { let j = i + 1; while (j < lines.length && !lines[j].trim()) j++; text = (lines[j] || '').trim(); i = j; }
      text = inline(text); if (!text) continue;
      const plain = text.replace(/<[^>]+>/g, '');
      const day = /^第[一二三四五六七八九十]+天/.test(plain);
      closeBox();
      if (day) { out.push('<div class="day">'); open = 'day'; }
      else if (/重要說明|提醒事項|注意事項/.test(plain)) { out.push('<div class="note">'); open = 'note'; }
      if (!firstHeading) firstHeading = plain;
      const lvl = day || hm[1].length >= 3 ? 3 : 2;
      out.push(`<h${lvl}>${text}</h${lvl}>`); meta.text += text.length; continue;
    }
    const lm = l.match(/^[-●•]\s*(.*)$/);
    if (lm) { flushPara(); (list ||= []).push(inline(lm[1])); meta.text += lm[1].length; continue; }
    flushList();
    const t = inline(l); if (!t) continue;
    para.push(t); meta.text += l.length;
  }
  flushPara(); flushList(); closeBox();
  // 相鄰圖片合併成圖庫
  const html = out.filter(Boolean).join('\n').replace(/(?:<figure>.*?<\/figure>\n?){2,}/g, m => `<div class="gallery">${m.trim().split('\n').join('')}</div>\n`);
  return { html, firstHeading, ...meta };
}

// 問答頁（Q1｜… 或 Q: … A：…）→ [{section, q, a(html)}]
export function parseFaq(md, opts) {
  const lines = md.replace(/\r/g, '').split('\n');
  let i = lines.findIndex(l => /^H2:/.test(l)) + 1;
  const items = []; let section = '', cur = null;
  const flush = () => { if (cur) { const r = convert('H2:\n\n' + cur.body.join('\n'), opts); items.push({ section: cur.section, q: cur.q, a: r.html }); cur = null; } };
  for (; i < lines.length; i++) {
    const l = lines[i].trim();
    const sec = l.match(/^第[一二三四五六七八九十]+篇[：:]\s*(.*)$/); if (sec) { flush(); section = l.replace(/[【】]/g, ''); continue; }
    const q = l.match(/^#?\s*Q\d*\s*[｜:：]\s*(.+)$/);
    if (q && !/^Q\d+｜.*\|/.test(l)) { flush(); cur = { section, q: q[1].trim(), body: [] }; continue; }
    if (cur) { cur.body.push(/^A[：:]/.test(l) ? l.replace(/^A[：:]\s*/, '') : lines[i]); }
  }
  flush();
  return items;
}

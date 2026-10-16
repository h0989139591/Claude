// 內容審閱清單：列出站上文字中可能需要客戶確認的用語（誇大、絕對化、療效、折扣、日期不一致）。
// node tools/content-review.mjs  → 輸出 CONTENT-REVIEW.md
import fs from 'node:fs';
const S = JSON.parse(fs.readFileSync('src/site.json', 'utf8'));
const files = [...S.courses.map(c => [c.h1, c.src]), ...S.pages.map(p => [p.h1, p.src]), ...S.faqPages.map(f => [f.h1, f.src]), ...S.categories.map(c => [c.name, c.src])];
const RULES = [
  ['絕對化／最高級', /全台(?:唯一|獨家|第一|獨創)|全球獨家|唯一|獨家授權|全國獨創|第一名|最(?:好|佳|強|高階|大)|無可取代|保證/],
  ['可能被視為療效或醫療宣稱', /療效|治癒|治療|療癒|根治|改善病|疾病|癌|失眠|憂鬱|糖尿病|高血壓|痛風|慢性病|減重|減肥/],
  ['學歷／資格等同說法', /等同大學|大學文憑|抵免|學分|同等學力|官方認證|官方高階|英國政府/],
  ['折扣／價格', /特惠|優惠|折扣|九折|限量|限額|名額有限|\$\s*\d/],
  ['就業／收入暗示', /高薪|月入|年薪|創業|斜槓|藍海|商機|接案/]
];
const rows = [];
for (const [title, src] of files) {
  const lines = fs.readFileSync(`source/pages/${src}`, 'utf8').split('\n');
  lines.forEach((l, i) => {
    const t = l.replace(/\[圖:[^\]]*\]/g, '').replace(/\]\([^)]*\)/g, '').replace(/[\[\]]/g, '').trim();
    if (t.length < 6) return;
    for (const [cat, re] of RULES) { const m = t.match(re); if (m) { rows.push([cat, title, src, i + 1, m[0], t.slice(0, 110)]); break; } }
  });
}
const byCat = {}; rows.forEach(r => (byCat[r[0]] ||= []).push(r));
let md = `# 內容審閱清單（供客戶確認）\n\n以下文字取自原站，已原樣放進新站。依建置檔紅線（不寫誇大或療效字眼、對外頁面不放折扣），請客戶逐項確認：**保留、改寫或刪除**。\n\n共 ${rows.length} 筆。\n\n`;
for (const [cat, rs] of Object.entries(byCat)) {
  md += `## ${cat}（${rs.length}）\n\n| 頁面 | 來源檔:行 | 關鍵字 | 原文節錄 |\n|---|---|---|---|\n` + rs.slice(0, 60).map(r => `| ${r[1]} | ${r[2]}:${r[3]} | ${r[4]} | ${r[5].replace(/\|/g, '／')} |`).join('\n') + (rs.length > 60 ? `\n\n…另有 ${rs.length - 60} 筆` : '') + '\n\n';
}
md += `## 已知需確認的資料不一致\n\n- 「國際心靈芳香理療師・大陸內地班」：開課資訊頁寫 2027/02/18，專班頁（page_57）寫 2026/12/17。\n- 「港澳國際心靈芳療師・香港澳門班」：開課資訊頁寫 2027/02/20，專班頁（page_45）寫 2026/12/19。\n- 「新二合一班」開課資訊連到原站 page_66，但該頁實為上課影片，新站未放連結。\n- 已依紅線移除的折扣文字：NLP 教練證照班的「特惠價」與「兩人同行優惠」價格。\n`;
fs.writeFileSync('CONTENT-REVIEW.md', md);
console.log(`審閱清單：${rows.length} 筆`, Object.entries(byCat).map(([k, v]) => `${k} ${v.length}`).join('、'));

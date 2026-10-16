# 永真樂活人生顧問 官網＋後台（示範模式，假資料）

## 結構
- `src/site.json`：官網內容（三大證照班、文章分類、聯絡資料、`siteUrl`）
- `build.mjs`：`node build.mjs` → 輸出 `dist/`（Cloudflare Pages，build output 設為 `dist`）
- 前台：首頁、三個證照班頁、好書佳文六個系列直接放在左側選單頂層（不分第二層），各有列表頁、右側欄保留
- 後台：`/admin/`（預設密碼 `demo1234`）四個分頁：總覽、課程月曆、官網內容、設定
- `dist/_redirects`：舊站 301（content_5 → 四合一國證班、content_2 → NLP證照課程、content_26 → TQUK/Ofqual高階班、content_16 → 好書佳文分享）

## 示範模式
後台資料與官網內容存在瀏覽器 localStorage，改完在官網重新整理即可看到。
正式版依建置檔改為 Google Apps Script + 試算表（放客戶自己的 Google 帳號）。

## 待補
- 原站正文與照片（資料夾由行銷工作階段收集中）、LINE 連結與 QR、營業時間、logo
- 價格、時數、證照名稱、師資皆由客戶提供，網站不代寫

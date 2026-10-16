# 永真樂活人生顧問 官網原型（示範模式，占位內容）

- 編輯內容：`src/site.json`（證照班、文章、電話、LINE、`siteUrl`）
- 建置：`node build.mjs` → 輸出 `dist/`（部署到 Cloudflare Pages，build output 設為 `dist`）
- `dist/_redirects` 是舊站 301 對照（content_2 / content_5 / content_26 → 新頁）。
  **三個舊網址對應哪一個證照班尚未確認，請先核對 `site.json` 的 `old` 欄位。**

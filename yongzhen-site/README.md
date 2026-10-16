# 永真樂活人生顧問 官網＋後台（示範版）

內容取自原站 loveyogalohas.com.tw（由行銷工作階段收集於 `source/`），上線前請客戶逐頁確認。

## 結構
- `src/site.json`：課程、開課資訊、右側欄快速入口、頁面清單、FAQ、聯絡資料、`siteUrl`、`aiBlock`
- `source/pages/*.md`：原站逐字正文（63 頁）；`tools/md.mjs` 轉成乾淨 HTML（標題層級、清單、日程卡、圖庫、連結改寫）
- `public/img/`：已確認無人像的圖片；`public/img/logo/` 為兩個 LOGO（自舊站頁首裁出，解析度低，**請客戶提供原檔後替換**；原始裁切檔在 `source/logo-originals/`）
- `build.mjs`：`node build.mjs` → `dist/`（Cloudflare Pages，build output 設為 `dist`）

## 頁面
首頁（輪播、開課、三大證照班）、三大證照班、最新開課資訊、授課講師介紹、預約說明會、最新消息、好書佳文六系列（左側選單頂層）、關於我們、導師的話、學長姐的英雄旅程、國際授權機構、常見問答（四合一／NLP）、知識中心、影片、其他課程（瑜珈師資、芳療、經絡、國際認證）、聯絡我們、隱私權政策、服務條款。右側欄：最新開課、12 個設計過的快速入口、最新消息、聯絡資訊。

## 後台 `/admin/`（示範密碼 `demo1234`）
總覽（諮詢單、說明會報名名單）、課程月曆、官網內容（標題、班別簡介與時數學費、**開課資訊**、最新消息、常見問題、照片、搜尋標題）、設定。
示範模式資料存在瀏覽器 localStorage；正式版依建置檔改為 Google Apps Script＋試算表（放客戶自己的 Google 帳號）。

## 驗收與審閱
```bash
node build.mjs
node tools/check.mjs         # SEO、結構化資料、標題層級、robots、sitemap、301
node tools/rwd-check.mjs     # 手機／平板／電腦（需 playwright）
node tools/content-review.mjs  # 產生 CONTENT-REVIEW.md（需客戶確認的用語）
python3 tools/make-thumbs.py   # 重做首頁縮圖
```
詳見 `ACCEPTANCE.md`。`dist/_redirects` 含舊站 65 條 301。

## 待補
學費（四合一、TQUK／Ofqual）、報名資格、LINE 連結確認、LOGO 原檔、講師照片與同意、`siteUrl`、管轄法院、各班退費規則（僅 TQUK 有）、最新消息全文（news_details_250～282 尚未收集）。

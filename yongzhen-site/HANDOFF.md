# 交接說明：永真樂活官網（給本機行銷工作階段）

分支：`claude/awesome-ptolemy-fw20dl`（倉庫 h0989139591/Claude，資料夾 `yongzhen-site/`）。先 `git pull --rebase`，只在這個分支作業。
客戶：永真樂活人生顧問有限公司／桃園市樂活瑜伽協會；報價單 Q20261016-04（官網＋輕系統）。

## 現況（雲端工作階段已完成）
- 前台 44 頁（內容取自原站）＋示範版後台 `/admin/`（假資料、存在瀏覽器；密碼 `demo1234`）。
- 自動檢查全過：`node tools/check.mjs`（4024 項）、`node tools/rwd-check.mjs`（135 次載入）。Lighthouse 行動版：無障礙／最佳做法／SEO 100。
- 舊網址 301 共 65 條（`dist/_redirects`）。

## 建置與預覽
```bash
cd yongzhen-site
node build.mjs            # 產出 dist/
npx serve dist            # 或 python -m http.server -d dist
```
部署：Cloudflare Pages，build output = `dist`（依專案慣例；上線前先換 `src/site.json` 的 `siteUrl`）。

## 要改內容在哪裡
| 要改 | 位置 |
|---|---|
| 課程、開課場次、講師、右側欄入口、聯絡資料、FAQ | `src/site.json` |
| 頁面正文（三大證照班、關於、導師的話等） | `source/pages/*.md`（原站逐字稿；`tools/md.mjs` 轉 HTML） |
| 圖片 | `public/img/`（只放無人像或已獲同意者）；首頁縮圖用 `python3 tools/make-thumbs.py` 重產 |
| 樣式／腳本 | `src/style.css`、`src/app.js`、`src/admin.js` |
| AI 爬蟲排除 | `src/site.json` 的 `aiBlock` |

## 待辦（優先順序）
1. **LOGO 原檔**：`public/img/logo/` 現為舊站頁首裁出的低解析版，請向客戶要 AI／PDF／大尺寸 PNG 後替換（檔名維持 `logo-seal.*`、`logo-loveyoga.*`）。
2. **最新消息**：43 篇全文已整合成 `/news/<編號>/`（已完成）。日期以原站列表頁為準；編號 2 內容過少已轉址到列表；244、264、236 等列表無日期者請對照原站確認。
3. **客戶確認**：`CONTENT-REVIEW.md` 共 333 筆用語（絕對化、療效、等同學歷、折扣）需客戶決定保留／改寫／刪除；開課資訊頁與專班頁的日期不一致（大陸班、港澳班）。
4. **缺的資料**：四合一與 TQUK 學費、報名資格、各班退費規則（僅 TQUK 有）、管轄法院、LINE 連結確認、講師照片與同意。
5. **後台風格**：已依使用者回饋改為分組選單＋大字級＋拆小頁。元峰後台的設計參考待提供（見 `source/ref/`），到時微調配色與元件。
6. **正式後台**：把示範後台改成 Google Apps Script＋試算表（客戶自己的 Google 帳號，沿用慈惠堂／元多淥的 Line.gs 與後台做法）；LINE 串接、Google 行事曆同步（建置檔列為功能，尚未做）。
6. 上線前：`siteUrl`、`og.png`（用正式 LOGO 重做）、Search Console 提交 sitemap、用 Rich Results Test 與 PageSpeed Insights 驗收。

## 紅線（來自建置檔）
客戶資料不交給外部 AI，開發測試用假資料；不寫誇大或療效字眼；有人臉的照片需當事人同意；對外頁面不放折扣；LOGO 一律用原檔；手機點 LINE 直接開、電腦跳 QR 視窗；頁首與按鈕文字不換行。

## 注意
- 倉庫根目錄 `/survey.mjs`（雲端容器內）是誤建的空檔，與專案無關。
- 本機若沒有 playwright，`rwd-check` 會跳過；`check.mjs` 不需要額外套件。

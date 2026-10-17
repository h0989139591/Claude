# 後台發布檔（overrides.json）

後台按「發布」會產出 `overrides.json`，建置程式（`node build.mjs`）讀它：
- `pages`：覆蓋既有頁面的標題、搜尋標題／描述與內文（鍵為頁面路徑，如 `courses/nlp`、`about`、`news/274`）。
- `custom`：新增的一般頁面（`/<slug>/`）與文章（`/news/<slug>/`）；`status` 為 `published` 才會產生；`menu` 為真則加入左側選單。

示範版：把檔案放成 `src/content/overrides.json` 後執行 `node build.mjs`。
正式版：設環境變數 `CONTENT_URL`（Google Apps Script 的 JSON 網址），Cloudflare Pages 建置時自動讀取；後台「發布」按鈕觸發 Pages 的 deploy hook。
內容積木種類：`h2` `h3` `p` `ul` `img` `note` `cta` `faq`（見 `src/blocks.js`）。網址代稱只能用小寫英文、數字與連字號，且不能用系統保留字。
`overrides.json` 不應提交到版本庫（客戶內容在正式版存放於其 Google 試算表）。

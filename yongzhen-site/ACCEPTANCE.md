# 技術規格與搜尋可見性：實作與驗收對照

對照合約「技術規格與搜尋可見性」六項。自動檢查可重複執行：

```bash
node build.mjs
node tools/check.mjs        # 靜態：SEO、結構化資料、標題層級、robots、sitemap、301
node tools/rwd-check.mjs    # 響應式：手機／平板／電腦（需 playwright）
```

| 條款 | 實作 | 自動檢查 | 上線後人工驗收（Google 公開工具） |
|---|---|---|---|
| 一、響應式 RWD | viewport、流動版面、手機選單改橫向捲動、可點擊目標 ≥36px、字級 ≥13px | `rwd-check`：360／768／1280 三種寬度全部頁面，無橫向溢出、無主控台錯誤、點擊目標達標 | PageSpeed Insights／Lighthouse 行動版。**註：Google「行動裝置相容性測試」已於 2023 年底停用，合約文字建議改為 Lighthouse／PageSpeed Insights 行動版** |
| 二、SEO 基礎 | 每頁 title、description、canonical、Open Graph（含 og:image）、sitemap.xml（含 lastmod）、robots.txt、自訂 404（noindex）、後台 noindex | `check`：長度、canonical 與網址一致、OG 欄位齊全、在 sitemap、單一 H1、內部連結不失效 | Search Console：提交 sitemap、網址審查 |
| 三、結構化資料 | JSON-LD：LocalBusiness／EducationalOrganization（含 PostalAddress）、Service／Course（服務項目）、FAQPage、BreadcrumbList、Article、ItemList | `check`：可解析、必填欄位、麵包屑序號、FAQ 項目 | Rich Results Test 貼網址 |
| 四、GEO | 單一 H1 與不跳級標題、問答式 FAQ 區塊、答案優先的摘要段落、`robots.txt` 明列 GPTBot／OAI-SearchBot／ChatGPT-User／Google-Extended／PerplexityBot／ClaudeBot 等並允許；`llms.txt`；甲方得在 `src/site.json` 的 `aiBlock` 指定排除 | `check`：標題層級、各 AI 爬蟲在 robots 的設定與 `aiBlock` 一致 | 實際被引用不在驗收範圍 |
| 五、內容管理 | 自建後台（非 WordPress）：文字、照片、課程時數／學費／報名資格、最新消息、常見問題、聯絡資料 | 手動操作測試 | 依第八條移轉管理權限 |
| 六、驗收依據 | 以上自動檢查＋簽約時 Google 公開工具 | — | 排名與 AI 引用不在驗收範圍 |

## 已知限制（請與客戶說明）
1. FAQPage 結構化資料標示正確，但 Google 自 2023 年 8 月起，FAQ 豐富摘要只對權威政府與健康類網站顯示；標示仍有助於 AI 與搜尋引擎理解內容。「Rich Results Test 無錯誤」可達成，但不保證顯示豐富摘要。
2. `Google-Extended` 是控制 Gemini 訓練與 grounding 用途的 robots 標記，不影響 Google 搜尋收錄。
3. 上線前須把所有「【待客戶提供】」占位文字換成真實內容，並把 `siteUrl`、`og.png`（目前是示範圖）換成正式網域與 LOGO。
4. 本機 Lighthouse（行動版，示範站，2026-10-16）：首頁 效能 86→改用縮圖後待複測／無障礙 100／最佳做法 100／SEO 100；四合一頁 98／100／100／100；開課頁 100／100／100／100。正式站請以上線網址重跑。

#!/usr/bin/env node
// 用法：node render.mjs <資料.json> [輸出.md]
// 無外部依賴。讀 fields.json 驗證輸入、算出衍生欄位，再填入 severance-agreement.template.md。
// 後台系統可直接移植 compute() 與 validate() 的規則，或只用範本與 fields.json 自行實作。
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const fields = JSON.parse(readFileSync(join(dir, 'fields.json'), 'utf8'));
const template = readFileSync(join(dir, fields.template), 'utf8');
const [, , dataPath, outPath] = process.argv;
if (!dataPath) { console.error('用法：node render.mjs <資料.json> [輸出.md]'); process.exit(2); }
const input = JSON.parse(readFileSync(dataPath, 'utf8'));

const DAY = 86400000;
const utc = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
const iso = (dt) => dt.toISOString().slice(0, 10);
const addDays = (dt, n) => new Date(dt.getTime() + n * DAY);
const addMonths = (dt, n) => {
  const y = dt.getUTCFullYear(), m = dt.getUTCMonth() + n, d = dt.getUTCDate();
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(d, last)));
};
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

function validate(d) {
  const errors = [];
  for (const f of fields.inputs) {
    const v = d[f.key];
    const need = f.required || (f.required_if && d[f.required_if]);
    if (need && (v === undefined || v === null || v === '')) { errors.push(`缺少必填欄位：${f.key}（${f.label}）`); continue; }
    if (v === undefined || v === '') continue;
    if (f.pattern && !new RegExp(f.pattern).test(String(v))) errors.push(`${f.key} 格式不符`);
    if (f.min !== undefined && Number(v) < f.min) errors.push(`${f.key} 不得小於 ${f.min}（${f.help || f.label}）`);
    if (f.max !== undefined && Number(v) > f.max) errors.push(`${f.key} 不得大於 ${f.max}`);
    if (f.options && !f.options.includes(v)) errors.push(`${f.key} 須為 ${f.options.join('/')}`);
  }
  if (d.hire_date && d.termination_date && utc(d.termination_date) <= utc(d.hire_date)) errors.push('離職日須晚於到職日');
  if (d.notice_date && d.termination_date && utc(d.termination_date) < utc(d.notice_date)) errors.push('離職日不得早於預告日');
  if (d.noncompete_enabled && d.noncompete_monthly_compensation < Math.round(d.avg_wage * 0.5))
    errors.push('競業禁止每月補償金不得低於月平均工資的 50%');
  return errors;
}

function compute(d) {
  const start = utc(d.hire_date);
  const end = addDays(utc(d.termination_date), 1); // 含離職日
  let months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + (end.getUTCMonth() - start.getUTCMonth());
  if (addMonths(start, months) > end) months -= 1;
  const days = Math.round((end - addMonths(start, months)) / DAY);
  const totalMonths = months + days / 30;
  const billable = Math.max(totalMonths, 1); // 勞退條例第12條：未滿1個月以1個月計
  const baseMonths = Math.min(billable / 24, 6);
  const severance = Math.round(d.avg_wage * baseMonths);
  const baseText = days === 0
    ? (() => { const g = gcd(months, 24); return months / g === 1 && 24 / g === 1 ? '1' : `${months / g}/${24 / g}`; })()
    : baseMonths.toFixed(4);
  const required = totalMonths < 3 ? 0 : totalMonths < 12 ? 10 : totalMonths < 36 ? 20 : 30;
  const given = Math.round((utc(d.termination_date) - utc(d.notice_date)) / DAY);
  const shortfall = Math.max(0, required - given);
  const noticeWage = Math.round((d.monthly_wage / 30) * shortfall);
  const box = (c) => (c ? '☑' : '☐');
  const out = {
    tenure_text: `${Math.floor(months / 12)}年${months % 12}個月${days ? `又${days}日` : ''}`,
    severance_base_text: `${baseText}`,
    severance_pay: severance,
    notice_days_required: required,
    notice_days_given: given,
    notice_shortfall_days: shortfall,
    has_notice_shortfall: shortfall > 0,
    notice_wage: noticeWage,
    notification_deadline: iso(addDays(utc(d.termination_date), -10)),
    severance_deadline: iso(addDays(utc(d.termination_date), 30)),
    noncompete_min_compensation: Math.round(d.avg_wage * 0.5),
    enforce_box_notary: box(d.enforce_option === 'notary'),
    enforce_box_mediation: box(d.enforce_option === 'mediation'),
    enforce_box_none: box(d.enforce_option === 'none'),
  };
  for (let i = 1; i <= 5; i++) out[`reason_box_${i}`] = box(Number(d.reason_clause) === i);
  out.total_payable = severance + noticeWage + ['unpaid_wage', 'overtime_pay', 'comp_leave_pay', 'annual_leave_pay', 'bonus_pay']
    .reduce((s, k) => s + Number(d[k] || 0), 0);
  return out;
}

const types = Object.fromEntries([...fields.inputs, ...fields.computed].map((f) => [f.key, f.type]));
const roc = (s) => { const [y, m, d] = s.split('-').map(Number); return `民國${y - 1911}年${m}月${d}日（${s}）`; };
function fmt(key, v) {
  const t = types[key];
  if (t === 'money') return Number(v).toLocaleString('en-US');
  if (t === 'date') return roc(v);
  return String(v);
}

const errors = validate(input);
if (errors.length) { console.error('輸入驗證失敗：\n- ' + errors.join('\n- ')); process.exit(1); }
const ctx = { ...input, ...compute(input) };

const renderLine = (line) => {
  let hadSection = false;
  let s = line.replace(/\{\{([#^])(\w+)\}\}(.*?)\{\{\/\2\}\}/g, (_, kind, key, body) => {
    hadSection = true;
    return (kind === '#' ? !!ctx[key] : !ctx[key]) ? body : '';
  });
  s = s.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in ctx)) throw new Error(`範本使用了未定義的變數：${key}`);
    return fmt(key, ctx[key]);
  });
  return { s, drop: hadSection && s.trim() === '' };
};

const lines = template.replace(/<!--[\s\S]*?-->\n*/, '').split('\n');
const out = [];
for (const line of lines) {
  const { s, drop } = renderLine(line);
  if (!drop) out.push(s);
}
const result = out.join('\n');
if (/\{\{|\}\}/.test(result)) { console.error('仍有未解析的標籤'); process.exit(1); }
if (outPath) { writeFileSync(outPath, result); console.log(`已輸出 ${outPath}`); } else process.stdout.write(result);
console.error(`[驗算] 年資 ${ctx.tenure_text}｜資遣費 ${fmt('severance_pay', ctx.severance_pay)}｜預告 ${ctx.notice_days_given}/${ctx.notice_days_required} 日，預告工資 ${fmt('notice_wage', ctx.notice_wage)}｜法定款項合計 ${fmt('total_payable', ctx.total_payable)}`);

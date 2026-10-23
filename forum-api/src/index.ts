/// <reference types="@cloudflare/workers-types" />

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  BUCKET: R2Bucket;
  ENVIRONMENT: string;
  MIN_AGE: string;
  NSFW_PENDING_THRESHOLD: string;
  MINOR_BLOCK_THRESHOLD: string;
  MAX_UPLOAD_BYTES: string;
  MODERATION_API_URL?: string;
  MODERATION_API_KEY?: string;
}

type Session = { userId: number; role: 'admin' | 'user'; verified: boolean };
type Scores = { nsfw: number; minor: number };

const SESSION_TTL = 60 * 60 * 24 * 7;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

// ---- Text filter -------------------------------------------------------
// Block: zero tolerance (anything sexualising minors, plus hard illegal solicitation).
// Review: held for a human moderator. Replace with a maintained list / classifier in production.
const BLOCK_PATTERNS = [
  /loli|shota|cp資源|兒童色情|幼[女童].{0,6}(性|色情|裸)|未成年.{0,6}(性|約|裸|援交)|child\s*porn|underage\s*sex/i,
  /迷姦|下藥.{0,4}(性|迷)|偷拍.{0,4}流出|復仇式?色情|revenge\s*porn/i,
];
const REVIEW_PATTERNS = [
  /約砲|援交|包養|賣淫|招嫖|性交易/,
  /加\s*(line|賴|wechat|微信|tg|telegram)\s*[:：]?\s*\S+/i,
  /https?:\/\/\S+/i, // links -> review (spam / malware)
  /自殺|殺了你|人肉/,
];

type TextVerdict = { status: 'published' | 'pending' | 'blocked'; reason?: string };

function filterText(...parts: string[]): TextVerdict {
  const text = parts.join('\n');
  for (const re of BLOCK_PATTERNS) if (re.test(text)) return { status: 'blocked', reason: `block:${re.source.slice(0, 24)}` };
  for (const re of REVIEW_PATTERNS) if (re.test(text)) return { status: 'pending', reason: `review:${re.source.slice(0, 24)}` };
  return { status: 'published' };
}

// ---- Helpers -----------------------------------------------------------
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

const clientIp = (req: Request) => req.headers.get('CF-Connecting-IP') ?? 'unknown';

async function readJson<T>(req: Request): Promise<T> {
  try { return (await req.json()) as T; } catch { throw new HttpError(400, 'invalid JSON body'); }
}

const b64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function pbkdf2(password: string, salt: Uint8Array, iter: number) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, 256);
}

async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iter = 100_000; // Workers WebCrypto max for PBKDF2
  return `pbkdf2$${iter}$${b64(salt)}$${b64(await pbkdf2(password, salt, iter))}`;
}

async function verifyPassword(password: string, stored: string) {
  const [, iter, salt, hash] = stored.split('$');
  const got = new Uint8Array(await pbkdf2(password, unb64(salt), Number(iter)));
  const want = unb64(hash);
  if (got.length !== want.length) return false;
  let diff = 0;
  for (let i = 0; i < got.length; i++) diff |= got[i] ^ want[i];
  return diff === 0;
}

async function rateLimit(env: Env, key: string, limit: number, windowSec: number) {
  const k = `rl:${key}`;
  const n = Number((await env.KV.get(k)) ?? 0);
  if (n >= limit) throw new HttpError(429, 'too many requests');
  await env.KV.put(k, String(n + 1), { expirationTtl: Math.max(windowSec, 60) }); // KV min TTL is 60s
}

async function audit(env: Env, adminId: number | null, action: string, targetId: number | null, ip: string) {
  await env.DB.prepare('INSERT INTO audit_logs (admin_id, action, target_id, ip_address) VALUES (?,?,?,?)')
    .bind(adminId, action, targetId, ip).run();
}

async function requireAuth(req: Request, env: Env, role?: 'admin'): Promise<Session> {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) throw new HttpError(401, 'missing token');
  const sess = await env.KV.get<Session>(`sess:${token}`, 'json');
  if (!sess) throw new HttpError(401, 'invalid or expired session');
  // Re-check on every call so bans take effect immediately.
  const u = await env.DB.prepare('SELECT is_banned, role, is_verified FROM users WHERE id = ?').bind(sess.userId).first<{ is_banned: number; role: string; is_verified: number }>();
  if (!u || u.is_banned) throw new HttpError(403, 'account suspended');
  const live: Session = { userId: sess.userId, role: u.role as Session['role'], verified: !!u.is_verified };
  if (role && live.role !== role) throw new HttpError(403, 'admin only');
  return live;
}

// ---- Image analysis (simulated external API) ---------------------------
// Production: set MODERATION_API_URL/KEY and use a CSAM-capable service
// (e.g. Cloudflare CSAM Scanning Tool, Microsoft PhotoDNA, Hive, Google Content Safety API).
async function analyzeImage(env: Env, bytes: ArrayBuffer, mime: string): Promise<Scores> {
  if (env.MODERATION_API_URL) {
    const res = await fetch(env.MODERATION_API_URL, {
      method: 'POST',
      headers: { 'content-type': mime, authorization: `Bearer ${env.MODERATION_API_KEY ?? ''}` },
      body: bytes,
    });
    if (!res.ok) throw new HttpError(502, 'moderation service unavailable'); // fail closed
    const d = (await res.json()) as { nsfw: number; minor: number };
    return { nsfw: d.nsfw, minor: d.minor };
  }
  // Mock: deterministic pseudo-scores derived from the content hash.
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return { nsfw: h[0] / 255, minor: (h[1] / 255) * 0.15 };
}

// ---- Handlers ----------------------------------------------------------
async function register(req: Request, env: Env) {
  const ip = clientIp(req);
  await rateLimit(env, `reg:${ip}`, 5, 3600);
  const b = await readJson<{ email?: string; phone?: string; password?: string; birth_year?: number }>(req);
  if (!b.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b.email)) throw new HttpError(400, 'invalid email');
  if (!b.password || b.password.length < 10) throw new HttpError(400, 'password must be at least 10 characters');
  const age = new Date().getUTCFullYear() - Number(b.birth_year);
  if (!Number.isInteger(b.birth_year) || age < Number(env.MIN_AGE)) throw new HttpError(403, `must be ${env.MIN_AGE}+`);

  const hash = await hashPassword(b.password);
  try {
    const r = await env.DB.prepare('INSERT INTO users (email, phone, password_hash, birth_year) VALUES (?,?,?,?)')
      .bind(b.email.toLowerCase(), b.phone ?? null, hash, b.birth_year).run();
    const id = r.meta.last_row_id;
    await audit(env, null, 'register', id, ip);
    return json({ id }, 201);
  } catch (e) {
    if (String(e).includes('UNIQUE')) throw new HttpError(409, 'email or phone already registered');
    throw e;
  }
}

async function login(req: Request, env: Env) {
  const ip = clientIp(req);
  await rateLimit(env, `login:${ip}`, 10, 600);
  const b = await readJson<{ email?: string; password?: string }>(req);
  const u = await env.DB.prepare('SELECT id, role, is_verified, is_banned, password_hash FROM users WHERE email = ?')
    .bind((b.email ?? '').toLowerCase()).first<{ id: number; role: Session['role']; is_verified: number; is_banned: number; password_hash: string }>();
  if (!u || !b.password || !(await verifyPassword(b.password, u.password_hash))) throw new HttpError(401, 'invalid credentials');
  if (u.is_banned) throw new HttpError(403, 'account suspended');
  const token = b64(crypto.getRandomValues(new Uint8Array(32))).replace(/[+/=]/g, '');
  const sess: Session = { userId: u.id, role: u.role, verified: !!u.is_verified };
  await env.KV.put(`sess:${token}`, JSON.stringify(sess), { expirationTtl: SESSION_TTL });
  await audit(env, null, 'login', u.id, ip);
  return json({ token });
}

async function createPost(req: Request, env: Env) {
  const s = await requireAuth(req, env);
  const ip = clientIp(req);
  await rateLimit(env, `post:${s.userId}`, 20, 3600);
  const b = await readJson<{ title?: string; content?: string; category?: string }>(req);
  const title = b.title?.trim(), content = b.content?.trim();
  if (!title || !content || title.length > 120 || content.length > 20_000) throw new HttpError(400, 'invalid title/content');
  const category = b.category ?? 'general';
  if (category === 'adult' && !s.verified) throw new HttpError(403, 'verification required for adult category');

  const v = filterText(title, content);
  const r = await env.DB.prepare('INSERT INTO posts (user_id, title, content, category, status) VALUES (?,?,?,?,?)')
    .bind(s.userId, title, content, category, v.status).run();
  const postId = r.meta.last_row_id;
  if (v.status !== 'published') await audit(env, null, `auto_${v.status}_post:${v.reason}`, postId, ip);
  // Never echo the matched rule to the client (avoids filter probing).
  return json({ id: postId, status: v.status }, v.status === 'blocked' ? 422 : 201);
}

async function upload(req: Request, env: Env) {
  const s = await requireAuth(req, env);
  const ip = clientIp(req);
  await rateLimit(env, `up:${s.userId}`, 30, 3600);
  const form = await req.formData();
  const entry = form.get('file') as unknown;
  if (!entry || typeof entry === 'string') throw new HttpError(400, 'file field required');
  const file = entry as File;
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) throw new HttpError(415, 'unsupported type');
  if (file.size > Number(env.MAX_UPLOAD_BYTES)) throw new HttpError(413, 'file too large');

  let postId: number | null = null;
  const pid = form.get('post_id');
  if (pid) {
    postId = Number(pid);
    const own = await env.DB.prepare('SELECT 1 FROM posts WHERE id = ? AND user_id = ?').bind(postId, s.userId).first();
    if (!own) throw new HttpError(403, 'post not found or not yours');
  }

  const bytes = await file.arrayBuffer();
  const { nsfw, minor } = await analyzeImage(env, bytes, file.type);

  // Zero tolerance: possible minor => never persisted to R2, user suspended, escalated for human/legal review.
  if (minor >= Number(env.MINOR_BLOCK_THRESHOLD)) {
    const m = await env.DB.prepare(
      `INSERT INTO media (post_id, user_id, r2_url, nsfw_score, minor_score, ai_flag_reason, status) VALUES (?,?,?,?,?,?,'blocked')`)
      .bind(postId, s.userId, 'not-stored', nsfw, minor, 'possible_minor').run();
    await env.DB.batch([
      env.DB.prepare('UPDATE users SET is_banned = 1 WHERE id = ?').bind(s.userId),
      env.DB.prepare('INSERT INTO audit_logs (admin_id, action, target_id, ip_address) VALUES (NULL,?,?,?)')
        .bind('csam_suspect_autoban', m.meta.last_row_id, ip),
    ]);
    // TODO: report per local law (e.g. NCMEC CyberTipline / 台灣 iWIN / 165) and preserve evidence as legally required.
    return json({ error: 'upload rejected' }, 422);
  }

  const status = nsfw >= Number(env.NSFW_PENDING_THRESHOLD) ? 'pending' : 'approved';
  const ext = file.type.split('/')[1];
  const key = `u/${s.userId}/${crypto.randomUUID()}.${ext}`;
  await env.BUCKET.put(key, bytes, { httpMetadata: { contentType: file.type } });
  const m = await env.DB.prepare(
    `INSERT INTO media (post_id, user_id, r2_url, nsfw_score, minor_score, ai_flag_reason, status) VALUES (?,?,?,?,?,?,?)`)
    .bind(postId, s.userId, key, nsfw, minor, status === 'pending' ? 'high_nsfw' : null, status).run();
  return json({ id: m.meta.last_row_id, status }, 201);
}

async function moderationQueue(req: Request, env: Env) {
  await requireAuth(req, env, 'admin');
  const [posts, media, reports] = await env.DB.batch([
    env.DB.prepare(`SELECT id, user_id, title, substr(content,1,300) AS excerpt, category, status, created_at FROM posts WHERE status = 'pending' ORDER BY created_at LIMIT 100`),
    env.DB.prepare(`SELECT id, post_id, user_id, r2_url, nsfw_score, minor_score, ai_flag_reason, status FROM media WHERE status IN ('pending','blocked') ORDER BY minor_score DESC, nsfw_score DESC LIMIT 100`),
    env.DB.prepare(`SELECT id, post_id, reporter_id, reason FROM reports WHERE status = 'open' ORDER BY id LIMIT 100`),
  ]);
  return json({ posts: posts.results, media: media.results, reports: reports.results });
}

async function adminAction(req: Request, env: Env) {
  const s = await requireAuth(req, env, 'admin');
  const ip = clientIp(req);
  const b = await readJson<{ action?: string; target_id?: number }>(req);
  const id = Number(b.target_id);
  if (!Number.isInteger(id)) throw new HttpError(400, 'target_id required');

  const ops: Record<string, string> = {
    takedown_post: `UPDATE posts SET status = 'blocked' WHERE id = ?`,
    approve_post: `UPDATE posts SET status = 'published' WHERE id = ?`,
    block_media: `UPDATE media SET status = 'blocked' WHERE id = ?`,
    approve_media: `UPDATE media SET status = 'approved' WHERE id = ?`,
    ban_user: `UPDATE users SET is_banned = 1 WHERE id = ?`,
    unban_user: `UPDATE users SET is_banned = 0 WHERE id = ?`,
    resolve_report: `UPDATE reports SET status = 'resolved' WHERE id = ?`,
  };
  const sql = b.action && ops[b.action];
  if (!sql) throw new HttpError(400, `action must be one of: ${Object.keys(ops).join(', ')}`);
  if (b.action === 'ban_user' && id === s.userId) throw new HttpError(400, 'cannot ban yourself');

  const [res] = await env.DB.batch([
    env.DB.prepare(sql).bind(id),
    env.DB.prepare('INSERT INTO audit_logs (admin_id, action, target_id, ip_address) VALUES (?,?,?,?)').bind(s.userId, b.action, id, ip),
  ]);
  if (!res.meta.changes) throw new HttpError(404, 'target not found');
  return json({ ok: true });
}

// ---- Router ------------------------------------------------------------
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(req.url);
    try {
      const route = `${req.method} ${pathname}`;
      switch (route) {
        case 'POST /api/auth/register': return await register(req, env);
        case 'POST /api/auth/login': return await login(req, env);
        case 'POST /api/posts/create': return await createPost(req, env);
        case 'POST /api/upload': return await upload(req, env);
        case 'GET /api/admin/moderation': return await moderationQueue(req, env);
        case 'POST /api/admin/action': return await adminAction(req, env);
        default: return json({ error: 'not found' }, 404);
      }
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      console.error(e);
      return json({ error: 'internal error' }, 500);
    }
  },
} satisfies ExportedHandler<Env>;

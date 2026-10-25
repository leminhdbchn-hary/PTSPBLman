import fs from "node:fs";
// Máy chủ "Supabase giả" dùng để chạy kiểm thử đầu-cuối trên máy: KHÔNG phải sản phẩm.
// Nó nói giao thức của Supabase (Auth, PostgREST, Storage) nhưng phía sau là một PostgreSQL thật đã chạy migration thật,
// và mọi truy vấn đều chạy dưới role `authenticated` với JWT của người dùng nên Row Level Security được áp dụng đúng như thật.
import http from "node:http";
import crypto from "node:crypto";
import pg from "pg";

pg.types.setTypeParser(1082, (v) => v); // date → chuỗi, không đổi múi giờ
pg.types.setTypeParser(20, (v) => Number(v));

const SECRET = "fake-jwt-secret";
const b64 = (b) => Buffer.from(b).toString("base64url");
const sign = (payload) => {
  const h = b64(JSON.stringify({ alg: "HS256", typ: "JWT" })), p = b64(JSON.stringify(payload));
  return `${h}.${p}.${crypto.createHmac("sha256", SECRET).update(`${h}.${p}`).digest("base64url")}`;
};
function verify(tok) {
  const [h, p, s] = String(tok || "").split(".");
  if (!s) return null;
  if (crypto.createHmac("sha256", SECRET).update(`${h}.${p}`).digest("base64url") !== s) return null;
  try { const d = JSON.parse(Buffer.from(p, "base64url").toString()); return d.exp * 1000 > Date.now() ? d : null; } catch { return null; }
}

export async function startFake({ pgConfig, port }) {
  const pool = new pg.Pool({ ...pgConfig, max: 8 });
  const passwords = new Map(); // email -> mật khẩu (chỉ để thử)
  const files = new Map(); // path -> Buffer
  const refresh = new Map();
  const state = { lastRecover: null, sent: [] };

  const sess = (u) => {
    const now = Math.floor(Date.now() / 1000);
    const access = sign({ sub: u.id, email: u.email, role: "authenticated", aud: "authenticated", iat: now, exp: now + 3600 });
    const rt = crypto.randomUUID();
    refresh.set(rt, u.id);
    return { access_token: access, token_type: "bearer", expires_in: 3600, expires_at: now + 3600, refresh_token: rt, user: userJson(u) };
  };
  const userJson = (u) => ({
    id: u.id, aud: "authenticated", role: "authenticated", email: u.email, email_confirmed_at: new Date().toISOString(),
    app_metadata: { provider: "email" }, user_metadata: u.raw_user_meta_data ?? {}, identities: [{ id: u.id, user_id: u.id, provider: "email" }], created_at: new Date().toISOString(),
  });

  // chạy 1 khối SQL dưới danh nghĩa người dùng (RLS áp dụng)
  async function asUser(claims, fn) {
    const c = await pool.connect();
    try {
      await c.query("begin");
      await c.query(`set local role ${claims ? "authenticated" : "anon"}`);
      await c.query("select set_config('request.jwt.claim.sub', $1, true)", [claims?.sub ?? ""]);
      const r = await fn(c);
      await c.query("commit");
      return r;
    } catch (e) { await c.query("rollback").catch(() => {}); throw e; } finally { c.release(); }
  }

  const ident = (s) => { if (!/^[a-z_][a-z0-9_]*$/.test(s)) throw Object.assign(new Error("bad ident " + s), { status: 400 }); return `"${s}"`; };
  const splitTop = (s) => { const out = []; let d = 0, cur = ""; for (const ch of s) { if (ch === "(") d++; if (ch === ")") d--; if (ch === "," && d === 0) { out.push(cur); cur = ""; } else cur += ch; } if (cur) out.push(cur); return out; };
  const unq = (v) => (v.startsWith('"') && v.endsWith('"') ? v.slice(1, -1).replace(/\\"/g, '"') : v);
  const parseArr = (v) => (v.replace(/^[{(]|[})]$/g, "") ? splitTop(v.replace(/^[{(]|[})]$/g, "")).map((x) => unq(x.trim())) : []);

  function cond(col, spec, params) {
    let neg = false;
    if (spec.startsWith("not.")) { neg = true; spec = spec.slice(4); }
    const dot = spec.indexOf(".");
    const op = spec.slice(0, dot), val = spec.slice(dot + 1);
    const c = ident(col);
    let sql;
    const P = (v) => { params.push(v); return `$${params.length}`; };
    switch (op) {
      case "eq": sql = `${c} = ${P(val)}`; break;
      case "neq": sql = `${c} <> ${P(val)}`; break;
      case "gt": sql = `${c} > ${P(val)}`; break;
      case "gte": sql = `${c} >= ${P(val)}`; break;
      case "lt": sql = `${c} < ${P(val)}`; break;
      case "lte": sql = `${c} <= ${P(val)}`; break;
      case "like": sql = `${c} like ${P(val)}`; break;
      case "ilike": sql = `${c}::text ilike ${P(val)}`; break;
      case "is": sql = val === "null" ? `${c} is null` : `${c} is ${val === "true" ? "true" : "false"}`; break;
      case "in": sql = `${c} = any(${P(parseArr(val))})`; break;
      case "cs": sql = `${c} @> ${P(parseArr(val))}::text[]`; break;
      case "ov": sql = `${c} && ${P(parseArr(val))}::text[]`; break;
      default: throw Object.assign(new Error("op " + op), { status: 400 });
    }
    return neg ? `not (${sql})` : sql;
  }

  function where(url, params) {
    const parts = [];
    for (const [k, v] of url.searchParams) {
      if (["select", "order", "limit", "offset", "columns", "on_conflict"].includes(k)) continue;
      if (k === "or") {
        const inner = splitTop(v.replace(/^\(|\)$/g, "")).map((e) => { const i = e.indexOf("."); return cond(e.slice(0, i), e.slice(i + 1), params); });
        parts.push(`(${inner.join(" or ")})`);
      } else parts.push(cond(k, v, params));
    }
    return parts.length ? " where " + parts.join(" and ") : "";
  }

  function selectList(sel, table) {
    if (!sel || sel === "*") return "*";
    return splitTop(sel).map((t) => {
      t = t.trim();
      const m = /^([a-z_]+)\((.*)\)$/.exec(t);
      if (m) { // nhúng bảng cha qua khoá ngoại <bảng>_id (đủ cho trường hợp families trong family_memberships)
        const fk = table === "family_memberships" && m[1] === "families" ? "family_id" : null;
        if (!fk) throw Object.assign(new Error("embed " + t), { status: 400 });
        return `(select to_jsonb(e) from (select ${selectList(m[2], m[1])} from public.${ident(m[1])} e where e.id = ${ident(table)}.${fk}) e) as ${ident(m[1])}`;
      }
      return ident(t);
    }).join(", ");
  }

  const pgErr = (e) => {
    const code = e.code ?? "XX000";
    const status = code === "42501" ? 403 : code === "23505" ? 409 : code === "P0002" ? 404 : String(code).startsWith("22") || String(code).startsWith("23") || code === "P0001" ? 400 : 400;
    return { status, body: { code, message: e.message, details: e.detail ?? null, hint: null } };
  };

  async function rest(req, res, url, claims, body) {
    const path = url.pathname.replace("/rest/v1/", "");
    const accept = req.headers.accept || "";
    const prefer = req.headers.prefer || "";
    const single = accept.includes("vnd.pgrst.object");
    const wantRows = /return=representation/.test(prefer);
    const countExact = /count=exact/.test(prefer);
    try {
      if (path.startsWith("rpc/")) {
        const fn = ident(path.slice(4));
        const args = body && typeof body === "object" ? body : {};
        const keys = Object.keys(args);
        const call = `public.${fn}(${keys.map((k, i) => `${ident(k)} := $${i + 1}`).join(", ")})`;
        const SET = ["people_directory", "preview_invitation"];
        const r = await asUser(claims, (c) => c.query(SET.includes(path.slice(4)) ? `select * from ${call}` : `select ${call} as r`, keys.map((k) => args[k])));
        const out = SET.includes(path.slice(4)) ? r.rows : (r.rows[0]?.r ?? null);
        return json(res, 200, out);
      }
      const table = ident(path);
      const params = [];
      if (req.method === "GET" || req.method === "HEAD") {
        const sel = selectList(url.searchParams.get("select"), path);
        let sql = `select ${sel} from public.${table}${where(url, params)}`;
        const order = url.searchParams.get("order");
        if (order) sql += " order by " + order.split(",").map((o) => { const [c, ...r] = o.split("."); return `${ident(c)} ${r.includes("desc") ? "desc" : "asc"}${r.includes("nullslast") ? " nulls last" : r.includes("nullsfirst") ? " nulls first" : ""}`; }).join(", ");
        if (url.searchParams.get("limit")) sql += ` limit ${Number(url.searchParams.get("limit"))}`;
        if (url.searchParams.get("offset")) sql += ` offset ${Number(url.searchParams.get("offset"))}`;
        const rows = await asUser(claims, async (c) => (await c.query(sql, params)).rows);
        let cnt = null;
        if (countExact) { // đếm tổng (bỏ giới hạn trang) với cùng bộ lọc
          const p2 = []; const w = where(url, p2);
          cnt = await asUser(claims, async (c) => Number((await c.query(`select count(*) n from public.${table}${w}`, p2)).rows[0].n));
        }
        const headers = countExact ? { "Content-Range": `0-${Math.max(rows.length - 1, 0)}/${cnt}` } : {};
        if (req.method === "HEAD") { res.writeHead(200, { ...headers }); return res.end(); }
        if (single) {
          if (rows.length !== 1) return json(res, 406, { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned", details: `The result contains ${rows.length} rows` });
          return json(res, 200, rows[0], headers);
        }
        return json(res, 200, rows, headers);
      }
      if (req.method === "POST") {
        const rowsIn = Array.isArray(body) ? body : [body];
        const cols = [...new Set(rowsIn.flatMap((r) => Object.keys(r)))];
        const vals = []; const tuples = rowsIn.map((r) => `(${cols.map((c) => { vals.push(r[c] === undefined ? null : r[c]); return `$${vals.length}`; }).join(", ")})`);
        // cột không có trong một dòng nhận giá trị mặc định (null sẽ ghi đè mặc định) — nên chỉ dùng cột chung cho mọi dòng
        const sql = `insert into public.${table} (${cols.map(ident).join(", ")}) values ${tuples.join(", ")}${wantRows ? ` returning ${selectList(url.searchParams.get("select"), path)}` : ""}`;
        const r = await asUser(claims, (c) => c.query(sql, vals));
        if (!wantRows) { res.writeHead(201); return res.end(); }
        if (single) return json(res, 201, r.rows[0]);
        return json(res, 201, r.rows);
      }
      if (req.method === "PATCH") {
        const cols = Object.keys(body);
        const vals = cols.map((c) => body[c]);
        const params2 = [...vals];
        const sets = cols.map((c, i) => `${ident(c)} = $${i + 1}`).join(", ");
        const w = where(url, params2);
        const sql = `update public.${table} set ${sets}${w}${wantRows ? ` returning ${selectList(url.searchParams.get("select"), path)}` : ""}`;
        const r = await asUser(claims, (c) => c.query(sql, params2));
        if (!wantRows) { res.writeHead(204); return res.end(); }
        if (single) return r.rows.length === 1 ? json(res, 200, r.rows[0]) : json(res, 406, { code: "PGRST116", message: "no rows" });
        return json(res, 200, r.rows);
      }
      if (req.method === "DELETE") {
        const w = where(url, params);
        const sql = `delete from public.${table}${w}${wantRows ? ` returning ${selectList(url.searchParams.get("select"), path)}` : ""}`;
        const r = await asUser(claims, (c) => c.query(sql, params));
        if (!wantRows) { res.writeHead(204); return res.end(); }
        return json(res, 200, r.rows);
      }
      return json(res, 405, { message: "method" });
    } catch (e) {
      const { status, body: b } = e.status ? { status: e.status, body: { message: e.message } } : pgErr(e);
      return json(res, status, b);
    }
  }

  async function auth(req, res, url, claims, body) {
    const p = url.pathname.replace("/auth/v1", "");
    if (p === "/signup" && req.method === "POST") {
      const email = String(body.email).toLowerCase();
      const ex = await pool.query("select id from auth.users where lower(email) = $1", [email]);
      if (ex.rows.length) { // Supabase trả về user "ảo" với identities rỗng khi email đã tồn tại
        return json(res, 200, { ...userJson({ id: crypto.randomUUID(), email, raw_user_meta_data: {} }), identities: [] });
      }
      const r = await pool.query("insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning *", [email, body.data ?? {}]);
      passwords.set(email, body.password);
      return json(res, 200, sess(r.rows[0]));
    }
    if (p === "/token" && req.method === "POST") {
      const grant = url.searchParams.get("grant_type");
      if (grant === "password") {
        const email = String(body.email).toLowerCase();
        const r = await pool.query("select * from auth.users where lower(email) = $1", [email]);
        if (!r.rows.length || passwords.get(email) !== body.password) return json(res, 400, { code: 400, error_code: "invalid_credentials", msg: "Invalid login credentials", message: "Invalid login credentials" });
        return json(res, 200, sess(r.rows[0]));
      }
      if (grant === "refresh_token") {
        const uid = refresh.get(body.refresh_token);
        if (!uid) return json(res, 400, { message: "Invalid Refresh Token" });
        return json(res, 200, sess((await pool.query("select * from auth.users where id = $1", [uid])).rows[0]));
      }
    }
    if (p === "/user" && req.method === "GET") {
      if (!claims) return json(res, 401, { code: 401, error_code: "no_authorization", msg: "missing sub claim" });
      const r = await pool.query("select * from auth.users where id = $1", [claims.sub]);
      return r.rows.length ? json(res, 200, userJson(r.rows[0])) : json(res, 401, { msg: "user not found" });
    }
    if (p === "/user" && req.method === "PUT") {
      if (!claims) return json(res, 401, { msg: "unauthorized" });
      const r = await pool.query("select * from auth.users where id = $1", [claims.sub]);
      if (body.password) passwords.set(r.rows[0].email.toLowerCase(), body.password);
      return json(res, 200, userJson(r.rows[0]));
    }
    if (p === "/logout") { res.writeHead(204); return res.end(); }
    if (p === "/recover") { state.lastRecover = body.email; return json(res, 200, {}); }
    return json(res, 404, { msg: "unsupported auth route " + p });
  }

  // supabase-js gửi FormData (multipart) khi tải lên từ trình duyệt: tách phần tệp ra như Storage thật
  function parseUpload(buf, ct) {
    const m = /multipart\/form-data;\s*boundary=(?:"([^"]+)"|([^;]+))/i.exec(ct);
    if (!m) return { buf, type: ct };
    const sep = Buffer.from("--" + (m[1] || m[2]));
    let pos = buf.indexOf(sep);
    while (pos !== -1) {
      const start = pos + sep.length;
      const next = buf.indexOf(sep, start);
      if (next === -1) break;
      const part = buf.subarray(start + 2, next - 2); // bỏ CRLF đầu và cuối
      const hdrEnd = part.indexOf("\r\n\r\n");
      const hdr = part.subarray(0, hdrEnd).toString();
      const type = /content-type:\s*([^\r\n]+)/i.exec(hdr);
      if (type) return { buf: part.subarray(hdrEnd + 4), type: type[1].trim() };
      pos = next;
    }
    return { buf, type: ct };
  }

  async function storage(req, res, url, claims, rawBody) {
    const p = decodeURIComponent(url.pathname.replace("/storage/v1", ""));
    try {
      let m;
      if ((m = /^\/object\/sign\/family-media$/.exec(p)) && req.method === "POST") {
        const { paths } = JSON.parse(rawBody.toString());
        const out = [];
        for (const path of paths) {
          const ok = await asUser(claims, async (c) => (await c.query("select 1 from storage.objects where bucket_id = 'family-media' and name = $1", [path])).rows.length > 0);
          out.push(ok ? { path, signedURL: `/object/sign/family-media/${encodeURI(path)}?token=${b64(path)}`, error: null } : { path, signedURL: null, error: "Object not found" });
        }
        return json(res, 200, out);
      }
      if ((m = /^\/object\/sign\/family-media\/(.+)$/.exec(p)) && req.method === "GET") {
        const f = files.get(m[1]);
        if (!f) return json(res, 404, { message: "not found" });
        res.writeHead(200, { "Content-Type": f.type }); return res.end(f.buf);
      }
      if ((m = /^\/object\/family-media\/(.+)$/.exec(p)) && (req.method === "POST" || req.method === "PUT")) {
        const name = m[1];
        await asUser(claims, (c) => c.query("insert into storage.objects (bucket_id, name, owner) values ('family-media', $1, auth.uid())", [name]));
        // Supabase lưu cả phần multipart; ở đây giữ nguyên byte thô (đủ để kiểm tra tải lên/hiển thị)
        files.set(name, parseUpload(rawBody, req.headers["content-type"] || "application/octet-stream"));
        return json(res, 200, { Key: `family-media/${name}`, Id: crypto.randomUUID() });
      }
      if ((m = /^\/object\/family-media$/.exec(p)) && req.method === "DELETE") {
        const { prefixes } = JSON.parse(rawBody.toString());
        const removed = [];
        for (const name of prefixes) {
          const r = await asUser(claims, (c) => c.query("delete from storage.objects where bucket_id = 'family-media' and name = $1 returning name", [name]));
          if (r.rows.length) { files.delete(name); removed.push({ name }); }
        }
        return json(res, 200, removed);
      }
      if ((m = /^\/object\/list\/family-media$/.exec(p)) && req.method === "POST") {
        const { prefix = "" } = JSON.parse(rawBody.toString() || "{}");
        const r = await asUser(claims, (c) => c.query("select name from storage.objects where bucket_id = 'family-media' and name like $1", [prefix + "/%"]));
        const seen = new Map();
        for (const { name } of r.rows) { const rest = name.slice(prefix.length + 1); const first = rest.split("/")[0]; seen.set(first, rest.includes("/") ? { name: first, id: null } : { name: first, id: crypto.randomUUID() }); }
        return json(res, 200, [...seen.values()]);
      }
      return json(res, 404, { message: "unsupported storage route " + p });
    } catch (e) { const x = pgErr(e); return json(res, x.status === 400 ? 400 : x.status, { statusCode: String(x.status), error: "Unauthorized", message: e.message }); }
  }

  function json(res, status, body, headers = {}) {
    res.writeHead(status, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", ...headers });
    res.end(body === undefined ? "" : JSON.stringify(body));
  }

  const server = http.createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS");
    if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
    const url = new URL(req.url, "http://x");
    if (process.env.FAKE_LOG) { const t0 = Date.now(); res.on("finish", () => { if (res.statusCode >= 400 || Date.now() - t0 > 1500) fs.appendFileSync(process.env.FAKE_LOG, `${res.statusCode} ${Date.now() - t0}ms ${req.method} ${req.url.slice(0, 200)}\n`); }); }
    const chunks = []; for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks);
    const claims = verify((req.headers.authorization || "").replace(/^Bearer /, ""));
    try {
      if (url.pathname === "/__test/state") return json(res, 200, state);
      const ct = req.headers["content-type"] || "";
      const body = ct.includes("json") && raw.length ? JSON.parse(raw.toString()) : null;
      if (url.pathname.startsWith("/rest/v1/")) return rest(req, res, url, claims, body);
      if (url.pathname.startsWith("/auth/v1/")) return auth(req, res, url, claims, body ?? {});
      if (url.pathname.startsWith("/storage/v1/")) return storage(req, res, url, claims, raw);
      json(res, 404, { message: "not found" });
    } catch (e) { json(res, 500, { message: String(e?.message ?? e) }); }
  });
  await new Promise((r) => server.listen(port, "127.0.0.1", r));
  return { close: async () => { server.close(); await pool.end(); }, files, state };
}

// PostgreSQL tạm trong máy (embedded-postgres) + phần giả lập schema auth/storage của Supabase + migration thật.
import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export async function startLocalDb(port = 54329) {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), "nepnha-pg-"));
  fs.chmodSync(parent, 0o777); // chạy bằng root thì Postgres tự đổi sang user `postgres`: để nó tự tạo thư mục dữ liệu con
  const server = new EmbeddedPostgres({ databaseDir: path.join(parent, "data"), user: "postgres", password: "pw", port, persistent: false, onLog: () => {}, onError: () => {} });
  await server.initialise();
  await server.start();
  const config = { host: "127.0.0.1", port, user: "postgres", password: "pw", database: "postgres" };
  const admin = new pg.Client(config);
  await admin.connect();
  await admin.query(`
    create role anon nologin; create role authenticated nologin;
    create schema auth; create schema storage;
    create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid default auth.uid());
    alter table storage.objects enable row level security;
    create function storage.foldername(name text) returns text[] language sql immutable as $$
      select (string_to_array(name, '/'))[1:greatest(array_length(string_to_array(name, '/'), 1) - 1, 0)] $$;
    grant usage on schema auth, storage to anon, authenticated;
    grant execute on function auth.uid(), storage.foldername(text) to anon, authenticated;
    grant select, insert, update, delete on storage.objects to authenticated;
  `);
  const dir = path.join(here, "../../supabase/migrations");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) await admin.query(fs.readFileSync(path.join(dir, f), "utf8"));
  return {
    config, admin, migrations: files.length,
    stop: async () => { await admin.end().catch(() => {}); await server.stop().catch(() => {}); fs.rmSync(parent, { recursive: true, force: true }); },
  };
}

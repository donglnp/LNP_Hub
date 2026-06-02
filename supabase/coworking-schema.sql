-- ============================================================
-- LNP Hub — Coworking day schema (run in HUB Supabase)
-- Tracks which days each user plans to come into the office, so
-- teammates can self-coordinate and come in together.
-- Idempotent — safe to re-run.
-- ============================================================

-- ============================================================
-- 1. TABLE CREATIONS
-- ============================================================

-- ---------- coworking_attendance ----------
-- One row per (user, date). Presence of the row = user plans to come in.
create table if not exists public.coworking_attendance (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  date       date not null,
  source     text not null default 'manual' check (source in ('manual', 'pattern')),
  created_at timestamptz not null default now(),
  primary key (user_id, date)
);

create index if not exists coworking_attendance_date_idx
  on public.coworking_attendance(date);

-- ---------- coworking_patterns ----------
-- A user's recurring weekly intent. The FE expands this into concrete
-- attendance rows for the next few weeks; we never run a server-side cron.
create table if not exists public.coworking_patterns (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  weekdays   smallint[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 2. ROW LEVEL SECURITY
-- ============================================================
alter table public.coworking_attendance enable row level security;
alter table public.coworking_patterns enable row level security;

-- ---------- attendance policies ----------
drop policy if exists "read attendance" on public.coworking_attendance;
create policy "read attendance"
  on public.coworking_attendance for select to authenticated using (true);

drop policy if exists "user write own attendance" on public.coworking_attendance;
create policy "user write own attendance"
  on public.coworking_attendance for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------- pattern policies ----------
drop policy if exists "read patterns" on public.coworking_patterns;
create policy "read patterns"
  on public.coworking_patterns for select to authenticated using (true);

drop policy if exists "user write own pattern" on public.coworking_patterns;
create policy "user write own pattern"
  on public.coworking_patterns for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- 3. SEED CATALOG
-- ============================================================
insert into public.games (slug, name, description, icon, path, accent, sort_order, enabled)
values
  ('coworking-day', 'Coworking day',
   'Đăng ký ngày bạn lên cty để mọi người tự rủ nhau lên cùng.',
   '🏢', '/coworking-day', 'blue', 25, true)
on conflict (slug) do update set
  enabled = true;

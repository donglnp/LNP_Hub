-- ============================================================
-- LNP Hub — Wellness Challenge schema (run in HUB Supabase)
-- Extends public.profiles + adds public.wellness_entries.
-- Admin-only writes; everyone authenticated can read for leaderboard.
-- Photos are stored as external URLs (no Supabase Storage).
-- Idempotent — safe to re-run.
-- ============================================================

-- ---------- profile extensions ----------
alter table public.profiles
  add column if not exists gender text,
  add column if not exists is_admin boolean not null default false,
  add column if not exists joined_wellness boolean not null default true;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_gender_check'
  ) then
    alter table public.profiles
      add constraint profiles_gender_check check (gender in ('male','female') or gender is null);
  end if;
end$$;

-- Relax profile read so leaderboard can show other users' names.
drop policy if exists "read own profile" on public.profiles;
drop policy if exists "read all profiles" on public.profiles;
create policy "read all profiles"
  on public.profiles for select to authenticated using (true);

-- Admins can update any profile (set gender, toggle joined_wellness, grant admin).
drop policy if exists "admin update any profile" on public.profiles;
create policy "admin update any profile"
  on public.profiles for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

-- ---------- self-service gender ----------
-- Users set their OWN gender (set-once) without us opening a broad UPDATE policy
-- on profiles (which would let them flip is_admin / joined_wellness). This
-- SECURITY DEFINER fn touches only the gender column for the caller, and only
-- while it is still null — admins can still override via "admin update any profile".
create or replace function public.set_my_gender(g text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if g not in ('male', 'female') then
    raise exception 'invalid gender: %', g;
  end if;
  update public.profiles
    set gender = g
    where id = auth.uid() and gender is null;
end $$;

revoke all on function public.set_my_gender(text) from public;
grant execute on function public.set_my_gender(text) to authenticated;

-- ---------- wellness_entries ----------
create table if not exists public.wellness_entries (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  entry_date      date not null,
  exercise_type   text not null check (exercise_type in ('run','walk','cycle','swim','gym','other')),
  duration_min   int  not null check (duration_min > 0 and duration_min <= 120),
  kcal            int  not null check (kcal > 0),
  device          text,
  photo_before_url text not null,
  photo_after_url  text not null,
  status          text not null default 'approved' check (status in ('pending','approved','rejected')),
  notes           text,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, entry_date)
);

create index if not exists wellness_entries_user_idx on public.wellness_entries (user_id);
create index if not exists wellness_entries_date_idx on public.wellness_entries (entry_date);

alter table public.wellness_entries enable row level security;

-- All authenticated users can read approved entries (for leaderboard + their own).
-- Admins can read everything (pending/rejected) so they can review submissions.
drop policy if exists "read entries" on public.wellness_entries;
create policy "read entries"
  on public.wellness_entries for select to authenticated
  using (
    status = 'approved'
    or user_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Only admins can insert/update/delete.
drop policy if exists "admin insert entries" on public.wellness_entries;
create policy "admin insert entries"
  on public.wellness_entries for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

drop policy if exists "admin update entries" on public.wellness_entries;
create policy "admin update entries"
  on public.wellness_entries for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

drop policy if exists "admin delete entries" on public.wellness_entries;
create policy "admin delete entries"
  on public.wellness_entries for delete to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- Auto-bump updated_at.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_wellness_entries_touch on public.wellness_entries;
create trigger trg_wellness_entries_touch
  before update on public.wellness_entries
  for each row execute function public.touch_updated_at();

-- Realtime (optional — leaderboard live updates).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'wellness_entries'
  ) then
    alter publication supabase_realtime add table public.wellness_entries;
  end if;
end$$;

-- ---------- guest entries (admin logs for users who haven't signed in yet) ----------
-- user_id becomes optional; user_email is used when user hasn't logged in.
-- Exactly one of (user_id, user_email) must be set.
alter table public.wellness_entries
  alter column user_id drop not null,
  add column if not exists user_email text;

alter table public.wellness_entries
  drop constraint if exists wellness_entries_subject_check;
alter table public.wellness_entries
  add constraint wellness_entries_subject_check
  check (
    (user_id is not null and user_email is null)
    or (user_id is null and user_email is not null)
  );

-- Replace unique(user_id, entry_date) with partial uniques per key type.
alter table public.wellness_entries
  drop constraint if exists wellness_entries_user_id_entry_date_key;

create unique index if not exists wellness_entries_user_date_uidx
  on public.wellness_entries (user_id, entry_date)
  where user_id is not null;

create unique index if not exists wellness_entries_email_date_uidx
  on public.wellness_entries (lower(user_email), entry_date)
  where user_email is not null;

-- ---------- exercise_other / device_other (custom names when value='other') ----------
alter table public.wellness_entries
  add column if not exists exercise_other text,
  add column if not exists device_other text;

-- ---------- self-submit (users log their own entries) ----------
-- Photos are now optional: users submit without photos; admin attaches them on review.
alter table public.wellness_entries
  alter column photo_before_url drop not null,
  alter column photo_after_url drop not null;

-- Users can insert their OWN entries, but only as 'pending' and only for their auth.uid().
drop policy if exists "user insert own pending" on public.wellness_entries;
create policy "user insert own pending"
  on public.wellness_entries for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');

-- Users can update their OWN entries while still pending. Once admin moves it
-- to approved/rejected, only admin can edit (status must stay pending in WITH CHECK,
-- so user cannot self-approve).
drop policy if exists "user update own pending" on public.wellness_entries;
create policy "user update own pending"
  on public.wellness_entries for update to authenticated
  using (user_id = auth.uid() and status = 'pending')
  with check (user_id = auth.uid() and status = 'pending');

-- Users can delete their OWN entries while still pending.
drop policy if exists "user delete own pending" on public.wellness_entries;
create policy "user delete own pending"
  on public.wellness_entries for delete to authenticated
  using (user_id = auth.uid() and status = 'pending');

-- ---------- track who created each record ----------
-- created_by stores the auth.uid() of whoever inserts the row: the admin when
-- they log an entry on someone's behalf, or the user themselves on self-submit.
-- Setting it as a column DEFAULT means every insert path records it with no
-- app code change. Existing rows stay NULL (the data was never captured).
alter table public.wellness_entries
  alter column created_by set default auth.uid();

-- ---------- bootstrap first admin ----------
-- AFTER you log in once via Google, find your auth.users id and run:
--   update public.profiles set is_admin = true where email = 'your@lnp-technologies.com';

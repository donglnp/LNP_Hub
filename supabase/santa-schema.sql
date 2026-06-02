-- ============================================================
-- LNP Hub — Secret Santa / Gift Exchange schema (run in HUB Supabase)
-- Creates public.santa_events, public.santa_participants, public.santa_matches.
-- Enables RLS for strict secrecy of who draws who.
-- Idempotent — safe to re-run.
-- ============================================================

-- ============================================================
-- 1. TABLE CREATIONS
-- ============================================================

-- ---------- santa_events ----------
create table if not exists public.santa_events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  budget      text not null,
  status      text not null default 'registration' check (status in ('registration', 'matched', 'completed')),
  created_at  timestamptz not null default now()
);

-- ---------- santa_participants ----------
create table if not exists public.santa_participants (
  event_id        uuid not null references public.santa_events(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  wishlist        text not null,
  gift_sent       boolean not null default false,
  gift_received   boolean not null default false,
  created_at      timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- ---------- santa_matches ----------
create table if not exists public.santa_matches (
  event_id    uuid not null references public.santa_events(id) on delete cascade,
  giver_id    uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (event_id, giver_id),
  constraint santa_matches_no_self check (giver_id <> receiver_id)
);

-- ============================================================
-- 2. ROW LEVEL SECURITY (RLS) ENABLEMENT
-- ============================================================
alter table public.santa_events enable row level security;
alter table public.santa_participants enable row level security;
alter table public.santa_matches enable row level security;

-- ============================================================
-- 3. RLS POLICIES
-- ============================================================

-- ---------- santa_events policies ----------
drop policy if exists "read events" on public.santa_events;
create policy "read events"
  on public.santa_events for select to authenticated using (true);

drop policy if exists "admin write events" on public.santa_events;
create policy "admin write events"
  on public.santa_events for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- ---------- santa_participants policies ----------
-- Read rules:
-- 1. Users can read their own registration
-- 2. Givers can read their receiver's registration (need this to view their wishlist)
-- 3. Admins can read everything
drop policy if exists "read participants" on public.santa_participants;
create policy "read participants"
  on public.santa_participants for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.santa_matches m
       where m.event_id = santa_participants.event_id
         and m.giver_id = auth.uid()
         and m.receiver_id = santa_participants.user_id
    )
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Write rules:
-- 1. Users can insert/update their own registration ONLY if status is 'registration' (wishlist edit) or if updating their gift status.
drop policy if exists "user insert own registration" on public.santa_participants;
create policy "user insert own registration"
  on public.santa_participants for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.santa_events e
       where e.id = santa_participants.event_id
         and e.status = 'registration'
    )
  );

drop policy if exists "user update own registration" on public.santa_participants;
create policy "user update own registration"
  on public.santa_participants for update to authenticated
  using (
    user_id = auth.uid()
  )
  with check (
    user_id = auth.uid()
  );

drop policy if exists "admin write participants" on public.santa_participants;
create policy "admin write participants"
  on public.santa_participants for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- ---------- santa_matches policies ----------
drop policy if exists "read matches" on public.santa_matches;
create policy "read matches"
  on public.santa_matches for select to authenticated
  using (
    giver_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists "admin write matches" on public.santa_matches;
create policy "admin write matches"
  on public.santa_matches for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- ============================================================
-- 4. VIEWS & FUNCTIONS
-- ============================================================

-- ---------- santa_public_participants (View) ----------
-- Exposes registered user IDs without their wishlists, so other players can see who joined.
create or replace view public.santa_public_participants as
  select event_id, user_id, created_at from public.santa_participants;

-- ---------- is_my_gift_sent RPC function ----------
create or replace function public.is_my_gift_sent(p_event_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gift_sent boolean;
begin
  select p.gift_sent into v_gift_sent
    from public.santa_matches m
    join public.santa_participants p on m.event_id = p.event_id and m.giver_id = p.user_id
   where m.event_id = p_event_id
     and m.receiver_id = auth.uid();
  return coalesce(v_gift_sent, false);
end;
$$;

-- ============================================================
-- 5. SEED CATALOG DATA
-- ============================================================
insert into public.games (slug, name, description, icon, path, accent, sort_order, enabled)
values
  ('secret-santa', 'Secret Santa',
   'Join the holiday gift exchange! Register your wishlist and swap gifts secretly.',
   '🎄', '/secret-santa', 'rose', 30, true)
on conflict (slug) do update set
  enabled = true;

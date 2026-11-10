-- GameVortex database upgrade (safe to run more than once)
-- Run this in the SQL Editor of the GameVortex Supabase project only.
-- Existing games and admin records are preserved.

alter table public.games
  add column if not exists is_featured boolean not null default false,
  add column if not exists platforms text not null default 'PC',
  add column if not exists cover_url text,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists games_published_order_idx
  on public.games (is_published, display_order);

create table if not exists public.site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.site_settings enable row level security;

grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;

drop policy if exists "Public can read announcement settings" on public.site_settings;
create policy "Public can read announcement settings"
on public.site_settings for select to anon, authenticated
using (key in ('announcement_text','announcement_enabled'));

drop policy if exists "Admins can read all site settings" on public.site_settings;
create policy "Admins can read all site settings"
on public.site_settings for select to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "Admins can insert site settings" on public.site_settings;
create policy "Admins can insert site settings"
on public.site_settings for insert to authenticated
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "Admins can update site settings" on public.site_settings;
create policy "Admins can update site settings"
on public.site_settings for update to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "Admins can delete site settings" on public.site_settings;
create policy "Admins can delete site settings"
on public.site_settings for delete to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

-- Optional default values for the announcement; the banner stays disabled initially.
insert into public.site_settings (key,value)
values ('announcement_text','به GameVortex خوش آمدی!')
on conflict (key) do nothing;

insert into public.site_settings (key,value)
values ('announcement_enabled','false')
on conflict (key) do nothing;

-- Give the existing first game a featured flag as a starter only if none is featured.
update public.games
set is_featured = true
where id = (
  select id from public.games
  where is_published = true
  order by display_order asc, created_at asc
  limit 1
)
and not exists (select 1 from public.games where is_featured = true);

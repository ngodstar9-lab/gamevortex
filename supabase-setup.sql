-- GameVortex: database setup
-- Run this script in the SQL Editor of a NEW Supabase project for GameVortex.
-- Do not use the Supabase project belonging to your Quran website.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('action','strategy','puzzle','sport','creative')),
  description text not null default '',
  official_url text,
  art_theme text not null default 'cs' check (art_theme in ('cs','portal','civ','rocket','minecraft','human','track','stardew')),
  display_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists games_title_unique_lower on public.games (lower(title));

alter table public.admin_users enable row level security;
alter table public.games enable row level security;

grant select on public.admin_users to authenticated;
grant select on public.games to anon, authenticated;
grant insert, update, delete on public.games to authenticated;

drop policy if exists "Admins can read their own admin record" on public.admin_users;
create policy "Admins can read their own admin record"
on public.admin_users for select to authenticated
using (user_id = auth.uid());

drop policy if exists "Anyone can read published games" on public.games;
create policy "Anyone can read published games"
on public.games for select to anon, authenticated
using (is_published = true);

drop policy if exists "Admins can read all games" on public.games;
create policy "Admins can read all games"
on public.games for select to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "Admins can insert games" on public.games;
create policy "Admins can insert games"
on public.games for insert to authenticated
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "Admins can update games" on public.games;
create policy "Admins can update games"
on public.games for update to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "Admins can delete games" on public.games;
create policy "Admins can delete games"
on public.games for delete to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

-- Optional: initial library. Run once; duplicate titles are skipped manually if needed.
insert into public.games (title,category,description,official_url,art_theme,display_order,is_published) values
('Counter-Strike 2','action','یک تجربه رقابتی تیمی که دقت، هماهنگی و تصمیم‌گیری سریع در آن اهمیت دارد.','https://www.counter-strike.net/cs2','cs',1,true),
('Portal 2','puzzle','با استفاده از پورتال‌ها مسیرها و راه‌حل‌های خلاقانه پیدا کن. ترکیبی از معماهای محیطی و ماجراجویی.','https://www.thinkwithportals.com/','portal',2,true),
('Civilization VI','strategy','تمدن خودت را بساز، شهرها را گسترش بده و برای آینده تصمیم بگیر.','https://civilization.2k.com/civ-vi/','civ',3,true),
('Rocket League','sport','ترکیبی متفاوت از فوتبال و ماشین‌های موشکی؛ برای بازی سریع و رقابت با دوستان.','https://www.rocketleague.com/','rocket',4,true),
('Minecraft','creative','در یک جهان بلوکی آزادانه بساز، کاوش کن و ایده‌هایت را به سازه تبدیل کن.','https://www.minecraft.net/','minecraft',5,true),
('Human: Fall Flat','puzzle','در مرحله‌های مختلف با تکیه بر فیزیک و همکاری، راه عبور از موانع را پیدا کن.','https://www.humanfallflat.com/','human',6,true),
('Trackmania','sport','مسیرهای مسابقه‌ای را با تمرین و کنترل دقیق پشت سر بگذار و رکورد ثبت کن.','https://www.trackmania.com/','track',7,true),
('Stardew Valley','creative','مزرعه‌ات را مدیریت کن، با شخصیت‌های شهر آشنا شو و با سرعت دلخواه خودت پیشرفت کن.','https://www.stardewvalley.net/','stardew',8,true)
on conflict do nothing;

-- After creating your manager account under Supabase Authentication > Users,
-- copy that account's UUID and run this command separately:
-- insert into public.admin_users (user_id) values ('PASTE_ADMIN_USER_UUID_HERE');

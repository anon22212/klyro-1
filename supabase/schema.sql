create extension if not exists pgcrypto;
create table if not exists public.profiles(id uuid primary key references auth.users(id) on delete cascade, display_name text not null default '', avatar_url text, bio text not null default '', skills text[] not null default '{}', ai_tools text[] not null default '{}', experience text not null default 'beginner', created_at timestamptz not null default now());
create table if not exists public.projects(id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade, title text not null, description text not null, category text not null, skills text[] not null default '{}', technologies text[] not null default '{}', collaboration_type text not null default 'team', image_url text, created_at timestamptz not null default now());
create table if not exists public.applications(id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade, applicant_id uuid not null references public.profiles(id) on delete cascade, message text not null default '', status text not null default 'pending', created_at timestamptz not null default now(), unique(project_id,applicant_id));

-- Commerce: project sales, subscriptions, and paid project promotion.
create table if not exists public.market_listings(id uuid primary key default gen_random_uuid(), seller_id uuid not null references public.profiles(id) on delete cascade, project_id uuid references public.projects(id) on delete set null, title text not null, description text not null, price_cents integer not null check(price_cents > 0), currency text not null default 'usd', image_url text, stack text[] not null default '{}', status text not null default 'active' check(status in ('draft','active','sold','archived')), created_at timestamptz not null default now());
create table if not exists public.purchases(id uuid primary key default gen_random_uuid(), buyer_id uuid not null references public.profiles(id), listing_id uuid references public.market_listings(id), stripe_session_id text unique, amount_cents integer not null, currency text not null, status text not null default 'pending' check(status in ('pending','paid','refunded','failed')), created_at timestamptz not null default now());
create table if not exists public.subscriptions(id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, plan text not null check(plan in ('pro','studio')), stripe_customer_id text, stripe_subscription_id text unique, status text not null default 'inactive', current_period_end timestamptz, created_at timestamptz not null default now());
create table if not exists public.promotions(id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade, owner_id uuid not null references public.profiles(id) on delete cascade, tier text not null check(tier in ('boost','spotlight','launch')), starts_at timestamptz, ends_at timestamptz, stripe_session_id text unique, status text not null default 'pending' check(status in ('pending','active','expired','cancelled')), created_at timestamptz not null default now());

alter table public.profiles enable row level security; alter table public.projects enable row level security; alter table public.applications enable row level security; alter table public.market_listings enable row level security; alter table public.purchases enable row level security; alter table public.subscriptions enable row level security; alter table public.promotions enable row level security;
create policy "profiles readable" on public.profiles for select using(true);
create policy "profile self insert" on public.profiles for insert with check(auth.uid()=id);
create policy "profile self update" on public.profiles for update using(auth.uid()=id);
create policy "projects readable" on public.projects for select using(true);
create policy "project owner insert" on public.projects for insert with check(auth.uid()=owner_id);
create policy "project owner update" on public.projects for update using(auth.uid()=owner_id);
create policy "project owner delete" on public.projects for delete using(auth.uid()=owner_id);
create policy "applications visible to owner or applicant" on public.applications for select using(auth.uid()=applicant_id or exists(select 1 from public.projects where id=project_id and owner_id=auth.uid()));
create policy "application self insert" on public.applications for insert with check(auth.uid()=applicant_id);
create policy "listings readable" on public.market_listings for select using(status='active' or auth.uid()=seller_id);
create policy "listing owner insert" on public.market_listings for insert with check(auth.uid()=seller_id);
create policy "listing owner update" on public.market_listings for update using(auth.uid()=seller_id);
create policy "purchase buyer read" on public.purchases for select using(auth.uid()=buyer_id);
create policy "subscriptions self read" on public.subscriptions for select using(auth.uid()=user_id);
create policy "promotions active readable" on public.promotions for select using(status='active' or auth.uid()=owner_id);
create policy "promotion owner insert" on public.promotions for insert with check(auth.uid()=owner_id);

create or replace function public.new_profile() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into public.profiles(id,display_name) values(new.id,coalesce(new.raw_user_meta_data->>'name','')); return new; end; $$;
drop trigger if exists create_profile_on_signup on auth.users; create trigger create_profile_on_signup after insert on auth.users for each row execute procedure public.new_profile();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('project-images','project-images',true,4194304,array['image/jpeg','image/png','image/webp','image/gif']) on conflict(id) do update set public=true,file_size_limit=4194304,allowed_mime_types=array['image/jpeg','image/png','image/webp','image/gif'];
drop policy if exists "project images public" on storage.objects;
create policy "project images public" on storage.objects for select using(bucket_id='project-images');
drop policy if exists "users upload own images" on storage.objects;
create policy "users upload own images" on storage.objects for insert to authenticated with check(bucket_id='project-images' and (storage.foldername(name))[1]=auth.uid()::text);

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select coalesce(auth.jwt()->'app_metadata'->>'role'='admin',false); $$;
grant execute on function public.is_admin() to authenticated;
create policy "admin applications" on public.applications for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin commerce" on public.purchases for all to authenticated using(public.is_admin()) with check(public.is_admin());

-- After lykso.ai@gmail.com registers and verifies the email, run:
-- update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data,'{}'::jsonb) || '{"role":"admin"}'::jsonb where lower(email)=lower('lykso.ai@gmail.com');
create table if not exists public.businesses (
  id text primary key,
  name text not null,
  category text not null,
  description text not null,
  location text not null,
  hours text,
  whatsapp text,
  instagram text,
  map text,
  "order" text,
  logo text,
  cover text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_interactions (
  id bigint generated always as identity primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  type text not null check (type in ('view', 'whatsapp', 'instagram', 'location', 'order', 'phone')),
  created_at timestamptz not null default now()
);

create index if not exists businesses_status_idx on public.businesses(status);
create index if not exists business_interactions_business_id_idx on public.business_interactions(business_id);
create index if not exists business_interactions_created_at_idx on public.business_interactions(created_at);

alter table public.businesses enable row level security;
alter table public.business_interactions enable row level security;

drop policy if exists "Public can read published businesses" on public.businesses;
create policy "Public can read published businesses"
  on public.businesses for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "Public can read own business records" on public.businesses;
create policy "Public can read own business records"
  on public.businesses for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can create business records" on public.businesses;
create policy "Public can create business records"
  on public.businesses for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Public can update business records" on public.businesses;
create policy "Public can update business records"
  on public.businesses for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "Public can add interactions" on public.business_interactions;
create policy "Public can add interactions"
  on public.business_interactions for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Public can read interactions" on public.business_interactions;
create policy "Public can read interactions"
  on public.business_interactions for select
  to anon, authenticated
  using (true);

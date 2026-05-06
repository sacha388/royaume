create table if not exists public.web_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile text not null check (profile in ('reane', 'sacha')),
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  updated_at timestamptz not null default now(),
  constraint web_push_subscriptions_endpoint_unique unique (endpoint)
);

alter table public.web_push_subscriptions enable row level security;

grant select, insert, update, delete on public.web_push_subscriptions to anon, authenticated;

drop policy if exists "Anon can read web push subscriptions" on public.web_push_subscriptions;
create policy "Anon can read web push subscriptions"
  on public.web_push_subscriptions
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Anon can insert web push subscriptions" on public.web_push_subscriptions;
create policy "Anon can insert web push subscriptions"
  on public.web_push_subscriptions
  for insert
  to anon, authenticated
  with check (profile in ('reane', 'sacha'));

drop policy if exists "Anon can update web push subscriptions" on public.web_push_subscriptions;
create policy "Anon can update web push subscriptions"
  on public.web_push_subscriptions
  for update
  to anon, authenticated
  using (true)
  with check (profile in ('reane', 'sacha'));

drop policy if exists "Anon can delete web push subscriptions" on public.web_push_subscriptions;
create policy "Anon can delete web push subscriptions"
  on public.web_push_subscriptions
  for delete
  to anon, authenticated
  using (true);

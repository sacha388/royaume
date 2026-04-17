create table if not exists public.hearts (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.hearts enable row level security;

drop policy if exists "Authenticated users can read hearts" on public.hearts;
create policy "Authenticated users can read hearts"
  on public.hearts
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can send their own hearts" on public.hearts;
create policy "Authenticated users can send their own hearts"
  on public.hearts
  for insert
  to authenticated
  with check (auth.uid() = sender_id);

do $$
begin
  alter publication supabase_realtime add table public.hearts;
exception
  when duplicate_object then null;
end $$;

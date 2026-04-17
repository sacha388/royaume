create table if not exists public.couple_messages (
  id uuid primary key default gen_random_uuid(),
  from_profile text not null check (from_profile in ('reane', 'sacha')),
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.heart_acknowledgements (
  profile text primary key check (profile in ('reane', 'sacha')),
  message_id uuid not null references public.couple_messages(id) on delete cascade,
  acknowledged_at timestamptz not null default now()
);

create table if not exists public.constellation_stars (
  id uuid primary key default gen_random_uuid(),
  created_by_profile text check (created_by_profile in ('reane', 'sacha')),
  body text not null check (char_length(body) <= 20),
  size integer not null check (size between 10 and 30),
  x double precision not null check (x >= 0 and x <= 1),
  y double precision not null check (y >= 0 and y <= 1),
  created_at timestamptz not null default now()
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  profile text not null check (profile in ('reane', 'sacha')),
  title text not null check (char_length(title) <= 15),
  image_data_url text not null,
  created_at timestamptz not null default now()
);

alter table public.couple_messages enable row level security;
alter table public.heart_acknowledgements enable row level security;
alter table public.constellation_stars enable row level security;
alter table public.memories enable row level security;

drop policy if exists "Anon can read couple messages" on public.couple_messages;
create policy "Anon can read couple messages"
  on public.couple_messages
  for select
  to anon
  using (true);

drop policy if exists "Anon can insert couple messages" on public.couple_messages;
create policy "Anon can insert couple messages"
  on public.couple_messages
  for insert
  to anon
  with check (from_profile in ('reane', 'sacha') and char_length(body) > 0);

drop policy if exists "Anon can read heart acknowledgements" on public.heart_acknowledgements;
create policy "Anon can read heart acknowledgements"
  on public.heart_acknowledgements
  for select
  to anon
  using (true);

drop policy if exists "Anon can upsert heart acknowledgements" on public.heart_acknowledgements;
create policy "Anon can upsert heart acknowledgements"
  on public.heart_acknowledgements
  for insert
  to anon
  with check (profile in ('reane', 'sacha'));

drop policy if exists "Anon can update heart acknowledgements" on public.heart_acknowledgements;
create policy "Anon can update heart acknowledgements"
  on public.heart_acknowledgements
  for update
  to anon
  using (profile in ('reane', 'sacha'))
  with check (profile in ('reane', 'sacha'));

drop policy if exists "Anon can read constellation stars" on public.constellation_stars;
create policy "Anon can read constellation stars"
  on public.constellation_stars
  for select
  to anon
  using (true);

drop policy if exists "Anon can insert constellation stars" on public.constellation_stars;
create policy "Anon can insert constellation stars"
  on public.constellation_stars
  for insert
  to anon
  with check (
    (created_by_profile is null or created_by_profile in ('reane', 'sacha'))
    and char_length(body) > 0
    and char_length(body) <= 20
  );

drop policy if exists "Anon can delete constellation stars" on public.constellation_stars;
create policy "Anon can delete constellation stars"
  on public.constellation_stars
  for delete
  to anon
  using (true);

drop policy if exists "Anon can read memories" on public.memories;
create policy "Anon can read memories"
  on public.memories
  for select
  to anon
  using (true);

drop policy if exists "Anon can insert memories" on public.memories;
create policy "Anon can insert memories"
  on public.memories
  for insert
  to anon
  with check (
    profile in ('reane', 'sacha')
    and char_length(title) > 0
    and char_length(title) <= 15
  );

do $$
begin
  alter publication supabase_realtime add table public.couple_messages;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.heart_acknowledgements;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.constellation_stars;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.memories;
exception
  when duplicate_object then null;
end $$;

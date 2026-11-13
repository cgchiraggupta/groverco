-- Enquiries contain personal information. Only the server's service role may
-- access this table; public and signed-in browser clients receive no grants.
create table if not exists public.grover_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('service', 'resources', 'creator', 'business')),
  name text not null check (char_length(name) between 1 and 120),
  phone text not null check (char_length(phone) between 3 and 40),
  email text check (email is null or char_length(email) <= 254),
  practice text,
  service text,
  details jsonb not null default '{}'::jsonb,
  consent boolean not null default false,
  status text not null default 'new' check (status in ('new', 'reviewing', 'contacted', 'closed'))
);
create index if not exists grover_submissions_kind_created_idx on public.grover_submissions(kind, created_at desc);
alter table public.grover_submissions enable row level security;
revoke all on public.grover_submissions from public, anon, authenticated;
grant all on public.grover_submissions to service_role;

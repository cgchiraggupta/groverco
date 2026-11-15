alter table public.grover_submissions
  add column if not exists source text not null default 'Website',
  add column if not exists marker text not null default 'none' check (marker in ('none', 'red', 'blue')),
  add column if not exists contact_count integer not null default 0 check (contact_count >= 0),
  add column if not exists last_contacted_at timestamptz,
  add column if not exists follow_up_at date,
  add column if not exists notes text not null default '';

create table if not exists public.grover_lead_sources (
  id uuid primary key default gen_random_uuid(),
  label text not null unique check (char_length(label) between 1 and 80),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.grover_lead_sources enable row level security;
revoke all on public.grover_lead_sources from public, anon, authenticated;
grant all on public.grover_lead_sources to service_role;

insert into public.grover_lead_sources (label) values
  ('Website'), ('Instagram'), ('LinkedIn'), ('Google'), ('Referral'),
  ('Event / Exhibition'), ('WhatsApp'), ('Other')
on conflict (label) do nothing;

create or replace function public.grover_mark_submission_contacted(target_submission_id uuid)
returns table (submission_id uuid, total_contacts integer, contacted_at timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
begin
  return query
  update public.grover_submissions as s
  set contact_count = s.contact_count + 1,
      last_contacted_at = now(),
      status = 'contacted'
  where s.id = target_submission_id
  returning s.id, s.contact_count, s.last_contacted_at;
end;
$$;

revoke all on function public.grover_mark_submission_contacted(uuid) from public, anon, authenticated;
grant execute on function public.grover_mark_submission_contacted(uuid) to service_role;

-- Private fixed-window limits; the server sends only a keyed hash of the address.
create table if not exists public.grover_submission_limits (
  fingerprint text primary key,
  window_start timestamptz not null default now(),
  submissions integer not null default 1
);
alter table public.grover_submission_limits enable row level security;
revoke all on public.grover_submission_limits from public, anon, authenticated;
grant all on public.grover_submission_limits to service_role;

create or replace function public.grover_check_submission_limit(fingerprint_value text)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare request_count integer;
begin
  if length(fingerprint_value) <> 64 then return false; end if;
  insert into public.grover_submission_limits as limits (fingerprint, window_start, submissions)
  values (fingerprint_value, now(), 1)
  on conflict (fingerprint) do update set
    submissions = case when limits.window_start < now() - interval '10 minutes' then 1 else limits.submissions + 1 end,
    window_start = case when limits.window_start < now() - interval '10 minutes' then now() else limits.window_start end
  returning submissions into request_count;
  return request_count <= 10;
end;
$$;
revoke all on function public.grover_check_submission_limit(text) from public, anon, authenticated;
grant execute on function public.grover_check_submission_limit(text) to service_role;

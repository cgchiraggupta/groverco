alter table public.grover_submissions
  add column if not exists archived_at timestamptz;

create index if not exists grover_submissions_active_created_at_idx
  on public.grover_submissions (created_at desc)
  where archived_at is null;

-- Creator/business matching is opt-in. Existing and future records stay out
-- of match suggestions unless the person explicitly agrees to share details.
alter table public.grover_submissions
  add column if not exists matching_consent boolean not null default false;

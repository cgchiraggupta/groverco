# Backend setup

The Vercel project needs `SUPABASE_URL`, `SUPABASE_ANON_KEY` (Supabase publishable key), `SUPABASE_SERVICE_ROLE_KEY` (Supabase secret key) and `ADMIN_EMAIL` set as server environment variables. Never commit or expose the secret key. Provision a confirmed Supabase Auth user for the administrator separately; passwords are managed by Supabase and do not belong in this repository.

Apply the SQL files in `supabase/migrations/` in order to create the private submissions and rate-limit tables. All browser roles are denied direct table access; the API uses the server-only secret. The admin API checks the Supabase session and the confirmed administrator email before reading submissions.

The website saves form entries to Supabase and then attempts FormSubmit email delivery in the background. FormSubmit must be activated separately for the destination email, and email delivery must be tested independently of database storage. The free resources form records interest; actual resources are not yet available.

Run `npm test` and `npm run build`. The rate limiter uses Vercel's `x-vercel-forwarded-for` header, so form submissions require a Vercel environment for end-to-end testing. Preview origins require their deployment's `VERCEL_URL` and suitable Supabase environment configuration.

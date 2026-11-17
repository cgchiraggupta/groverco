# Backend setup

The Vercel project needs `SUPABASE_URL`, `SUPABASE_ANON_KEY` (Supabase publishable key), `SUPABASE_SERVICE_ROLE_KEY` (Supabase secret key) and `ADMIN_EMAIL` set as server environment variables. Never commit or expose the secret key. `ADMIN_EMAIL` accepts a comma-separated allowlist, for example `nishant@example.com,chirag@example.com`; every listed address must have its own confirmed Supabase Auth user. Provision those users separately; passwords are managed by Supabase and do not belong in this repository.

Apply the SQL files in `supabase/migrations/` in order to create the private submissions and rate-limit tables. All browser roles are denied direct table access; the API uses the server-only secret. The admin API checks the Supabase session and the confirmed administrator emails before reading submissions or changing lead sources.

The Google Sheet linked from the admin header is a separate Google Drive file. Sharing it is a Google Drive permission, not a website setting: open the sheet, choose **Share**, and add each administrator as an Editor (or transfer ownership if required). The website cannot change Google Drive permissions.

Supabase invite and password-recovery links must return to `/admin/`. Set the Supabase Auth **Site URL** to `https://www.groverco.in/admin/` and add `https://www.groverco.in/**` and `https://groverco.in/**` as redirect URLs. The admin page detects `type=invite` and `type=recovery` links, asks the administrator to choose a password, then opens the dashboard. The **Forgot password?** control sends the same recovery flow.

The downloadable PDFs live in `public/resources/downloads/`. After editing either guide in `resources/*.html`, regenerate them with `python3 scripts/generate-resource-pdfs.py` (requires reportlab) and rebuild the site.

The website saves form entries to Supabase and then attempts FormSubmit email delivery to worksbynish@gmail.com with chiraggupta0999@gmail.com copied. The recipient activation is complete and both inboxes have received a test. Form status is shown separately from database storage so an email failure does not hide a saved enquiry. The free-resource form unlocks the selected starter guide after saving the request.

Creator and business forms share the same matching fields. Their separate, optional `matching_consent` value defaults to false and is required for matching suggestions. An administrator can prepare an unsent introduction draft only after selecting a business request and a matched creator. The dashboard's status updates and deletion route require the confirmed admin account.

Run `npm test` and `npm run build`. The rate limiter uses Vercel's `x-vercel-forwarded-for` header, so form submissions require a Vercel environment for end-to-end testing. Preview origins require their deployment's `VERCEL_URL` and suitable Supabase environment configuration. See `docs/end-to-end-test.md` for an end-to-end checklist and test-record cleanup steps.

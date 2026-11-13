# Grover & Co website

A responsive static Vite website for Grover Strategy House and Works by Nish.

## Development

- `npm ci`
- `npm run dev`
- `npm run build` (production output in `dist/`)
- `npm run preview`

Vercel can build the site with `npm run build` and serve the `dist` directory. Connect this repository to a Vercel project to deploy pushes automatically.

## Enquiries and resources

Service, creator, business and free-resource interest forms are saved in a private Supabase table and forwarded to FormSubmit for email delivery on a best-effort basis. The recipient must activate the FormSubmit email link and verify email delivery separately. The administrator can sign in at `/admin/` to review entries and compare creator profiles to business requests. Matching suggestions use exact matches on selected fields and require manual review; they do not contact people automatically. See `docs/backend-setup.md` for deployment and security configuration.

Free resource materials have not yet been supplied. The resource form registers interest and does not provide a download. Contact-directory details are placeholders.

Original source notes and logo files are excluded from Git. Optimized logo assets used by the site are included in `assets/`.

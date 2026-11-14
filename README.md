# Grover & Co website

A responsive static Vite website for Grover Strategy House and Works by Nish.

## Development

- `npm ci`
- `npm run dev`
- `npm run build` (production output in `dist/`)
- `npm run preview`

Vercel can build the site with `npm run build` and serve the `dist` directory. Connect this repository to a Vercel project to deploy pushes automatically.

## Enquiries and resources

Service, creator, business and free-resource forms are saved in a private Supabase table and forwarded to both configured inboxes through FormSubmit. The administrator can sign in at `/admin/` to review entries, update follow-up status, delete test or obsolete records, compare opted-in creator profiles with opted-in business requests, and prepare an unsent introduction email draft. The admin reviews every match and sends any introduction manually. See `/privacy.html` for the data notice and `docs/end-to-end-test.md` for a complete test walkthrough.

Two practical starter guides are available after the free-resource form is submitted. The contact-directory details remain placeholders until the business provides them.

Original source notes and logo files are excluded from Git. Optimized logo assets used by the site are included in `assets/`.

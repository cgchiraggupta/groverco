# Lead workflow

## In the admin dashboard

- **Lead sources** is the source CMS. Add a new channel or pause one. Paused sources remain on past leads but no longer appear on new forms.
- Each lead has a source, status, priority marker, next follow-up date, and private notes.
- **Red** means urgent; **blue** means follow up. **Mark contacted** increments the contact-attempt count and records the timestamp.
- The summary shows lead totals, contacted leads, contact attempts, urgent leads, due follow-ups, and counts by source.
- Creator matching remains opt-in. Introduction links create drafts; they do not send email.

## Google Sheets snapshot

The admin export downloads the latest 500 records as a CSV with the same tracking columns as the Google Sheets workbook. In Google Sheets, use **File → Import → Upload**, import as a new tab, then copy the data rows (without the CSV header) into the **Leads** tab starting at A2. This is a manual snapshot export; the admin dashboard is the live record and edits to the workbook do not write back to the website.

## Source tracking

New enquiry forms offer active sources configured in the admin CMS. Existing records default to **Website** unless an admin changes their source. If a source is retired, its name stays on historical records.

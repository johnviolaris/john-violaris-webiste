<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Public content awaiting John's review

Keep existing public page wording, headlines, SEO title/description wording and
legal/professional claims unchanged until the user confirms John's approval.
This includes automatic rendering substitutions and pending SQL content updates.
Keep proposed wording changes in review notes. Technical improvements must preserve
the existing editorial copy and any pre-existing user edits.

Exception confirmed by the user on 2026-10-05: article improvements are authorised,
including restoration of the six shortened article SEO titles from this session.
The user subsequently authorised proceeding with all remaining project work except
service-page wording. Preserve service-page body copy, headings, SEO wording and
legal claims, including automatic replacements and SQL content updates. Other
changes are authorised, but unavailable business or regulatory facts must never
be invented. On 2026-10-05 the user subsequently authorised pushing, applying
the reviewed changes and testing the release. That supersedes the earlier
instruction not to push; the service-page wording restriction remains in force.

## Wording changes: review before editing

When the user (Luka) asks to change any visible wording — page copy, headings,
buttons, FAQs, image alt text, search titles or descriptions — review the
request against the checks below and report back before editing. Edit straight
away only when every check passes. Otherwise explain the problem, suggest
wording that keeps his intent, and wait for his decision. Wording outside the
service pages may change at his request after this review; service-page
wording stays locked as described above.

**1. Find where the live text comes from.** Editing the wrong place changes
nothing on the site.

- Page sections render code defaults from `lib/cms/sections/schema.ts`, but a
  saved `page_sections` row overrides them field by field.
- Services, service pages, articles, locations and site settings live in the
  database.
- Search titles and descriptions default from `lib/cms/seo/routes.ts`; a
  `seo_metadata` row overrides them.

Check the live rows read-only, for example
`npx -y supabase@2.118.0 db query --linked "select ..."`. Then say whether the
change is a CMS edit (made and published in `/admin`, with revision history) or
a code change (commit and deploy). Do not write to the live database to change
CMS text unless the user asks for that specifically.

**2. SEO**

- Keep the page's target search phrase (usually in its current search title,
  for example "Drink Driving Solicitor") in the title and the opening copy.
  Flag wording that drops or dilutes it.
- One H1 per page, no skipped heading levels, and headings that say what their
  section is about.
- Search titles stay within 60 characters including the " | John Violaris"
  suffix, and descriptions within 155. Both must be unique across the site.
- Do not copy the same paragraph onto several pages, cut large amounts of body
  copy from a service page, or remove internal links and their descriptive
  link text.
- A URL or slug change needs a redirect. Services and articles create one when
  renamed in the admin; anything else needs a deliberate redirect.
- Alt text describes what the image shows.

**3. Legal and trust**

- No promised or implied outcomes ("no ban", "will keep your licence",
  "guaranteed"). Describe the court's discretion instead. The SEO health check
  flags some of these phrases, not all.
- No invented or unconfirmed facts: figures, years, credentials, awards,
  reviews, addresses, SRA or practice details. The website represents John's
  freelance practice only.
- If the request touches service-page wording, ask the user to confirm John
  has approved the exact wording before changing it.

**4. Layout and readability**

- Longer text can break the design. Check the affected page at 375, 768, 1024
  and 1440px, especially headlines, buttons, cards and menus.
- Link and button text must make sense on its own (not "click here").
- Use British English and the page's existing voice (first person, or "John").

**Report.** For each requested change, show the current and proposed wording
with a verdict: fine, fine with a suggestion, or problem. Give a one-line
reason, and an alternative for any problem.

**After editing**, check the rendered page in a browser. For code changes also
run `npm run lint`, `npm run typecheck`, `npm test`, `npm run seo:verify` and
`npm run build`, then `npm run pages:verify -- http://127.0.0.1:3000` and
`npm run schema:verify -- http://127.0.0.1:3000` against `npm run start`.

# Production Launch Checklist

Use this runbook for every production release that changes the database,
environment or external integrations. The public-domain cutover itself was
completed on 2026-10-03: johnviolaris.com serves the Vercel deployment and the
three aliases redirect to it. Its steps stay below for reference and for any
future domain change.

TidyCal and public fee figures are not launch tasks. Consultation CTAs lead to
the contact journey, and the Fees page intentionally publishes no prices or fee
schedule.

## Recorded release status (2026-10-06)

The reviewed 2026-10-05 release is live. Seven migrations were applied, and all
24 local/hosted versions matched. All 33 production page/schema checks and 239
comparison checks passed; service-page wording remained unchanged. Those checks
do not complete the approval, inbox delivery, field performance or manual
accessibility tasks below.

The 2026-10-06 CI repair commit `735300a` is deployed. GitHub run
`37441870515` passed both jobs, including 187 PostgreSQL assertions on a fresh
database, Linux dependency installation and the application verification suite.
The earlier run failed to obtain a hosted runner; its retry exposed the
lockfile/test defects corrected in this commit. The runbook boxes below remain
per-release instructions, not a claim that every acceptance check is complete.

Read-only production configuration checks established the From identity
`John Violaris <enquiries@alert.johnviolaris.com>` and notification mailbox
`contact@johnviolaris.com`; public sending DNS is present. Existing GA4 Realtime
received Home/Contact page views, `booking_click` and `LCP` during a consented
navigation check. No test enquiry or email was sent; inbox receipt, accepted-form
conversion, DebugView and custom Auth SMTP remain unverified.

The section-draft follow-up uses the additive migration
`20261006091709_private_static_page_drafts.sql`. Apply it only after the final
commit's fresh-database tests pass. It creates an empty administrator-only draft
relation and extends revision capture; it does not copy or rewrite live content.
Record before/after live-table digests and verify drafts remain empty. Hosted
acceptance is read-only; use an isolated database for draft/publish/restore tests,
and do not consume the production revision sequence with disposable fixtures.
SEO overrides and site settings remain immediate live configuration controls.

### Schema and keyboard follow-up (2026-10-06)

All 12 currently live template representatives were submitted by public URL to
Schema.org Validator and Google Rich Results Test. Schema.org reported zero
errors and zero warnings for each; Google detected valid items with no invalid
items. Recorded Google results:

| Representative | Google valid items |
| --- | --- |
| Home | [2](https://search.google.com/test/rich-results/result?id=Iu2JDaxcIsgwhW873HkINw) |
| About | [3](https://search.google.com/test/rich-results/result?id=R2jo4SVjhP--tWCPORQQCg) |
| Services index | [3](https://search.google.com/test/rich-results/result?id=k6tF25u5aR9m5iWZhPo51w) |
| Police Station | [3](https://search.google.com/test/rich-results/result?id=kt-hBibRm5znG0Wpdfp_xg) |
| Fees | [3](https://search.google.com/test/rich-results/result?id=ohbpS_8hmEr6KVsLOuH1UQ) |
| Reviews | [3](https://search.google.com/test/rich-results/result?id=AR0DneuruYdlImrfJB7--w) |
| Contact | [3](https://search.google.com/test/rich-results/result?id=ysvfqU7cJW9A7XJfjg0_yw) |
| Cookie Policy | [3](https://search.google.com/test/rich-results/result?id=0OePBo7voo4q6USNpsc3ew) |
| Privacy | [3](https://search.google.com/test/rich-results/result?id=mOL_lyDmLGukC4RmTEP3Nw) |
| Resources index | [3](https://search.google.com/test/rich-results/result?id=lqV5e65ubC_lKHRIulmJiQ) |
| Drink-driving arrest article | [4](https://search.google.com/test/rich-results/result?id=2YL1xgHH_Ru-2gmnwTiD9Q) |
| Drink-driving service | [3](https://search.google.com/test/rich-results/result?id=xcRxfh4v4kaHDoNGhtIk2g) |

Google's non-critical advisories include optional business address/price range
and the article's optional image. These need confirmed content; none was
invented. Passing validation does not guarantee indexing or rich-result display.
Location pages remain intentionally unpublished, outside current live-template
acceptance. Private detail is recorded in
`seo-external-accessibility-20261006.json` outside this repository.

Live Chrome desktop keyboard checks passed for the skip link, services menu and
tabs, FAQ controls, article contents links, cookie controls and all eight contact
fields plus the submit button. No enquiry or email was sent. Core gold/navy and
cream/navy contrast ratios are 7.61:1 and 16.64:1. The local 404 returns HTTP 404
and server-renders home, services, contact and urgent-call routes; services and
contact were followed with the keyboard. Next's automatic 404 noindex is retained.
Full manual accessibility acceptance remains open: NVDA/VoiceOver was not
available, Chrome's viewport override did not apply, and the IAB fallback was
unavailable. This does not claim a new mobile or exhaustive keyboard pass.

## Operating rules

- Nominate one launch owner and one person authorised to call a rollback.
- Tick a box only when its evidence has been recorded in the private launch
  record. Store URLs, timestamps and screenshots there, but never secrets in
  this repository.
- Use the same reviewed commit for preview verification and production.
- Allow only one person to apply production database migrations.
- Do not run `supabase db reset` against a remote or production database.
- A Vercel rollback does not reverse a Supabase migration. Treat application,
  database, DNS and external-service rollback as separate decisions.

## 1. Release record and preflight

Record these values outside the repository before making changes:

- [ ] Release commit SHA and release owner
- [ ] Verified Vercel preview URL for that commit
- [ ] Intended Vercel production deployment and previous known-good deployment
- [ ] Planned start time, monitoring period and rollback decision-maker
- [ ] Current DNS record export or screenshots and the time they were captured
- [ ] Supabase backup or point-in-time recovery timestamp immediately before
      migration
- [ ] Expected migration filenames, in timestamp order

Then confirm:

- [ ] The release commit is pushed, reviewed and has no unintended working-tree
      changes.
- [ ] The approved scope is unchanged: no booking calendar, no public fee
      figures and no fee-management admin.
- [ ] Final contact, regulatory, privacy and complaints content has been approved
      by the appropriate owner.
- [ ] Service-page wording, headings and search wording are preserved unless John
      approves the exact proposed changes. The user-approved restoration of six
      earlier shortened article SEO titles is the current exception; article
      bodies and visible headlines are unchanged. Special Reasons corrections
      and the added drink-driving service synonym paragraph remain withdrawn.
      REQ-064 remains not met; do not count a dashboard warning as corrected copy.
- [ ] The previous known-good deployment still opens and is eligible for a
      Vercel rollback.
- [ ] The current DNS time-to-live is understood. If it is being reduced, do so
      early enough for the old value to expire before cutover.
- [ ] No unrelated deploy, migration, content import or DNS change is scheduled
      during the launch window.

## 2. Code and configuration gate

Run the repository checks from a clean checkout of the release commit:

```powershell
npm ci
npm run lint
npm run typecheck
npm test
npm run cms:verify
npm run seo:verify
npm run build
```

After the build, run the production server in one terminal and both runtime
verifiers in another:

```powershell
npm run start
```

```powershell
npm run runtime:verify -- http://127.0.0.1:3000
npm run pages:verify -- http://127.0.0.1:3000
npm run assets:verify -- http://127.0.0.1:3000
npm run schema:verify -- http://127.0.0.1:3000
npm run lighthouse:ci
```

- [ ] Every command passes on the release commit.
- [ ] Review `performance-budgets.json` if a dependency upgrade or deliberate
      design change materially increases initial JavaScript, CSS or portrait
      size. Passing asset budgets does not establish field Core Web Vitals.
- [ ] Review Lighthouse CI's two runs each of home, service and article. Its
      performance/LCP/CLS/TBT assertions are warnings; record unresolved target
      failures. Field INP needs separate measurement.
- [ ] Review any pending migrations in a non-production database first.
      The seven publishing/history, portrait-only,
      location, SEO-role, media/history, rich-caption and private-redirect-note
      migrations from 2026-10-05 are already applied to production.
      `20261005131025_optimize_portrait.sql` changes only the legacy portrait
      URL and must leave existing legal wording unchanged.
- [x] Final FAQ/notes/CSS/field-collector source
      `5e7cdd3bf980bd55f339e8a375cb69162da14eb9921a7b3492c07ed6e0981383`
      passes with 74 application routes;
      all 33 rendered public pages and schema graphs pass, with zero rendered
      failures/advisories. 113 unit tests, lint, TypeScript, CMS seed checks,
      30 SEO checks, 89 workflow SQL, 20 SEO-role SQL and 36 private-note SQL
      checks pass. Public CSS is 19,431 gzip bytes (22.5% smaller), with current
      initial JavaScript 174,608 bytes and unchanged budgets. All 33 main-text
      hashes are unchanged; seven real-browser consent/privacy fixture cases
      make no Google request. These do not verify production metric receipt.
      Focused Chrome
      confirms preserved page text, original H1s and unchanged service wording.
      Earlier complete Chrome/axe runs predate the copy withdrawal. Nine later
      Lighthouse reports historically measured the preserved-copy caption/integration snapshot
      before the server-only sitemap date follow-up: mobile performance medians
      89/91/93.5, LCP 3.611/3.460/3.096 seconds; desktop home 100 and 0.768 seconds.
      All nine automated accessibility/best-practices scores are 100 and CLS 0.
      Mobile targets and field INP remain open. Release acceptance must retain
      these source/build boundaries. The portrait migration contains no legal
      wording changes. The sitemap follow-up uses actual CMS dates and refreshes
      after saves/restores; missing/reset/deleted source timestamps stay omitted.
      Seven final-source Lighthouse reports (two mobile runs per page and one
      desktop-home run) give mobile performance 90/92/96.5 and LCP
      3.587/3.304/2.652 seconds; desktop home 100 and 0.738 seconds. All seven
      automated Accessibility/Best Practices scores are 100 and CLS is 0.
      Home/Service performance, all mobile LCP targets and field INP stay open.
- [ ] Verify authenticated saved-draft previews and revision restore against the
      migrated database. Verify future/expired articles are absent from public
      pages and sitemap, including after the ISR refresh boundary.
- [ ] Against that database, verify reusable media metadata, a 4 MiB upload,
      version comparison/restoration and the SEO-editor role. Confirm draft-image
      descriptions for unpublished-only images are private; uploaded website image
      files remain public by URL. Verify formatted caption preview/render/restore
      and administrator-only GA/review switches, including invalid config denial.
- [ ] Verify optional article/service FAQs in that migrated environment: add,
      reorder, save, preview, publish and restore. Visible answers and the single
      FAQ schema must match; an empty list must leave existing page text intact.
      Invalid saved FAQ data needs an explicit repair/clear acknowledgment.
- [ ] Verify private redirect notes as an administrator, then confirm anonymous,
      ordinary and SEO-editor users cannot read or write them. Reject an invalid
      note and confirm neither the rule nor its dependent chain changed. Check
      that editing an automatic redirect preserves its origin and created time.
- [ ] The dependency lockfile is committed and unchanged by `npm ci`.
- [ ] All required migration files are committed under `supabase/migrations/`.
- [ ] Production and Preview each contain the intended variables. Check presence
      and environment scope, never copy values into the launch record:

  - Supabase URL and browser-safe publishable key
  - `SUPABASE_SECRET_KEY`, server-only
  - `RESEND_API_KEY`, server-only
  - `ENQUIRY_FROM_EMAIL` and the intended notification mailbox
  - `ENQUIRY_IP_SALT`, set to a production-only random value
  - Production contact/configuration values
  - `NEXT_PUBLIC_GA_MEASUREMENT_ID`, Production only when analytics is approved

- [ ] No secret or privileged Supabase key uses a `NEXT_PUBLIC_` name.
- [x] Public signup is verified disabled in the correct hosted Supabase project:
      the 2026-10-05 Auth settings API returned `disable_signup: true`.
      Recheck this at release; local `supabase/config.toml` alone does not configure
      a hosted project.
- [ ] Preview is not silently connected to production write paths unless that is
      an explicit, reviewed decision and no test submission will be made.

Read-only hosting verification on 2026-10-05 found the correct project in the
`john-violaris` Chrome dashboard and an existing Ready production deployment.
Required variable names are present with their values masked. GA4 and the IP
salt are Production only. Supabase, Resend and enquiry sender/recipient rows
apply to both Production and Preview. Before a write test, give Preview a
separate database, intended test recipient and its own random IP salt, and
verify that isolation. The dashboard also flags `SUPABASE_SECRET_KEY` and
`RESEND_API_KEY` stored as Configuration; review Secret storage and rotation
with the release owner. Presence/scope checks do not establish correct values
or inbox delivery. No hosting setting was changed during this verification.
Speed Insights has no collected LCP/INP/CLS data; its displayed zero score is
a setup placeholder and must not be reported as a measured score.

## 3. Supabase backup and migration

Supabase plan features differ, so first verify the actual recovery option in
the project dashboard. A database backup does not restore deleted Storage
objects; preserve any at-risk bucket objects separately.

- [ ] Confirm the CLI version and inspect current help before using it:

  ```powershell
  supabase --version
  supabase db push --help
  supabase migration list --help
  ```

- [ ] Confirm that the CLI is linked to the intended project without recording
      the project reference or credentials in this file.
- [ ] Compare local and remote migration history. Stop if the remote database
      contains untracked dashboard changes or unexpected migration entries.
- [ ] Review every pending SQL file for destructive operations, long locks,
      changed grants and changed RLS policies.
- [ ] Confirm a restorable Dashboard backup/PITR point. Where the plan does not
      provide a suitable restore point, create an encrypted logical backup using
      Supabase's documented `db dump` procedure and keep it outside the repo.
- [ ] Inventory any Storage objects that a migration or release could affect.
- [ ] Apply the same migrations to a non-production project first and run the
      application smoke tests there.
- [ ] In a Docker/Podman-capable local or disposable non-production environment,
      reset from the migration history and run `supabase test db`. Confirm the
      redirect and enquiry pgTAP suites pass before production migration.
- [ ] Apply production migrations once, in timestamp order:

  ```powershell
  supabase db push
  ```

- [ ] Do not use `--include-seed` for an established production database unless
      the seed migration has been reviewed specifically as a production change.
- [ ] Record the post-push migration list and confirm that only the expected
      migrations were applied.
- [ ] Verify public reads, authenticated admin writes, enquiry insertion and
      Storage access. Confirm that anonymous users cannot read CMS drafts,
      enquiries or admin-only data.
- [ ] Check Vercel and Supabase logs for permission, RLS, connection or timeout
      errors before continuing.

Current Supabase references:

- [Database migrations](https://supabase.com/docs/guides/deployment/database-migrations)
- [Database backups](https://supabase.com/docs/guides/platform/backups)
- [Backup and restore with the CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)

## 4. Vercel preview verification

Verify the exact release commit on its Vercel preview before promoting it:

- [ ] Vercel build and function logs contain no unexplained errors or warnings.
- [ ] Public preview pages return `X-Robots-Tag: noindex, nofollow`. Admin/auth
      routes also retain their `noindex` metadata; shared public HTML is not
      expected to contain a host-aware robots meta directive.
- [ ] Home, About, Services, one offence page, Police Station, Fees, Reviews,
      one article, Contact and Cookies load without a browser error overlay.
- [ ] An unknown route returns HTTP 404; `/admin` redirects to authentication and
      remains non-indexable.
- [ ] Uppercase paths and each known alias return a permanent redirect to the
      lowercase canonical apex while preserving path and query string.
- [ ] Titles, descriptions, canonicals, Open Graph data and JSON-LD are present
      in server-rendered HTML.
- [ ] Navigation, mobile menu, FAQ controls and contact actions work at 375px,
      768px, 1024px and 1440px.
- [ ] Telephone, email and WhatsApp destinations are correct; consultation CTAs
      lead to `/contact#consultation`.
- [ ] The enquiry form is tested only against an approved test backend and test
      recipient. Use non-sensitive dummy content.
- [ ] After applying the migration in non-production, rename one published test
      article or ordinary service and verify its old path redirects to the new
      path. Confirm draft destinations do not receive a live redirect.
- [ ] With analytics accepted, submit a non-sensitive test enquiry carrying a
      referrer, UTM values and `gclid`; verify the normalized values in the admin
      detail and confirm they are absent from the email bodies and GA events.
- [ ] There are no TidyCal controls and no public fee figures or fee-admin route.

## 5. Resend and enquiry flow

Complete these checks in the production environment with a harmless test
enquiry. Do not use a real client's details.

- [ ] The sending domain is verified in Resend and the configured From address
      belongs to that domain.
- [ ] The intended notification mailbox and Reply-To behavior are confirmed.
- [ ] A submission creates exactly one production enquiry record.
- [ ] John receives one notification containing the expected non-secret fields.
- [ ] The visitor receives one confirmation without legal guarantees.
- [ ] Replying to the notification addresses the visitor as intended.
- [ ] Validation, honeypot and rate-limit failures do not create duplicate
      records or disclose implementation details.
- [ ] In an approved Preview/staging environment, a deliberate email-delivery
      failure leaves the enquiry stored and produces an actionable server log
      rather than losing the lead. Do not induce this failure in production.

## 6. Analytics and search services

- [ ] The approved GA4 measurement ID is set in Vercel Production only.
- [ ] Before consent, Google Analytics is not requested and analytics storage is
      denied.
- [ ] Accept and Reject are equally accessible; revoking consent stops future
      collection and removes the applicable GA cookies.
- [ ] Page views across client-side navigation and the form/contact events are
      visible in GA4 DebugView.
- [x] `generate_lead` is registered as a key event in the existing John Violaris
      GA4 property without a default monetary value (2026-10-05). Its accepted-form
      trigger is released; registration alone is configuration evidence only.
- [ ] After release, verify one accepted enquiry produces `generate_lead` once,
      rejected forms produce none, and consent withdrawal suppresses events
      across tabs. No test enquiry was sent during local implementation.
- [ ] No name, email address, telephone number, case description or matter type
      reaches analytics.
- [ ] Preview and localhost traffic do not report to the production property.
- [ ] With GA4 enabled/configured and consent granted, released `LCP`, `INP`
      and `CLS` events contain only the intended numeric measurement parameters.
      Confirm no measurement-library load before consent and no metric events
      after cross-tab withdrawal or integration disable. The library is
      registered once per document; regrant must not duplicate observers.
      Local data-layer/fixture checks do not prove receipt by GA4.
- [ ] The cookie policy's analytics/storage claims follow the current GA4
      configuration and integration switch. Turning the integration off must
      remove active-analytics claims and controls.
- [ ] Collect sufficient real-user data and assess LCP/INP/CLS separately from
      Lighthouse. The local numeric collector is preparation, not evidence of
      a field pass; Vercel Speed Insights remains unconfigured.
- [ ] Google Search Console ownership is verified for the primary and secondary
      domains after DNS permits it.
- [ ] Bing Webmaster Tools ownership is verified if retained in launch scope.
- [ ] The production sitemap is submitted only after canonical-domain and
      indexing checks pass.

## 7. Production promotion and domain cutover

Perform the cutover in this order:

1. [ ] Freeze releases and content edits for the cutover window.
2. [ ] Capture the final database restore point and DNS snapshot.
3. [ ] Apply and verify any backward-compatible production migrations.
4. [ ] Promote the already-verified release commit to Vercel Production.
5. [ ] Verify the deployment on its Vercel URL before changing DNS.
6. [ ] Attach the production domains in Vercel and apply the reviewed DNS
       records at the DNS provider.
7. [ ] Make `johnviolaris.com` the canonical host. Configure
       `www.johnviolaris.com`, `drivingjustice.co.uk` and
       `www.drivingjustice.co.uk` to redirect path-for-path to it.
8. [ ] Wait for Vercel to report valid certificates and for public DNS checks to
       resolve to the intended deployment.
9. [ ] Verify HTTP-to-HTTPS, apex/www and secondary-domain redirects with several
       nested paths and query strings.
10. [ ] Run the production smoke tests below before ending the freeze.

Do not repeatedly flip DNS records during propagation. If the cutover is wrong,
use the recorded pre-launch DNS state and the rollback sequence once.

## 8. Production smoke tests

- [ ] `/`, `/about`, `/services`, `/police-station`, `/fees`, `/reviews`,
      `/contact`, `/cookies`, one service and one article return the expected
      successful status.
- [ ] A nonexistent route returns HTTP 404.
- [ ] `/robots.txt` references the canonical sitemap and `/sitemap.xml` contains
      only canonical, public URLs.
- [ ] Every sampled page has one H1, a unique title/description, a self-referencing
      canonical and valid JSON-LD.
- [ ] The canonical site is indexable; admin routes and Vercel previews remain
      `noindex`.
- [ ] Secondary-domain and `www` requests redirect path-for-path to the canonical
      HTTPS URL without a loop, preserving query strings.
- [ ] Mobile and desktop navigation, images, fonts, contact links and the enquiry
      success/error states work without browser-console errors.
- [ ] One harmless production enquiry passes the database and both-email checks
      in §5, then is labelled or removed according to the agreed test-data policy.
- [ ] An authorised admin can sign in, read the enquiry, make and revert one
      non-critical content edit, and sign out.
- [ ] Vercel and Supabase logs remain free of new 5xx, permission and connection
      failures during the monitoring period.

## 9. Rollback triggers

Call a rollback immediately for any of these conditions:

- Public exposure of admin, draft, enquiry or other private data
- Lost, corrupted or duplicated enquiries
- A migration failure or evidence of unintended data deletion
- Persistent 5xx responses, an unusable contact journey or failed admin access
- The canonical production site is globally `noindex`, points at the wrong host,
  or enters a redirect loop
- DNS sends the primary domain to the wrong service, or TLS cannot be established
- Production email sends to an unintended recipient or begins uncontrolled
  duplicate sending

Cosmetic defects with a safe workaround can be triaged after launch; document
the decision rather than improvising a partial rollback.

## 10. Rollback sequence

Use this order so the recovery itself does not create a second incident:

1. **Declare and freeze.** Record the UTC incident time, observed symptom,
   release commit and decision-maker. Stop deploys, migrations and CMS edits.
2. **Contain exposure or writes.** Use an already-established containment
   control if one exists. Otherwise immediately promote the known-good
   deployment, and revoke only a credential known or reasonably suspected to be
   compromised. Replace it through Vercel environment settings; never paste it
   into chat, logs or the repo.
3. **Roll back application code.** For an application-only regression, promote
   the recorded previous known-good Vercel deployment. If an environment value
   caused the failure, restore its previous protected value and redeploy that
   known-good release.
4. **Keep compatible database changes.** If the migration is backward-compatible,
   leave it in place while the older application runs. Prefer a reviewed forward
   fix to an improvised reverse migration.
5. **Recover the database only when necessary.** If data was corrupted or a
   destructive migration cannot be made safe, keep writes stopped and use the
   recorded Supabase backup/PITR point or a reviewed corrective migration.
   Database restore causes downtime and may lose changes after the restore time;
   it also does not restore deleted Storage objects.
6. **Restore DNS only for a cutover failure.** Reapply the captured pre-launch
   records once, then allow for propagation. Do not change DNS merely to repair
   application code that Vercel can roll back directly.
7. **Disable only the failing integration when possible.** Remove or correct the
   GA measurement ID for analytics faults, or correct the Resend configuration,
   then redeploy. Preserve stored enquiries while email is repaired.
8. **Re-verify before reopening.** Repeat the canonical-host, admin isolation,
   enquiry, email and log checks relevant to the incident. End the freeze only
   after the launch owner records the recovery evidence.
9. **Document and follow up.** Record impact, data-loss window, final production
   commit/deployment, database state and the corrective action required before
   the next launch attempt.

## 11. Launch completion record

The launch is complete only when every applicable item above has evidence and:

- [ ] The canonical domain has remained healthy throughout the agreed monitoring
      period.
- [ ] One complete production enquiry journey has succeeded.
- [ ] Search and analytics ownership/configuration is complete or explicitly
      recorded as a named post-launch task with an owner.
- [ ] The final deployment, migration list, DNS state and rollback target are
      recorded privately without secrets.
- [ ] Stakeholders have been told the launch outcome and any accepted follow-up
      work.

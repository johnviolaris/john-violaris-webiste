# Isolated staging acceptance

The current Vercel Preview shares production backend credentials. It is suitable
for read-only rendering checks, not CMS fixtures, uploads, Auth resets or enquiry
submissions. A passing build or SQL fixture suite does not verify the complete
Supabase Auth, Storage and email flow.

Use an explicitly selected local Supabase stack or a separate approved project /
branch. Do not reuse unrelated projects or copy production enquiries, users,
Storage objects or Vault secrets. Creating a paid branch requires cost approval.
See Supabase's [environment guide](https://supabase.com/docs/guides/deployment/managing-environments)
and [branching guide](https://supabase.com/docs/guides/deployment/branching).

## Prepare the initial environment

Create an ignored `.env.staging.local` with credentials from the selected test
backend. The following is a template, not a working configuration:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<test backend public key>
SUPABASE_SECRET_KEY=<test backend privileged key>
ENQUIRY_IP_SALT=<separate random value of at least 32 characters>
RESEND_API_KEY=
NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

Run the offline checker before starting or building the staging app:

```bash
npm run staging:preflight -- --env-file .env.staging.local --supabase-url http://127.0.0.1:54321
```

It reads only that file, rejects this project's production URL and legacy JWT
project references, checks key roles and the selected endpoint, and blocks active
Resend/GA configuration. It makes no network calls, prints no key values and does
not change the running app's environment. A pass does not prove opaque keys
belong to the selected project or authorise writes. Verify project identity and
the actual running app's environment separately. Next.js does not automatically
load `.env.staging.local`; do not leave `.env.local` supplying production values.
Use a separate checkout or an explicitly configured deployment for this work.

Apply the reviewed migration history to the empty test backend using the current
Supabase CLI instructions. Provision synthetic accounts for each required role.
Keep public sign-up disabled and the production Auth redirect URLs separate.
For local Auth mail, use the local inbox; configure hosted Auth SMTP only with an
approved testing destination/provider. Resend being disabled here does not
disable Supabase Auth SMTP.

## Verify through the real application

Record the commit, project identity, app URL, role and before/after state. Use
synthetic names and non-sensitive text. Every fixture must remain unpublished or
exist only on this test backend.

- **Roles and drafts:** verify admin, editor, consultant and unauthenticated
  access with real sessions. Exercise editing, stale-tab conflicts, revision
  restore, private section drafts, scheduled publication and expiry. Confirm
  each role's current permitted actions rather than assuming consultant access
  has been broadened.
- **Locations:** create a draft with court details, FAQ and valid related paths;
  inspect its private preview. Publish only on staging, compare visible FAQ with
  JSON-LD, then withdraw it and verify sitemap/related-link removal. Court
  addresses must never become the practice's business address.
- **Storage:** test an allowed image under 4 MiB, an oversized file and a file
  with a misleading MIME type; verify role checks, actual object persistence and
  removal, draft preview and clean error recovery.
- **Enquiries with Resend disabled:** check valid storage, validation,
  honeypot/rate-limit rejection and the admin delivery-failure state. Confirm
  there is no network call to Resend. This does not prove inbox delivery or the
  production accepted-lead event.
- **Auth:** exercise valid, expired and reused reset links against test users and
  the staging redirect origin. Do not send recovery tokens to production Auth.

## Email and analytics acceptance is a separate step

Only after the intended recipients and test scope are explicitly authorised,
configure an approved test sender/notification address and controlled visitor
mailbox. The visitor confirmation goes to the form's email address; changing
`ENQUIRY_NOTIFICATION_EMAIL` redirects only the admin notification. Site settings
can also supply contact defaults, so review them before enabling delivery.
Use a separate test GA property for staging and verify consent/event behavior.
Production inbox delivery and production GA DebugView still need their own
accepted enquiry check; staging evidence cannot substitute for that.

Remove fixtures and temporary accounts/objects, revoke temporary credentials and
record the final state. Keep secrets and client data out of screenshots, logs,
Git and acceptance reports.

## Reusable location workflow preparation

Run the local module fixtures without starting Next.js or selecting a backend:

```bash
node scripts/verify-location-acceptance.mjs --mode fixtures
```

This invokes the actual location save/delete actions, admin/public reads,
revision reads/restoration, private saved/historical preview, public renderer,
route registry and sitemap. It checks fresh review, London scheduling, start/end
boundaries, related-link withdrawal and schema consistency. Fetch, HTTP(S),
TCP/TLS, DNS and UDP entry points are blocked before importing app modules. Only
owned in-memory fixtures are removed; an unrelated fixture row must remain intact.

These are module integration fixtures. Storage, audit capture and publication/RLS
filtering are simulated. They do not establish real Auth/RLS/Storage, browser
sessions, private HTTP headers, ISR freshness, email or hosted write acceptance.

The following command performs offline preparation and deliberately exits
nonzero. It is **not** a runnable real-browser adapter:

```bash
node scripts/verify-location-acceptance.mjs --mode backend --env-file .env.staging.local --supabase-url http://127.0.0.1:54321 --app-url http://127.0.0.1:3999
```

The existing preflight cannot prove that a running app's server-side credentials
point at the selected backend. A reviewed identity verifier and browser adapter
are still required; this command cannot submit tokens, call a network endpoint
or write a fixture even when the file passes preflight. Once isolation is proven,
perform the real browser checks above with synthetic accounts and record saved
draft, historical preview, publication, scheduling/expiry, withdrawal and cleanup
evidence. Verify sitemap and related-link removal after the actual cache boundary,
and visible FAQ/schema parity. A frontend bundle or unchecked manifest alone is
insufficient proof of server-side backend isolation.

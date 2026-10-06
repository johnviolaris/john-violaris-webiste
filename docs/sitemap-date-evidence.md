# Sitemap modification-date evidence

The sitemap uses valid timestamps from public content dependencies and retained
dates for live section/SEO changes. It does not stamp pages with deployment time,
build time or today's date.
When no supported evidence exists, `lastmod` is omitted. The public sitemap's
route, canonical and noindex rules are unchanged.

The private **SEO metadata → SEO health** report now shows:

- an informational finding for an included route without a valid source date;
- a warning when a page-section, SEO-override, site-setting or media-description
  date read fails, the service/article index falls back, the durable-date RPC is
  unavailable, or the combined date-source read throws.

The checks use public anonymous reads and the date-only RPC after the report's
existing SEO-editor authorisation check. They expose source categories, never
database error text.
Other surviving dates still work if one source fails. Successful empty reads are
different from unavailable reads. The shared route-index reader exposes only a
combined availability flag; its existing service fallback and configured-article
fail-closed behaviour remain unchanged. No extra query is made for diagnostics.

## Durable live section and SEO dates

Migration `20261006151718_public_sitemap_change_dates.sql` adds a private
path/timestamp watermark. Only actual live `page_sections` and SEO content/key
changes update it; equal-content saves and `updated_at`-only writes do not.
Section drafts never update it. Resetting/deleting a live row retains its change
date. The section-to-route mapping follows actual renderer dependencies,
including the narrower shared CTA use, and is compared with the full CMS section
registry in the offline SQL suite.

`get_sitemap_change_dates()` accepts no arguments and returns only currently
registered public paths and their timestamps. Explicit parent publication,
schedule, expiry and location review checks apply even for a signed-in admin.
The function cannot return source values, snapshots, actors or private paths.
The private table and capture functions have no client grants; audit RLS and
private-history grants are unchanged.

Current live baselines retain their original row `updated_at`. Existing audit
history recovers recorded section deletions and fixed-route SEO resets using the
actual deletion event timestamp. Migration/baseline capture time is never an
edit date. Older dynamic SEO deletions lack reliable historical parent visibility
and are deliberately omitted. The migration does not alter public content or
create/publish any location page.

On a successful RPC read, its dates are authoritative for section/SEO sources:
later no-op row timestamps cannot override the real public change. Other shared
settings, media and row-backed content dates still contribute. An unavailable or
older-schema RPC preserves current-row date behaviour and raises a private
warning; it cannot erase surviving source evidence or introduce a clock-based
fallback. Missing, malformed and future watermark evidence receives no invented
date. The public URL, noindex, canonical and publication filters are unchanged.

The original migration's scope does not reconstruct collection withdrawal or
settings/media deletions. The complementary forward capture below addresses
specific events; it does not reconstruct unprovable older history. Code-only
edits still need separately reviewed date provenance. REQ-032 remains partial:
the existence of a `lastmod` on every current URL does not prove every possible
change is dated.

`tests/sitemap-health.test.mjs` covers unavailable versus empty reads through the
actual source reader, preservation of surviving sources, malformed/reset/removed
dates, canonical/noindex exclusions and unchanged public sitemap entries. Its
source-reader fixtures run in a separate process with network calls forbidden.
These are application tests, not hosted database availability acceptance.

The new pgTAP suite has 40 assertions for private grants, minimal RPC shape,
no-op/date-only/draft exclusion, public reset retention, parent visibility,
schedule/expiry/review gates and future/unknown-path filtering. Run it through
the repository's `supabase test db` CI gate. Without Docker, the pinned temporary
PGlite runtime can execute the actual migration and the same SQL assertions:

```bash
node --import ./scripts/alias-hook.mjs scripts/verify-sitemap-change-dates-sql.mjs <temporary-pglite-directory>
```

That offline verifier also checks original baseline timestamps, historical
deletion recovery, excluded unverifiable/private history, idempotent backfill,
all 26 section mappings and denied direct table access. Its lightweight assertion
adapters are not the pgTAP extension, and Supabase Auth is simulated. No hosted
database, API credentials, CMS content or remote fixture is used.

## Shared dependencies and public withdrawals

Migration `20261006162445_public_sitemap_dependency_dates.sql` extends the same
private watermark. It changes no source rows, public wording, content history,
review plans, roles or existing RLS. The new zero-argument
`get_sitemap_dependency_dates()` is a **security-invoker** capability wrapper
around the existing reviewed date projection, with the same path/timestamp
payload and explicit anonymous/authenticated execute grants. The private table
and capture functions retain their revoked client access.

The reader normally makes one wrapper call. A missing, malformed or failed
wrapper falls back to the old RPC, preserves its current-row dependency behavior,
and reports unavailable shared-dependency coverage privately. A failed old RPC
also preserves other surviving source reads. New covered dependency rows become
authoritative only at paths with a valid retained baseline; empty/future/malformed
results cannot erase a surviving dependency timestamp.

Forward capture follows these actual render dependencies:

- Fixed-default settings `name`, `role`, `jurisdiction`, `email`, `responseTime`,
  `sraNumber`, `qualifiedYear`, `reviewSolicitorsUrl`, `lawSocietyUrl` and
  `linkedinUrl` affect shared layout/site markup on current public routes.
  `initials` affects home only. Trimming, clearing to an identical fixed default,
  equal values and timestamp-only writes do not advance their retained dates.
  Unknown keys, email-only `roleLong`, crawl/integration settings and unverified
  practice facts are excluded from this capture.
- Env-derived phone/WhatsApp defaults are unknown to SQL. Capture can compare
  two known nonempty overrides, including normalized WhatsApp links, but does
  not guess the effect of first insertion or clearing/deleting one. Their app
  dates deliberately remain row-backed, so these fields **do not have a general
  no-op date guarantee**. Conditional verified practice facts also remain
  row-backed under the existing renderer validation.
- Media metadata affects the currently used home portrait and live article
  figures only. Existing legacy portrait URLs are normalized. Decorative-hidden
  alt changes and format-only edits to an empty caption are ignored. Metadata
  deletion compares the actual restored per-use/default presentation. Blog
  index cards have no image and receive no media date. Unused assets, private
  hero drafts, draft/future/expired article references are excluded. Existing
  media URL immutability and public-object storage behavior are unchanged.
- Published catalogue membership and effective name/href/group/icon/statute
  changes affect shared navigation/footer/site markup. Featured membership and
  featured short labels affect home only. Card intros affect home/services and
  an offence's own intro only where a public long-form intro does not override
  it. Empty optional statute, unchanged effective custom href and fixed card
  defaults are normalized. No service wording is modified.
- Live article membership/card/order-source changes date `/blog`; a surviving
  article is dated only when its actual selected top-three More guides
  href/title list changes. Body-only edits do not change those collection dates.
  Related location dates likewise compare the actual selected href/title arrays
  using the existing location ordering and 500-candidate limit. Unchanged
  single-link output receives no date merely because a location's sort name
  changed. Ambiguous ordering ties are omitted rather than guessed.

The route gate permits the existing published catalogue offence routes that
render fallback copy even with an unpublished/missing body. It excludes custom
or explicit empty hrefs and invalid nested slug syntax. No current static route
reserves a child segment under `/services`, `/blog` or `/locations`; new static
children require reviewing this mapping. SEO source eligibility remains separate:
existing anonymous metadata RLS still requires a published service body, so a
hidden override cannot advance the public fallback route's date. Article windows
and location review/windows apply to public projection even for signed-in admins.

Backfill uses only valid original `updated_at` timestamps of currently provable
uses. It retains existing source-date evidence, rather than asserting that an
old row timestamp proves a semantic/legal review. String-valued rows at fixed
public setting keys include empty/default-equivalent legacy rows: their inherited
date metadata must survive the new authoritative source, while forward no-op
capture still ignores equivalent values. It uses no migration clock,
historical settings/media reference guesses or new content revision. Deletions
and withdrawals after installation retain actual event dates even when their
rows disappear; removed routes are excluded from the public projection.

Limits remain: collection changes caused solely by the passage of schedule
boundaries; older unproved withdrawals/deletions; service-body withdrawal/reset
that reveals fallback copy; catalogue sort-only changes; shared group/category
changes; duplicate catalogue href description precedence; ambiguous link-order
ties; deployment-dependent defaults; and significant code-only changes. CMS
testimonials are not captured because no public renderer currently reads that
table. Independent row-backed service/article dates still supply their own
content timestamps, including their existing no-op limitations. Printed Updated
dates and article schema dates are unchanged by this sitemap-only feature.

The complementary suite contains 78 pgTAP assertions. The offline verifier also
checks migration source/history/sequence preservation, original/idempotent
baselines, effective setting values against `resolveSiteConfig`, image values
against `mediaPresentation`, and catalogue projections against `toService`:

```bash
node --import ./scripts/alias-hook.mjs scripts/verify-sitemap-dependency-dates-sql.mjs <temporary-pglite-directory>
```

It executes actual PostgreSQL SQL with simulated Auth and assertion adapters;
actual Supabase pgTAP CI and hosted read-only parity are separate acceptance.
No hosted fixture, Auth token, content write or remote query is performed.

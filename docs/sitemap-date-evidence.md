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

This scope does not reconstruct collection withdrawal/deletion, settings/media
deletions or unrecorded historical changes. Code-only edits still need separately
reviewed date provenance. REQ-032 remains partial: the existence of a `lastmod`
on every current URL does not prove every possible change is dated.

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

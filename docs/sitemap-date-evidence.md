# Sitemap modification-date evidence

The sitemap uses valid timestamps from current public content dependencies. It
does not stamp pages with the deployment date, build time or today's date.
When no supported evidence exists, `lastmod` is omitted. The public sitemap's
route, canonical and noindex rules are unchanged.

The private **SEO metadata → SEO health** report now shows:

- an informational finding for an included route without a valid source date;
- a warning when a page-section, SEO-override, site-setting or media-description
  date read fails, the service/article index falls back, or the combined
  date-source read throws.

The checks use public anonymous reads after the report's existing SEO-editor
authorisation check. They expose source categories, never database error text.
Other surviving dates still work if one source fails. Successful empty reads are
different from unavailable reads. The shared route-index reader exposes only a
combined availability flag; its existing service fallback and configured-article
fail-closed behaviour remain unchanged. No extra query is made for diagnostics.

Deleting/resetting a CMS row can erase its timestamp; a remaining dependency may
also have an older timestamp. These checks cannot reconstruct the deleted change
or detect every such deletion. Code-only edits also need separate dated evidence
before they can truthfully receive a date. Keep this limitation open in REQ-032;
do not consider every `lastmod` fully audited merely because every URL currently
has one.

`tests/sitemap-health.test.mjs` covers unavailable versus empty reads through the
actual source reader, preservation of surviving sources, malformed/reset/removed
dates, canonical/noindex exclusions and unchanged public sitemap entries. Its
source-reader fixtures run in a separate process with network calls forbidden.
These are application tests, not a hosted database availability test or a durable
deletion audit trail.

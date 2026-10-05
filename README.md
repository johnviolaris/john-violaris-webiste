# John Violaris — Criminal Defence Solicitor

Next.js 16 App Router, React 19, TypeScript and Tailwind CSS v4.
Use Node.js 24 and `npm ci` for the locked development/build dependencies.

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm test
```

## Current implementation

An editorial redesign using the exact reference HTML navy, gold and warm whites, with large
serif typography and a typographic JV identity. The design intentionally works
without stock portraits or invented client reviews.

- Homepage with personal introduction, experience statistics, service explorer,
  police station feature, process, expandable FAQs, fee-process preview and consultation CTA.
- A persistent route to John on every page: a slim contact rail above the masthead
  from 640px up, and a docked action bar below 1280px that appears once the hero
  has been scrolled past. Both render only the routes that are configured.
- Footer contact facts (email, telephone when set, response time, coverage) and a
  plain-language note on the contact page that getting in touch is not instructing.
- Original all-services mega-menu retained, including mouse hover, click,
  keyboard activation, Escape dismissal and inert closed content. Available from
  640px upward; smaller screens reach the catalogue through the mobile navigation.
- Mobile navigation with scroll lock, focus trapping, Escape/close controls and
  automatic dismissal on navigation or resizing to desktop.
- About, Services, Police Station, Fees, Reviews, Contact and Resources pages,
  plus a cookie policy and a privacy notice.
- Published service pages generated from a shared template and the service catalogue.
- A fees page that explains how fees are worked out, deliberately without
  figures.
- A working enquiry form on the contact page: server-side validation with
  field-level errors, a honeypot and a per-address rate limit, storage in
  Supabase, and Resend notification and confirmation emails.
- An admin enquiry inbox at `/admin/enquiries` with status filters, a detail
  view, reply and call actions, email delivery state and permanent deletion for
  erasure requests.
- Expanded professional background, police-station guidance, service evidence
  checklists, sentencing summaries and fee guidance.
- Six complete legal-guide article pages based on the reference index cards.
- Editable page copy: the hero, section headings, process steps, FAQ and the
  rest of the core-page wording, managed at `/admin/website-content`.
- Site settings at `/admin/site-settings`: name, contact details and the SRA
  number, with the built-in value shown as each field’s placeholder.
- A read-only view of the imported ReviewSolicitors reviews, with no edit path,
  so an independently collected review stays one.
- Page-specific titles, descriptions and canonical URLs, and Schema.org
  structured data on every public page.
- Consultation links route to the contact page, which offers email, telephone
  and WhatsApp. There is no booking calendar.
- Live at https://johnviolaris.com since 2026-10-03. `www.johnviolaris.com`,
  `drivingjustice.co.uk` and `www.drivingjustice.co.uk` redirect to it in
  Vercel's domain settings, with the same rule in `proxy.ts` behind them. The
  old GoDaddy site's `/ols/` store pages redirect to the home page.

## Content and configuration

`lib/site-config.ts` holds the shape, the defaults and the navigation; the
values are edited under Site Settings (see below). The environment variables
below remain the defaults, used until a setting is given a value:

| Variable                      | Purpose                            |
| ----------------------------- | ---------------------------------- |
| `NEXT_PUBLIC_PHONE_NUMBER`    | Confirmed E.164 telephone number   |
| `NEXT_PUBLIC_PHONE_DISPLAY`   | Human-readable telephone number    |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | WhatsApp number, any usual format  |
| `NEXT_PUBLIC_APP_VERSION`     | Build identifier for stale-tab detection (see below). Only needed where the deploy exposes neither a Vercel deployment id nor a git checkout. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 measurement ID (`G-…`). Unset, there is no analytics and no cookie banner. Set it in Vercel's **Production** environment only (see "Analytics and consent"). |

Server-side variables. These are never sent to the browser and must not be
prefixed with `NEXT_PUBLIC_`:

| Variable                     | Required | Purpose                                                                                     |
| ---------------------------- | -------- | ------------------------------------------------------------------------------------------- |
| `SUPABASE_SECRET_KEY`        | Yes      | Supabase secret (`service_role`) key. The enquiry form cannot store a submission without it.  |
| `RESEND_API_KEY`             | Yes      | Resend API key. Without it enquiries are still stored, but no email is sent.                  |
| `ENQUIRY_FROM_EMAIL`         | Yes      | Sending identity, e.g. `John Violaris <enquiries@johnviolaris.com>`. Domain must be verified in Resend. |
| `ENQUIRY_NOTIFICATION_EMAIL` | No       | Where enquiry notifications land. Defaults to the address in `lib/site-config.ts`.            |
| `ENQUIRY_IP_SALT`            | No       | Random string salting the hashed address used for rate limiting. Set one in production.       |

Until `ENQUIRY_FROM_EMAIL` points at a verified domain, Resend's shared
`onboarding@resend.dev` sender is used, which can only deliver to the Resend
account owner — enough for testing, not for launch.

WhatsApp is click-to-chat only, per PRD §8 — no Business API. `whatsappHref()`
in `lib/site-config.ts` returns `null` unless a usable number is configured, so
every view omits the route entirely rather than offering a "WhatsApp" control
that leads somewhere else. Set the number in whatever shape it is supplied
(`+44 7700 900123`, `07700 900123`, `447700900123`): it is normalised to the
digits `wa.me` expects, and a value that cannot be read as a phone number is
treated as unset rather than rendered as a broken link.

Chats opened from a service page prefill the offence — "Hello John, I’d like
to speak to you about Drink Driving." — so a message arrives already saying
what it concerns. Every other entry point opens an empty chat: nothing puts
words in the visitor’s mouth unless the page genuinely knows what the matter
is, and no prefill ever describes a case more broadly than the page it came
from.

Phone links still fall back to the contact page when unset and no fabricated
number is dialled. Note that the contact page does currently render the
`phoneDisplay` placeholder as though it were a number; that belongs with the
telephone work rather than the WhatsApp integration.
Confirm the existing email address (`contact@johnviolaris.com`) before launch.
Set the verified SRA number in central configuration when supplied.

## The CMS content layer

`lib/cms/` is the path between the Supabase content tables and the site. The
blog, the page copy, the site settings, the service catalogue, the offence
pages and every public route's SEO metadata are served through it.
Sections were migrated one at a time.

| Module            | Role                                                          |
| ----------------- | ------------------------------------------------------------- |
| `types.ts`        | What goes in each table's `content` jsonb column               |
| `seed-data.ts`    | Today's static content, expressed as rows                      |
| `mappers.ts`      | Row → the shape the components already render                  |
| `queries.ts`      | Public reads (anon, no cookies, published rows only)           |
| `admin-queries.ts`| Admin reads (cookie session, drafts included)                  |
| `write.ts`        | The one wrapper every mutation goes through                    |
| `revalidate.ts`   | Which routes to rebuild after a change                         |
| `form.ts`         | Shared form state and validation for the admin forms           |
| `sections/`       | The editable page copy — registry, values, save action         |
| `services/`       | The service catalogue — field rules and mutations              |
| `service-pages/`  | The offence pages — field rules and mutations                  |
| `seo/`            | Route registry, metadata resolution, SEO overrides             |
| `settings/`       | Site settings — the editable field list and its save action    |

Public reads go through `utils/supabase/public.ts` — the publishable key and no
cookies, because a page that reads `cookies()` cannot be statically rendered and
every public page here is static. RLS is what limits those reads to published
rows, rather than a `.eq("published", true)` a later refactor could drop.

A read generally falls back to the static seed when Supabase **errors**, and never when it
simply returns no rows. Configured blog reads and the SEO route index fail closed;
they must not resurrect withdrawn or scheduled seed articles. Location reads
also fail closed and have no seed fallback. An empty answer is the truthful one — nothing is
published — and treating it as a failure would make it impossible for John to
unpublish the last testimonial. Fallbacks log loudly.

Writes call `revalidatePath` through `revalidateFor()`. Not `revalidateTag`:
tagging non-`fetch` reads needs either `unstable_cache`, deprecated in Next 16,
or the Cache Components model, which changes rendering for the entire app.
Because the header carries the services menu and the footer the contact details,
a change to either really does invalidate every page, and the map says so.

### The seed

`supabase/migrations/*_seed_cms_content.sql` loads the current static content
into the tables, so switching a section to the CMS changes nothing a visitor
sees. It is generated, not written:

```bash
npm run cms:verify
```

```bash
npm run cms:seed
```

`cms:verify` puts every seeded row through the same mapper the site uses and
compares the result against the static module rendered today; `cms:seed`
regenerates the migration in place. Run the verifier after editing anything in
`lib/content/` or `lib/cms/` — a failure means a page would change when it
switched over.

Every statement in the seed is guarded by `where not exists (select 1 from
<table>)`, so applying it to a database that already holds content does nothing.
That guard is not politeness: a seed that overwrote on conflict would delete
John's edits the next time anyone reset the database.

The scripts run under plain `node` with `scripts/alias-hook.mjs`, which teaches
it the `@/*` path alias so the generator can import exactly what the app imports.

`lib/content/services.ts`, `service-descriptions.ts` and `service-detail.ts`
are now the seed and the fallback for the service catalogue and the offence
pages, as `blog.ts` is for the blog. Check all professional claims,
statute references and marketing copy with John before publication. The older
`lib/content/home.ts` retains previous draft content for reference; its placeholder
reviews and career history are not rendered by the redesigned pages.

## The blog

The blog is the first section served from the CMS. `/blog` and `/blog/[slug]`
read from Supabase; `lib/content/blog.ts` is now only the seed and the fallback.

Admin routes:

| Route                     | What it does                                      |
| ------------------------- | ------------------------------------------------- |
| `/admin/blog-posts`       | Every article, drafts included; publish in one click |
| `/admin/blog-posts/new`   | Write a new one                                   |
| `/admin/blog-posts/[id]`  | Edit, publish, delete                             |
| `/admin/blog-categories`  | Add, rename and remove categories                 |

An article body is a list of **sections** — a heading, paragraphs, and an
optional bulleted list — not markdown or HTML. That is the shape the article
page already renders and the shape its "on this page" rail is built from, so the
CMS stores structure and the page keeps its own typography. Sections can be
added, reordered and removed in the editor.

Drafts are invisible to visitors: the existing `blog_posts` read policy requires
`published`. The pending scheduling migration also enforces the publication
start and expiry window. An unpublished article is not merely hidden by the UI —
it is not readable with the publishable key at all. Publishing an article for
the first time dates it; unpublishing keeps that date, so republishing later
does not present an old article as new. Deleting a category leaves its articles
published without one, and the admin says so before you confirm.

Articles prerender at build time, and `dynamicParams` is left at its default so
an article published after a deploy renders on first request instead of 404ing
until the next build.

Each article shows who wrote it and how current it is (REQ-063): John's name,
linking to the About page (`rel="author"`), his role, and "Updated" with the
date of the last save. That date is the same value as `dateModified` in the
structured data. It says "Updated" rather than "Reviewed" because a save shows
that the article changed, not that the law in it was re-checked.

### Images

`blog-images` is a public Supabase Storage bucket: public read, admin-only
write, 5 MB per file, JPEG/PNG/WebP/AVIF only, enforced both on the bucket and
in `uploadBlogImage` so a rejection is a sentence rather than an error code.
Filenames are generated rather than taken from the upload.

An image is uploaded as soon as it is chosen, not on save, so the editor
previews the real stored object. Alt text is required whenever an image is set.
The article page renders the image only when one exists, so the six existing
articles look exactly as they did. `next.config.ts` derives the allowed image
host from `NEXT_PUBLIC_SUPABASE_URL` rather than hardcoding the project ref.

## Website content

The editorial copy on the core pages — the hero, the section headings, the
standfirsts, the process steps, the FAQ — is editable at
`/admin/website-content`. It is the second section served from the CMS, after
the blog.

Three files carry it:

| File                          | Role                                                  |
| ----------------------------- | ----------------------------------------------------- |
| `lib/content/pages.ts`        | The copy as written: the default, and the fallback     |
| `lib/cms/sections/schema.ts`  | Which sections are editable and what fields each has   |
| `lib/cms/sections/values.ts`  | Stored data ↔ form text, shared by editor and action   |

The registry is the whole feature. A section is a list of fields, the copy
those fields hold by default, and the routes it renders on, so the editor, the
action that receives it and the revalidation after a save are all written once
against that description. Making another piece of copy editable is an entry in
`schema.ts` and a prop on the component — not a new form, a new action or a
migration.

### No seed, and why

Unlike the other content tables, `page_sections` is not seeded and has no
`published` column. A section John has never edited simply has no row, and the
read falls back to `lib/content/pages.ts`. That keeps the defaults the single
definition of what a section says out of the box: nothing in the database is a
copy of them, so nothing can drift from them, and "revert to original" is a
`delete` rather than a write of today's wording.

It also means the third rule in `lib/cms/queries.ts` — fall back on failure,
never on emptiness — reads differently here, deliberately. Elsewhere no rows is
a truthful answer that must be rendered: nothing is published. Here there is no
publish flag, so no row means nobody has edited the section, not that it is
hidden.

### Line breaks

Several headings break at a chosen point — "Your defence…" above "My personal
attention." — and that break is a design decision, not the browser wrapping
text. Those fields are stored as a list of lines and rendered by `Lines` in
`components/ui/lines.tsx`. An editor types lines; nobody types markup. Prose
fields are lists too, but of paragraphs, split on blank lines rather than
single ones, for the same reason `readParagraphs` gives.

### Sections on more than one page

Four sections appear on two routes — Meet John on `/` and `/about`, the police
station feature on `/` and `/police-station`, the questions on `/` and `/fees`,
the process on `/` and `/about`. Each is edited in one place, under the page it
belongs to, and every page that renders it reads it from there. `appearsOn` in
the registry is what the editor shows and what the save revalidates, so the
routes a change reaches are declared once rather than remembered.

The closing call to action is the exception that proves it: `appearsOn: ["*"]`,
because it really is in the body of every page, and it revalidates `("/",
"layout")` rather than a hand-written list that would be wrong the next time a
route is added. The article and offence pages pass their own heading to it,
which stays with those sections rather than here.

### Images

`image` is a field kind like the others: the article picker, uploading to the
`site/` folder of the image bucket as soon as a file is chosen, and stored as
the image's address. The hero portrait is the first, with a required
`portraitAlt` beside it; the default is `/john-violaris-portrait.webp` (137,298
bytes, down from 2,013,504). Saved legacy portrait URLs are mapped to the new
asset, and the original public image URL redirects. The default share card
(`/share-image`) keeps the bundled portrait whatever the hero shows.

### Reverting

"Revert to original" is a second submit button of the section's own form
(`name="intent" value="reset"`), not a form of its own. The editor's rows,
images and text are its own state; as a separate form the revert deleted the
row but left the editor showing the discarded edits, and the next save put
them back. Now the answer returns through the editor's state and it resets
itself. The SEO editor's "Reset to defaults" works the same way.

## Fees

The site publishes no fee figures. `/fees` has its opening, three numbered
cards (`stages`), a few paragraphs on how fees are worked out (`body`) and the
questions it shares with the home page (`preview`), all in the Fees group
under Website Content.

There used to be more: a fee schedule (fee cards and a full price table, with
an admin editor at `/admin/fees`) and a three-stage "What is covered"
comparison (`FeesMatrix`). Both were removed on 2026-09-24 at John's request,
and `20260924150000_drop_fees.sql` drops the `fees` table the schedule read
from. Git history has them.

## Site settings

`lib/site-config.ts` is still where every phone number, address, email and
external URL comes from — but it now holds the *shape and the defaults* rather
than the values. `/admin/site-settings` edits the values.

The split inside that file is the thing to understand:

- **`SiteSettings`** is what John can edit: his name, role, monogram,
  jurisdiction, email, both forms of the telephone number, the WhatsApp number,
  the response promise, the SRA number, the year he qualified, and the public
  profiles that go into the structured data's `sameAs`. The practice's
  ReviewSolicitors page has a default. The Law Society and LinkedIn profiles
  have none: a guessed link would tell Google a stranger's page is John's, so
  they stay empty, and absent from the markup, until the real addresses are
  entered. A profile link is refused unless it is on the right site. The defaults are
  still read from the environment, so an existing deploy keeps working exactly
  as it did until someone edits a setting; a stored value simply wins over one.
- **`deployment`** is configuration, not content: the canonical domain, the
  secondary domain and the dialling code. The canonical domain decides
  `metadataBase` and every canonical URL on the site, and changing it from a
  browser would detach them from the domain actually serving the page. An
  earlier seed put those three in `site_settings`;
  `20260923103000_drop_deployment_site_settings.sql` takes them back out,
  because a row that looks authoritative and is ignored is worse than no row.

`resolveSiteConfig` lays stored values over the defaults and derives `telHref`,
`mailtoHref`, `bookingHref` (the internal name for `/contact#consultation`, not
an external booking service) and the normalised WhatsApp digits. Only non-empty
values override: clearing a field in the admin deletes its row, which is what
makes "leave it blank to fall back" true rather than a figure of speech.

### Reaching the components

Server components read it with `getSiteConfig()`. Client components — the
masthead, the services menu, the docked contact bar, the hero and the enquiry
form, all of which need scroll listeners, focus traps or `useActionState` —
take it from `useSiteConfig()`, which the site layout provides after reading it
once.

`SiteConfig` is plain data for exactly that reason: a function cannot be
serialised across the server/client boundary, so `whatsappHref(config, subject)`
is a standalone function taking the config rather than a method on it.

Two places deliberately use `fallbackSiteConfig` instead: `app/error.tsx` and
`app/not-found.tsx`. An error boundary whose branding needs a database read is
an error boundary that fails when the read is what broke.

The enquiry emails read the live settings at send time rather than a snapshot
taken when the module loaded, so an enquiry arriving an hour after John changes
his telephone number quotes the new one.

## Services and offence pages

Two admin sections, one per table.

**`/admin/services`** is the catalogue: the name, the menu group, the icon, the
reference line under the name, the card summary, and whether the service sits
in the rail of common charges beneath the hero. It drives the services
mega-menu, the services explorer on the home and services pages, the footer's
services column and that rail. The site layout reads the catalogue once and
hands it to those client components through `ServiceCatalogueProvider`, the
same arrangement as `SiteConfigProvider`; the footer takes it as a prop.

- **The slug is fixed once a service exists.** `/services/<slug>` is the offence
  page's address, and articles store it as their related service, the main
  navigation links to one by hand, and search engines have the rest.
- **Position is not a field.** The arrows move a service within its group; a
  service added to a group, or moved to another, goes to the end of it; a new
  group appears at the end of the menu. Groups sit where their first member
  does, so a raw number would let one service drag its whole group to the top.
- **Police station representation** links to its own page (`content.href`).
  The save carries that link over, and it has no offence page to write.
- The group named in `representationGroup` (`lib/content/services.ts`) is
  treated as general crime on its pages: no statute sentence, no request for a
  driving record. Renaming it in the CMS would change that, and the editor says
  so beside the field.

**`/admin/service-pages`** is the long-form page for each service: the heading
and standfirst, up to three at-a-glance cards, the points examined, and the
optional outcomes and ancillary-orders tables. The repeating groups use the
same `ItemsField` and `readItems` as Website Content. A page is addressed by
its service, and the first save creates it.

- A draft saves with only a heading. Publishing — from the editor or from the
  list — needs the rest, so a half-written page cannot go live.
- A published service with no published page still resolves, with the general
  copy it always had, rather than 404ing from a link the menu printed.
- `process` is stored on every page but no page renders it, so it has no field;
  the save carries it over. The copy every offence page shares — "Clarity
  first", the checklist, the contact card — is template text, not editable
  here.

`20260923140000_sync_magistrates_court_page.sql` brought the Magistrates Court
page in the database up to the site's wording before the switch. It had been
rewritten in `lib/content/service-detail.ts` after it was seeded, and nothing
noticed while the pages still rendered from the file.

## SEO metadata

`/admin/seo-metadata` lists every public route — the fixed pages, each
published offence page and each published article — with what it shows in
Google, and edits an override for any of them: search title and description,
share title, description and image, a canonical, and "hide from search".

Three modules in `lib/cms/seo/`, and the split is the design:

- **`routes.ts`** is the route registry: every public route and what it says by
  default — its heading and standfirst, "*Offence* Solicitor", an article's
  headline, excerpt and featured image. The SEO admin, each route's
  `generateMetadata` and `app/sitemap.ts` all read it, so a route cannot be in
  the sitemap without being editable, or the other way round. The save action
  also refuses any path not on it.
- **`resolve.ts`** decides the order (SEO requirement REQ-009): the root layout,
  then the route's defaults, then the override. It is pure, and `npm run
  seo:verify` tests the cases the requirement names.
- **`metadata.ts`** is what the routes call: `seoMetadataFor(path)`, and
  `structuredDataFor(path)` for the page's Schema.org markup.
- **`json-ld.ts`** builds that markup. It is pure, like `resolve.ts`.

Things that are easy to get wrong here:

- **Next merges metadata shallowly.** A route that sets any `openGraph` field
  replaces the root layout's whole `openGraph`, site name and locale included,
  so the resolver always builds it whole. Before this, articles shipped without
  `og:site_name`, and every page's `og:url` was the home page.
- **Titles.** An override is the part before " | John Violaris"; the template
  adds the rest. A page shares its full title, an article its headline alone —
  as Next produced before routes set `openGraph` themselves.
- **Streaming metadata.** In development, and for any route rendered on
  request, Next 16 may stream the tags into `<body>` for ordinary browsers. It
  keeps them in `<head>` for crawlers that cannot run JavaScript, WhatsApp and
  Facebook included (`htmlLimitedBots`). The public pages are prerendered, so
  their tags are in `<head>` for everyone.
- **Overrides are keyed by path.** Renaming an article moves its override;
  deleting an article or a service removes it (`lib/cms/seo/overrides.ts`).
- An override with nothing left in it is deleted, not stored empty, so
  "customised" means "has a row". "Reset to defaults" is a second submit button
  of the editor form, so its result returns through the editor's own state and
  the fields empty themselves.

`app/sitemap.ts` builds `/sitemap.xml` from the registry, leaving out any route
hidden from search or canonical to another address. Only routes backed by a row
carry `lastmod`. `app/robots.ts` allows everything public and disallows
`/admin`, `/auth` and `/api`.

### Only the canonical host is indexed

`proxy.ts` permanently redirects the three known production aliases —
`www.johnviolaris.com`, `drivingjustice.co.uk` and
`www.drivingjustice.co.uk` — path-for-path and query-for-query to the canonical
HTTPS apex. Other non-canonical hosts, including Vercel previews and localhost,
continue to serve in place with `X-Robots-Tag: noindex, nofollow`. `/admin` and
`/auth` receive the same header on every host (REQ-035). This is decided from
the request's `Host` header because the pages themselves are static and shared
across deployments.

### The default share card

`/share-image` (`app/share-image/route.tsx`) is the card a shared link shows
when its page has no image of its own: navy and gold, John's name and role from
Site Settings, and the hero portrait. The resolver uses it last, after an
override's image and an article's featured image.

- **A route, not an `opengraph-image` file.** File-based metadata outranks
  `generateMetadata`, so a root `opengraph-image` would replace every page's
  own share image and every featured image.
- **JPEG, about 60 KB.** `ImageResponse` renders PNG, and with a photograph in
  it that is most of a megabyte; WhatsApp is widely reported to drop preview
  images much over 300 KB. `sharp` re-encodes it.
- **Built at deploy, rebuilt on a Site Settings save** (`force-static`, and
  `site-settings` revalidates `/share-image`).
- **The fonts are the site's own, as TTF,** in `assets/fonts/` —
  `ImageResponse` cannot read the WOFF2 `next/font` serves. OFL-licensed; see
  the README there.
- **Every file path it reads is written out whole.** A path built from a
  variable makes the bundler trace the entire project, `public/` included, into
  the function. `outputFileTracingIncludes` in `next.config.ts` names the same
  files for the rebuild on the server.

### Structured data

Every public page carries one JSON-LD block (`components/ui/json-ld.tsx`),
built in `lib/cms/seo/json-ld.ts`. It is one connected graph, and its nodes
refer to each other by `@id` instead of repeating a name or number (REQ-017):

- **On every page:** the `WebSite`, the practice (`LegalService`) and John
  (`Person`), from Site Settings and the published service catalogue. Their
  `@id`s (`https://johnviolaris.com/#website`, `/#practice`, `/#john`) are
  permanent once the site is live. Do not change them.
- **Per page:** a `WebPage` (`AboutPage`, `ContactPage`, `CollectionPage` where
  one fits), named as its `<title>` is, and a `BreadcrumbList` matching the
  trail printed above the heading. Service pages add a `Service` provided by
  the practice, and articles add a `BlogPosting` by John. `/fees` is an
  `FAQPage` whose questions are the ones on the page. The home page shows the
  same questions, but they are marked up only once, because Google asks for
  that.

Nothing unset is emitted. No `telephone` until a number is configured, no SRA
`identifier` until one is saved in Site Settings, and a profile link appears
in `sameAs` only once its address is set there. John's qualification is a
`hasCredential` dated by the "Year qualified" setting, which also drives the
footer's "Qualified since". There is no address, opening hours or price,
because the site states none. Reviews get no
markup: they come from the ReviewSolicitors widget, and REQ-016 says not to
duplicate those.

`npm run schema:verify` fetches every route in the sitemap from a running
server (`http://localhost:3000`, or pass another base URL) and checks each
block. It confirms that every type and property is valid in the Schema.org
vocabulary, that references resolve, that nothing is empty, and that the
breadcrumb and FAQ match the page. Before launch, still check one page of each
kind by hand in Google's Rich Results Test (REQ-019).

## Reviews

The reviews at `/admin/testimonials` are read only, and that is the point.
Every one was left by a client on ReviewSolicitors and collected by them; the
site presents them as independently verified, which is true only while nobody
on this side can alter the wording. So there is no edit form — correcting a
review means taking it up with ReviewSolicitors.

The page exists because "what is the site showing?" is a fair question that
should not be answered by reading the public page. The copy framing the
section — the heading, the button, the note — is ordinary page content and is
editable under Website Content.

## Admin accounts and passwords

There is no public sign-up. An admin account is created in the Supabase
dashboard and given the role by hand:

1. Authentication → Users → Add user → Create new user, with "Auto Confirm
   User" ticked. Any password will do if the person will set their own through
   the reset flow below.
2. In the SQL Editor:
   `update public.profiles set role = 'admin' where id = (select id from auth.users where email = '…');`

`requireAdmin()` and the RLS policies check `profiles.role`; an account without
the admin role sees nothing. Turn off "Allow new users to sign up" under
Authentication → Sign In / Providers: creating users from the dashboard works
without it.

### Password reset

Supabase's own recovery flow. "Forgot your password?" on `/auth` leads to
`/auth/forgot-password`, which calls `resetPasswordForEmail` and always answers
"check your email", so the form never reveals which addresses have accounts.
The emailed link opens `/auth/confirm`, which verifies it (`verifyOtp` for a
`token_hash`, `exchangeCodeForSession` for the default template's `code`), signs
the visitor in and sends them to `/auth/update-password`. Saving a new password
signs out every other session. The `next` parameter is followed only when it is
a plain path on this site (`lib/auth-redirect.ts`).

It depends on three dashboard settings that this repository cannot hold:

- **URL Configuration.** Site URL `https://johnviolaris.com`. Redirect URLs
  include `https://johnviolaris.com/auth/confirm` (and
  `http://localhost:3000/auth/confirm` for local testing).
- **Reset Password email template** (Authentication → Emails). Its link should
  be `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/update-password`.
  With the default template the reset still works, but only in the browser
  that asked for the email (PKCE): a phone's mail app that opens links in its
  own browser fails.
- **Custom SMTP.** Supabase's built-in email delivers only to members of the
  project's Supabase team, two messages an hour. Anyone else, John included,
  receives nothing until a custom SMTP server is set under Authentication →
  Emails.

## Enquiries

An enquiry is written to `public.enquiries` first, and the visitor is told it
arrived as soon as that succeeds. Both emails are sent afterwards, through
`after()`, so a Resend outage costs a notification but never the enquiry. What
was and was not delivered is recorded on the row and shown in the inbox.

The table grants nothing to `anon`, so it cannot be reached from the browser
with the publishable key at all. Submissions go through the server action in
`lib/enquiries/actions.ts` using the secret key, which keeps validation, the
honeypot and the rate limit on the only path into the table. Admin reads and
status changes use the ordinary cookie-backed client, so RLS stays the authority
on those.

Rows hold a named person's account of an allegation against them. Treat them as
sensitive: the inbox is admin-only, no enquiry is ever rendered on the public
site, and deletion from the detail page is how an erasure request is honoured.

Migration `20260927215019_redirects_and_enquiry_attribution.sql` (applied to
production 2026-10-03) adds an external referrer (origin and path only), five
UTM fields and `gclid` to each enquiry. With analytics configured, first-touch
values are kept for the current tab only after the visitor accepts analytics
storage, submitted only with an enquiry, and shown in the admin detail view.
They are read from the address, never removed from it: Google's tag loads only
after consent and takes the campaign and `gclid` from the address at that
moment.

The rate limit stores a salted SHA-256 of the visitor's IP address, never the
address. The salt is `ENQUIRY_IP_SALT`, or the server-only Supabase key when
that is unset, so the digest cannot be reversed by hashing every IPv4 address.

`/privacy` is the privacy notice (`components/sections/privacy-notice.tsx`),
linked from the footer and from the enquiry form. Like the cookie policy it is
written in code because it describes what the code does with an enquiry; its
opening is editable under Website Content. It names no ICO registration,
address or retention period, because none has been supplied.

## Deploys and stale tabs

A tab left open across a deploy keeps running the previous build. Its chunks may
no longer be served, its prefetched routes no longer match, and the enquiry
form's server action carries an id the new server does not recognise — failures
that are silent and baffling from the visitor's side.

Two things address it. `deploymentId` in `next.config.ts` turns on Next's own
skew protection, so assets are deployment-keyed and a mismatched navigation
becomes a full page load rather than a broken one. `VersionGuard`, mounted in
the root layout, polls `/api/version` while the tab is in the foreground and,
when the server reports a different build, shows a branded notice asking for a
refresh. `app/error.tsx` and `app/global-error.tsx` make the same request when a
stale chunk fails outright.

The notice can be dismissed, and nothing reloads on its own: someone part-way
through the enquiry form should not lose what they have written. The build
identifier is resolved once, at build time, from `NEXT_PUBLIC_APP_VERSION`, then
Vercel's `VERCEL_DEPLOYMENT_ID` or `VERCEL_GIT_COMMIT_SHA`, then `GIT_SHA`, then
the commit SHA of the checkout. If none resolve, the value is `dev` and the
check is switched off rather than guessing at an identifier that could differ
between the build and the running server.

Rebuilding from a dirty tree produces the same commit SHA as the previous build,
so set `NEXT_PUBLIC_APP_VERSION` explicitly if you deploy uncommitted work.

## Analytics and consent

GA4, behind a cookie banner (SEO requirements REQ-053 to REQ-055). It is **off
until `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set**: with no ID there is no banner,
no script and no event, and the cookie policy says the site sets no cookies.
Set the ID in Vercel's Production environment only, so previews never report.
Keep GA4's enhanced measurement on, including "page changes based on browser
history events". That is what counts page views after client-side navigation.

- **Nothing before consent.** Google's script is not requested until the
  visitor presses Accept. Consent Mode v2 is still declared (every type
  `denied` by default, then `analytics_storage` granted); advertising storage
  is never granted. The choice is kept in local storage
  (`jv-analytics-consent`), not a cookie. First-touch campaign/referrer data is
  likewise withheld from session storage until acceptance and cleared after
  rejection or withdrawal.
- **Reject is as easy as accept.** Two identical buttons. The banner floats
  (no layout shift), keeps clear of the ReviewSolicitors tab, and sits above
  the docked mobile contact bar while that is showing.
- **Revocable.** "Cookie settings" in the footer and on `/cookies` reopens the
  banner. Rejecting after accepting deletes the `_ga` cookies and reloads the
  page without Google's script.
- **Events** (`lib/analytics.ts`): `phone_click`, `whatsapp_click`,
  `email_click` and `booking_click` (the consultation CTA leading to contact,
  not a calendar booking), each with `location`, the nearest
  `data-track` attribute (`header`, `mobile_menu`, `hero`, `mobile_bar`,
  `footer`, `cta_banner`, `contact_card`, `contact_page`, `enquiry_form`,
  `police_station`, `utility_bar`); plus `form_submit` and `form_error`
  (`error_type`). One capture-phase listener classifies links by where they
  go, so a contact link added later is counted without being instrumented.
  A read-only GA4 dashboard check on 2026-10-05 confirmed the John Violaris
  stream is receiving traffic and `phone_click`, `email_click` and
  `whatsapp_click` are already key events. `booking_click` has arrived but is
  not marked as a key event. Successful `form_submit` acceptance and DebugView
  verification remain outstanding. No analytics setting was changed in this check.
- **No personal data or case details.** `matter_type` is deliberately absent
  from `form_submit`: which offence someone is accused of is criminal-offence
  data, and it has no business reaching Google.
- **Field performance measurements.** After consent, the existing GA4 property
  can receive `LCP`, `INP` and `CLS` events. The standard `web-vitals@6.2.3`
  library loads on demand and observers register once per document. Each
  callback rechecks consent, the CMS integration switch and the tag-disable
  flag; denied callbacks are discarded. Added parameters contain only numeric
  `metric_value`, `metric_delta` and an ephemeral `metric_id`; LCP/INP use
  milliseconds and CLS is unitless. No entries, selectors, URLs or enquiry
  fields are copied into this payload. GA4 still attaches its existing
  consented page context. There is no new recipient, persistent identifier,
  key-event registration or monetary value. The cookie policy follows both
  configuration and the integration switch. Field reporting is local/unreleased;
  it does not establish a Core Web Vitals pass or populate Vercel Speed Insights.
  See the [official measurement library](https://github.com/GoogleChrome/web-vitals).
- **Local testing.** Put the ID in `.env.development.local`. On `localhost`
  everything runs except the request to Google, so the banner, the consent
  calls and the events can be checked in `window.dataLayer` without reporting
  anything.
- **Beside the ReviewSolicitors widget.** The banner lives inside a permanent
  `.consent-slot` wrapper. The widget's script rewrites and moves its own
  element, the banner's next sibling in the layout; inserting the banner
  directly beside it crashed React.

`/cookies` is the policy (`components/sections/cookie-policy.tsx`). Its opening
is editable under Website Content. The list itself is written in code because
it describes what the code stores, and it follows the analytics switch by
itself.

## Scope still outstanding

The three delivery phases are built and live. What remains is configuration
outside this repository, content only John can supply, and the optional SEO
items at the end of this section.

Use [`docs/production-launch-checklist.md`](docs/production-launch-checklist.md)
for the database backup/migration gate, preview checks, production smoke tests
and rollback sequence on later releases.
[`docs/cms-guide.md`](docs/cms-guide.md) is the plain-English guide to the
admin for John.

Outside the repository (launch record from 2026-10-03, checked where possible
on 2026-10-05):

- **Vercel (`john-violaris` team).** The project was recreated when it moved
  teams. A read-only Chrome dashboard check on 2026-10-05 confirmed the correct
  project is accessible and its existing production deployment is Ready. The
  Supabase, Resend, enquiry sender/recipient, contact and IP-salt variable names
  are present; values stayed masked and were not independently validated.
  `NEXT_PUBLIC_GA_MEASUREMENT_ID` and `ENQUIRY_IP_SALT` are Production only.
  Preview shares the Production Supabase/Resend variable rows and lacks its own
  IP salt, so it is not an isolated backend for CMS or enquiry write tests.
  Set up a separate test backend and recipient before those checks. The
  dashboard flags the privileged Supabase and Resend keys as Configuration
  rather than Secret; review their storage/rotation with the release owner.
  No environment, deployment or credential setting was changed. Speed Insights
  shows its setup screen and no collected field performance data.
- **Resend.** Send from John's domain rather than the developer's.
  The historical launch record places `alert.johnviolaris.com` in a different
  account from the development key. A read-only sign-in check on 2026-10-05
  showed only a developer domain, `codsmith.com`, in the available account.
  A separate read-only API check of the local key listed `mail.codsmith.online`
  as its verified domain. That key may differ from production. Production enquiry
  aggregates show two saved enquiries, both notification and confirmation API
  acceptance flags set, and zero recorded email errors; inbox receipt is still
  unverified. The production key/account was not independently matched. The From address
  must belong to the same Resend account as `RESEND_API_KEY`; verify the intended
  John-owned domain/account and complete one approved enquiry-delivery test.
- **Supabase.** Public sign-ups are verified disabled: the correct project's
  Auth settings API returned `disable_signup: true` on 2026-10-05. No hosted
  settings were changed. The application also has no public sign-up flow.
  Leaked-password protection is unavailable on the current Free plan without
  upgrading. The Emails dashboard confirmed custom SMTP is still required.
  Password reset needs the URL
  configuration, email template and custom SMTP set out under
  [Admin accounts and passwords](#admin-accounts-and-passwords).
- **Google Search Console.** Recorded as not set up. The 2026-10-05 browser check
  reached the welcome screen in the signed-in personal account, and no John or
  business Google account was available. Add/verify a Domain property for
  `johnviolaris.com` while signed in to John's (or a business) Google account,
  never a personal one: verify with the TXT record it gives you at GoDaddy, then
  submit `https://johnviolaris.com/sitemap.xml`. Optional: a property for
  `drivingjustice.co.uk`, and Bing Webmaster Tools (it can import the Search
  Console property).
- **From John.** The SRA number and regulatory status, the complaints and Legal
  Ombudsman wording, and what the privacy notice should add: an ICO number, a
  retention period, or the firm's name if the firm is the data controller.
  Service-page body copy, headings and search wording remain frozen pending John's
  review. Other project work is now authorised. The user authorised restoration of the six earlier
  shortened article SEO titles. Those titles are restored; article bodies and
  visible headlines are unchanged. Proposed Special Reasons corrections and
  the added drink-driving service synonym paragraph remain withdrawn.
  The existing Special Reasons outcome wording still needs John's approval
  and any approved correction; REQ-064 is not met. The image migration changes
  the portrait asset only and does not rewrite legal text.

Local changes on 2026-10-05 add redirect management at `/admin/redirects`,
safe same-site targets and a cached missing-route resolver. It handles former
URLs without a database lookup on every working page; it deliberately cannot
override a still-published route. The resolver uses ISR and admin saves clear
the affected source path. Existing transactional slug history remains in use.
Published article and ordinary service URL changes require confirmation naming
the old and new addresses, checked again by the server. The pending scheduling
migration prevents future or expired article renames from exposing private slugs
through automatic redirects.

SEO Metadata now supports Open Graph type, independent X/Twitter overrides, validated additive
custom JSON-LD and an SEO health report. The report checks effective titles and
descriptions, duplicate metadata, content links, image descriptions and outcome
wording. JSON-LD structural validation does not certify legal accuracy or rich
result eligibility. Saved indexable content editors have collapsed SEO panels,
with separate metadata saves and the same path-keyed source. Publishing controls
show advisory warnings and report rejected saves. `/admin/seo-metadata/robots`
edits crawl rules with private-path guards, noindex conflict checks and explicit
public-block acknowledgment. `/admin/rebuild` refreshes one registered public page or the
whole public website and sitemap.

Article and service editors have authenticated previews of saved drafts using
the public rendering components. Previews are private, uncacheable and excluded
from indexing. Articles can have UK-time publication and expiry dates. Scheduled
visibility is enforced in the database and lists/articles/sitemap use 60-second
ISR; expired URLs return 404. Saved article/service-page versions can be restored
as drafts. Restoring an article or service page takes its current long-form
content out of publication until reviewed and republished.

The seven new publishing/history, portrait-only, location, SEO-role, media/history,
rich-caption and private-redirect-note SQL files are **local pending
migrations**, not production changes. Apply reviewed migrations before deploying
the corresponding application version. The `seo_editor` role edits metadata and
crawl rules without access to enquiries, draft bodies or general content editing.
No existing user has been promoted. General content-editor delegation, optional per-page share cards, external social-preview
acceptance and measured field Core Web Vitals remain separate work.
The portrait-only file is
`supabase/migrations/20261005131025_optimize_portrait.sql`; it changes the exact
legacy portrait URL and leaves all existing legal wording unchanged.

The media library at `/admin/media` supports descriptive upload filenames,
decoded image/dimension checks, editable alt/decorative descriptions and optional
titles/captions. Captions default to plain text; an explicit formatted mode
supports bold, italic and safe links without raw HTML. Existing captions remain
plain. Existing URLs are immutable. Public image descriptions apply to
hero/article renders. RLS hides metadata for images used only in drafts or
scheduled/expired articles; descriptions reused by live content are public.
Image bytes in the public Storage bucket remain readable by URL, so uploads are
for public website imagery. The file limit is 4 MiB to fit Vercel's 4.5 MB request
ceiling with form overhead; a larger Next action limit does not override that
hosting limit.

Append-only history now captures eleven content/configuration sources, including
SEO, page sections, media, catalogue and location changes. Field comparisons and
confirmed restores are available. Draft-capable entities restore as drafts;
settings/static sections/categories/groups restore live. Review history is
read-only. Restores apply current validation and crawl-block/practice-fact
confirmation rather than bypassing the editors' guards. Authenticated acceptance
against the migrated Supabase stack is still a release check.

The administrator-only Integrations editor at `/admin/seo-metadata/integrations`
stores an allowlisted registry for existing GA4 and ReviewSolicitors enabled
flags. Providers, URLs and loading strategies are fixed; unknown/malformed
configuration fails closed. Analytics remains consent-gated and disabling it
blocks events from an already-loaded tag. The anonymous public configuration
contains no credentials. History restores use the same validation.

Optional practice identity, address, geo and hours fields default empty and
require recorded confirmation. Their Contact rendering and LegalService graph
share one validation helper; an individual solicitor SRA number is separate from
the practice identifier. No business facts were populated by this work.

Analytics now rechecks consent on every event and disables a loaded tag when
consent is withdrawn, including from another tab. Google signals and advertising
personalization are explicitly disabled. A separate `generate_lead` event follows
an accepted enquiry response, avoiding automatic form-interaction counts. On
2026-10-05 it was registered as a GA4 key event with no monetary value; no enquiry
was sent. That is the only external configuration change in this completion pass.
Its code is local and needs release before production can send the event. DebugView
acceptance remains outstanding. `form_submit` remains for historical compatibility.

Future location content uses `/locations/[slug]`, managed under **Location
Pages**. The new table starts empty. Drafts have no public URL or sitemap entry;
publishing requires substantial body copy, bespoke local context, links to live
services and a recorded legal/factual review. The CMS cannot establish that
local facts are true or detect every template substitution, so editorial review
remains required. Pages make no invented office/address claim. Location renames
use the same transactional redirect history. Its architecture migration is also
local and pending; no city page has been published.

`npm run pages:verify -- <production-server-url>` checks every sitemap page's
rendered headings, metadata, IDs, image descriptions and internal resources.
`npm run assets:verify -- <production-server-url>` measures initial first-party
JavaScript/CSS from actual build files and checks `performance-budgets.json`.
The baseline and 20% bundle / 10% portrait headroom require deliberate review
when changed. CI runs both after its production build. These are regression
checks; lazy chunks, external widgets and field LCP/INP still need measurement.

`npm run lighthouse:ci` audits home, a service page and an article twice against
the running production server (default port 3000; set `LHCI_BASE_URL` for another
local port). CI runs this on pull requests and retains report artifacts for 14
days. Performance below 90, LCP above 2.5 seconds, CLS above 0.1 and lab TBT above
200 ms produce warnings; the separate asset budget gate fails on size regressions.
TBT is a lab responsiveness proxy and does not establish field INP. Reports are
written to `.lighthouseci/` without contacting an external LHCI storage service.
CI uses Node 24, which also supports the pinned Lighthouse dependency.

The 2026-10-05 dependency review patched Next.js and `eslint-config-next` to
16.3.8 for the [published next/og advisory](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j).
LHCI 0.15.1 uses tested pins for Lighthouse 13.5.0, tmp 0.2.7, uuid 11.1.1 and
get-uri's basic-ftp 6.2.2, avoiding vulnerable older transitive versions.
`shadcn` remains at 4.21.0 but is correctly classified as build/component tooling;
install development dependencies before building its CSS import. The production
dependency audit (`npm audit --omit=dev`) reports zero vulnerabilities. The full
audit still reports eight high-severity entries in the braces/fast-glob/ESLint/
shadcn/ts-morph tooling chains; this task does not claim an entirely clean audit.

TidyCal and public fee figures are not outstanding work: both were
intentionally removed from scope, and the Fees page intentionally has no
fee-schedule admin.

## Design and accessibility

Shared styling lives in `app/globals.css`; reusable editorial page intros live in
`components/pages/page-intro.tsx`. Components default to server rendering except
navigation and the interactive service explorer. The explorer uses accessible
tabs with arrow, Home and End keys. The FAQ opens one answer at a time.
The layout includes visible focus states and reduced-motion support.

Responsive checks cover 375px, 768px, 1024px and 1440px. The mobile hero reflows the
monogram card into a compact layout; service cards become a single column and
sticky service contact panels return to normal flow.

### Performance

The latest local FAQ/redirect-note/CSS/field-collector source is
`5e7cdd3bf980bd55f339e8a375cb69162da14eb9921a7b3492c07ed6e0981383`.
Its 74-route build, lint, TypeScript, 113 tests, CMS seed parity, 30 SEO cases,
runtime and all 33 public page/schema/asset checks pass. All 145 isolated SQL
checks pass: 89 workflow, 20 SEO-role and 36 private-redirect-note checks.
No hosted migration or application release has been performed.

Public CSS falls from 25,061 to 19,431 gzip bytes, a 22.5% reduction. The admin
layout loads a 13,039-byte supplemental stylesheet to preserve the original
utility cascade, including after client navigation. Existing design rules,
fonts, 89 keyframe/property definitions and 115 theme variables are preserved.
Twelve compared views are pixel-identical with only external review-widget
pixels masked; first-party geometry/styles, portal fixtures and navigation
also match. All 33 main-text hashes remain unchanged. Final mobile/desktop home
checks preserve the selected view, with no page errors.

The consent-gated collector adds 887 initial gzip JavaScript bytes over the CSS
stage. Current maximum initial JavaScript is 174,608 bytes, about 15.1% below
the original 205,581-byte baseline; the CSS saving remains 5,630 bytes. Seven
real-browser module fixture cases cover consent, revocation, disabled integration
and numeric-only parameters. They made no Google request and do not establish
production receipt or a field Core Web Vitals pass. Budgets remain unchanged.

Seven Lighthouse 13.5.0 reports measure that final source: two mobile runs per
page and one desktop-home run, without warnings or runtime errors.

| Page/device | Runs | Performance | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- |
| Home/mobile | 2 | 90 | 3.587 s | 33.75 ms | 0 |
| Drink-driving/mobile | 2 | 92 | 3.304 s | 39.25 ms | 0 |
| Article/mobile | 2 | 96.5 | 2.652 s | 33.5 ms | 0 |
| Home/desktop | 1 | 100 | 0.738 s | 0 ms | 0 |

All seven automated Accessibility/Best Practices scores are 100. Article
performance meets 95 in this sample; Home/Service do not, and all three mobile
LCP medians remain over 2.5 seconds. Two-run variation and the single desktop
sample limit these results. TBT is not field INP and automated checks do not
establish full WCAG acceptance. Earlier benchmarks below retain their own source.

The earlier caption/integration and sitemap verification stage generated 74 application routes. All 33 public
pages pass rendered-page, structured-data and asset gates; runtime, lint,
TypeScript, 95 unit tests, CMS seed checks, 30 SEO cases, 89 workflow SQL checks
and 20 SEO-role SQL checks pass. The SQL checks use isolated PostgreSQL with
minimal Auth fixtures; full Supabase/pgTAP and authenticated migrated acceptance
still need a suitable environment.

The hero and reviews now use native browser animations with the original
transforms/timings. Reviews start animation work near the viewport and pause
offscreen, on hover/focus and for reduced motion. Link prefetch is triggered by
intent. That stage's asset maxima were 173,728 bytes initial JavaScript, 39,520 bytes
legacy JavaScript and 25,061 bytes CSS (gzip); the portrait is 137,298 bytes.
Initial JavaScript is about 15.5% smaller than the preceding 205,581-byte maximum.
Budgets are unchanged. Chrome checked eight representative views, preserved
page text, all sixteen hero transforms, review controls/accessibility-tree text
and prefetch behavior without page errors or overflow.

Neither inline CSS nor CSS content-visibility is retained: the former worsened
lab results and the latter hid offscreen review names from the tested Chrome
accessibility tree. Lighthouse trials are retained as measurements of their
specific earlier candidates.

Nine later Lighthouse 13.5.0 checks measured the preserved-copy caption/integration
snapshot (source `6e77e0b12f21b3b4d9b96059901f51790be4c52605628b1bbe3992cb5031cbd7`),
before the subsequent server-only sitemap date change:

| Page/device | Runs | Median performance | Median LCP | Median TBT | CLS |
| --- | --- | --- | --- | --- | --- |
| Home/mobile | 2 | 89 | 3.611 s | 129.5 ms | 0 |
| Drink-driving/mobile | 2 | 91 | 3.460 s | 29.5 ms | 0 |
| Article/mobile | 2 | 93.5 | 3.096 s | 37 ms | 0 |
| Home/desktop | 3 | 100 | 0.768 s | 0 ms | 0 |

All nine scored Accessibility and Best Practices 100, with no run errors.
Mobile LCP and the plan's performance-95 target remain unmet; field INP is
unmeasured. Home also misses the unchanged performance-90 CI advisory. Common
CSS/font payload and style/layout work remain investigation areas. Automated
accessibility scores do not establish complete WCAG acceptance.

The sitemap follow-up dates fixed pages from their actual public CMS section,
metadata, shared-setting and image-description timestamps, and dates collection
indexes from published children. Saves/restores refresh the sitemap. No page
wording or printed article date changes. Sources without recorded dates, failed
reads, reset/deleted rows and source-controlled edits cannot fabricate a date;
the literal every-entry lastmod requirement remains partial.

The follow-up build passes all 95 tests and production/runtime/public-page gates.
All 33 public text/style hashes and all 18 referenced JavaScript/CSS files are
identical to the measured snapshot. The sitemap retains 33 URLs; dated entries
increase from 23 to 33, all matched to recorded CMS-source timestamps. The pending
media migration still prevents media-only timestamps from contributing.

The following paragraphs are historical measurements and checks.

Pre-copy-revert 2026-10-05 Lighthouse CI measurements against the Next.js 16.3.8 production
build on port 3002, using Lighthouse 13.5.0 (two mobile runs per page):

| Page | Median performance | Median LCP | Median TBT | CLS |
| --- | --- | --- | --- | --- |
| Home | 89 | 3.742 s | 58.75 ms | 0 |
| Drink-driving service | 92 | 3.295 s | 39 ms | 0 |
| Article | 93.5 | 3.077 s | 37.75 ms | 0 |

These runs predate the withdrawal of the proposed public wording changes and
must not be presented as fresh validation of the copy-preserving final tree.
The production build, runtime, rendered-page, schema and asset checks after the
copy revert passed: 71 application routes, 33 public pages and 33
schema graphs. The 51 tests, lint, TypeScript, CMS verification, 30-case SEO
verification and 46 isolated PostgreSQL checks passed. That verification preceded
the user-approved restoration of the six concise article SEO titles. A subsequent
production build again generated 71 application routes; all 33 rendered public
pages pass with zero failures and zero editorial advisories. The six restored
titles are 51–59 characters including the site suffix. Targeted lint, the 30-case
SEO verifier and final TypeScript checks also pass after the title restoration.

All six recorded runs scored Accessibility **100** and Best Practices **100**. The CI job
passes with warnings about unresolved targets; the 95 performance and 2.5-second
LCP targets are not met, and these runs do not measure field INP. The portrait
source is now 137,298 bytes of WebP instead of 2,013,504 bytes of PNG (93.2% smaller).
The remaining measured bottleneck is initial framework/main-thread work, with
additional third-party widget caching/image advisories. Differences in machine
load and measurement conditions prevent a reliable comparison with older runs.

Focused Chrome checks after restoring the original copy passed table-of-contents
navigation, keyboard table access and a mobile view without overflow or page
errors. Fresh checks following the approved title restoration confirm all six
exact shorter search titles, unchanged original article headlines and Special
Reasons labels/notes, no invented captions and no browser page errors.

Before the copy revert, Chrome checked every public
page at 375px and 1440px without overflow or JavaScript errors, plus representative
768px and 1024px views. Keyboard checks cover navigation, service tabs, FAQ, table
of contents and invalid enquiry validation without sending an enquiry. The
reviews widget's landmark and heading issues have been corrected; 66 axe scans
reported zero violations, with contrast/cross-origin frame checks incomplete.
Firefox could
not launch because its diagnostic command was blocked by execution policy; its
pass and manual screen-reader acceptance remain unverified.

Earlier Lighthouse measurements, mobile, against a production build (`next build`, then the
`site-prod` launch configuration on port 3001), 2026-10-03:

| Page            | Performance | Accessibility | Best practices | LCP       |
| --------------- | ----------- | ------------- | -------------- | --------- |
| Home            | 85–88       | 99            | 96             | 3.8 s     |
| Offence page    | 90–91       | 98            | 100            | 3.4–3.5 s |
| Article         | 96          | 98            | 100            | 2.7 s     |
| Contact         | 95          | 99            | 100            | 2.7 s     |
| About, Privacy  | 94–95       | 98            | 100            | 2.7–2.8 s |

Scores move by several points between runs on the same machine (one contact
run scored 77 while the machine was busy), so run a page more than once before
reading anything into a change. The live home page, measured minutes apart on
the same machine, scored lower than the build above. SEO scores 69 locally only
because localhost is deliberately `noindex`. Home's missing best-practices
points were the ReviewSolicitors panel's avatar service (`ui-avatars.com`)
failing to answer; its heading failure has since been corrected in the host integration.

The LCP figures are Lighthouse's simulation of a slow phone. In the trace the
home portrait paints with the first content, but the simulation charges it for
the scripts loaded before it. The earlier hero loaded Motion lazily (`LazyMotion` with
`motion/react-m`). The earlier reviews marquee kept the full `motion/react` build: the
mini build animates through the Web Animations API, which has no `y`, and the
columns stood still.

Tried and dropped: `experimental.inlineCss`. It inlines the stylesheet twice,
once as `<style>` and again in the React payload, which took the home page to
100 KB compressed and lowered every score.

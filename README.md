# John Violaris — Criminal Defence Solicitor

Next.js 16 App Router, React 19, TypeScript and Tailwind CSS v4.

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

A read falls back to the static seed when Supabase **errors**, and never when it
simply returns no rows. An empty answer is the truthful one — nothing is
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

Drafts are invisible to visitors: the `blog_posts` read policy is
`using (published)`, so an unpublished article is not merely hidden by the UI —
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
`portraitAlt` beside it; the default is still `/Profile 7.png`, so a section
nobody has touched renders exactly as before. The default share card
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
  Mark these events as key events in GA4.
- **No personal data or case details.** `matter_type` is deliberately absent
  from `form_submit`: which offence someone is accused of is criminal-offence
  data, and it has no business reaching Google.
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

Outside the repository, as of 2026-10-03:

- **Vercel (`john-violaris` team).** The project was recreated when it moved
  teams. `NEXT_PUBLIC_GA_MEASUREMENT_ID` was re-added on 2026-10-04 and
  analytics is live; check that `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`,
  `ENQUIRY_FROM_EMAIL`, `ENQUIRY_NOTIFICATION_EMAIL` and `ENQUIRY_IP_SALT` came
  across too, then send one test enquiry.
- **Resend.** Send from John's domain rather than the developer's.
  `alert.johnviolaris.com` has Resend's DNS records, but in a different Resend
  account from the development key, whose only domain is `mail.codsmith.online`;
  the From address must belong to the same account as `RESEND_API_KEY`.
- **Supabase.** Turn off public sign-ups and turn on leaked-password protection
  under Authentication. The sign-up form is gone, but the Auth API still
  accepts a sign-up made with the public key. Password reset needs the URL
  configuration, email template and custom SMTP set out under
  [Admin accounts and passwords](#admin-accounts-and-passwords).
- **Google Search Console.** Done 2026-10-04: a Domain property for
  `johnviolaris.com`, verified by a `google-site-verification` TXT record at
  GoDaddy (keep it, or verification lapses), with the sitemap submitted.
  Optional: a property for `drivingjustice.co.uk`, and Bing Webmaster Tools
  (it can import the Search Console property).
- **From John.** The SRA number and regulatory status, the complaints and Legal
  Ombudsman wording, and what the privacy notice should add: an ICO number, a
  retention period, or the firm's name if the firm is the data controller. The
  Special Reasons page (Service Pages in the CMS) says "No ban if accepted" and
  "Disqualification avoided entirely", but the court keeps a discretion even
  when special reasons are found; that wording is his to correct.

In the code, redirect management is partial (REQ-029): the table and automatic
slug history exist, but there is no redirect admin UI or lookup for arbitrary
paths. Also open are the custom JSON-LD field and publication warnings (REQ-018
and the CMS half of REQ-019), the optional per-page generated share cards
(REQ-024), and the SEO health checks and draft preview (REQ-048, REQ-052).

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

Lighthouse, mobile, against a production build (`next build`, then the
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
points are the ReviewSolicitors panel's avatar service (`ui-avatars.com`)
failing to answer; the remaining accessibility failure is a heading inside that
panel.

The LCP figures are Lighthouse's simulation of a slow phone. In the trace the
home portrait paints with the first content, but the simulation charges it for
the scripts loaded before it. The hero loads Motion lazily (`LazyMotion` with
`motion/react-m`). The reviews marquee keeps the full `motion/react` build: the
mini build animates through the Web Animations API, which has no `y`, and the
columns stood still.

Tried and dropped: `experimental.inlineCss`. It inlines the stylesheet twice,
once as `<style>` and again in the React payload, which took the home page to
100 KB compressed and lowered every score.

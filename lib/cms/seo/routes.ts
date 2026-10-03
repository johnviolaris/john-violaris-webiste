import "server-only";

import { cache } from "react";

import { getRouteIndex } from "@/lib/cms/queries";
import type { RouteDefaults } from "@/lib/cms/seo/resolve";

/**
 * Every public route that belongs in search, and what each says by default.
 *
 * One list with three readers, and that is the point of it:
 *
 *  - Each route's `generateMetadata`, through `seoMetadataFor`, takes its
 *    defaults from here rather than writing them out itself.
 *  - The SEO Metadata admin lists these routes and shows John what a page says
 *    until he overrides it — the same text a visitor's browser gets.
 *  - `app/sitemap.ts` is built from it.
 *
 * So a route added here is titled, editable and in the sitemap at once, and a
 * route cannot be in the sitemap without being editable or the other way
 * round. The save action also refuses any path not on this list, which is
 * what stops a hand-made request from writing overrides for addresses that do
 * not exist.
 *
 * Unpublished services and articles are absent, because their URLs are not
 * public. Admin, auth and API routes are never here.
 */

export type SeoRouteGroup = "Pages" | "Services" | "Articles";

export type SeoRoute = {
  path: string;
  /** What the admin calls it. */
  label: string;
  group: SeoRouteGroup;
  defaults: RouteDefaults;
  /**
   * When the content behind it last changed. Only routes backed by a row have
   * one; the fixed pages leave it out rather than claim the build time.
   */
  lastModified?: string;
};

/*
 * What the pages say in search results.
 *
 * Written for the results page rather than borrowed from each page's heading.
 * A heading speaks to someone already reading ("Your situation. A considered
 * response."); a title speaks to someone choosing which result to open, so it
 * leads with the words they typed: solicitor, lawyer, the offence. Each fits
 * where the SEO editor starts warning — 60 characters with " | John
 * Violaris" added, 155 for the description — and says nothing the page itself
 * does not.
 */

/** The home page's own words, which no other module holds. */
const homeDefaults: RouteDefaults = {
  title: "Motoring Solicitor & Criminal Defence Lawyer",
  description:
    "Driving offence and criminal defence solicitor with 20+ years’ experience, representing clients across England & Wales. Free initial consultation.",
};

/** The fixed pages, in the order the main navigation lists them. */
const fixedPages: { path: string; label: string; defaults: RouteDefaults }[] = [
  {
    path: "/about",
    label: "About",
    defaults: {
      title: "About John — Defence Solicitor Since 2005",
      description:
        "John Violaris qualified in 2005 and has 20+ years in criminal defence, now focused on motoring offences. Meet the solicitor who handles your case.",
    },
  },
  {
    path: "/services",
    label: "Services",
    defaults: {
      title: "Driving Offence & Criminal Defence Services",
      description:
        "Drink driving, speeding, totting up, mobile phone and other driving offences, plus police interviews and criminal defence across England & Wales.",
    },
  },
  {
    path: "/police-station",
    label: "Police Station",
    defaults: {
      title: "Police Station & Police Interview Solicitor",
      description:
        "Arrested or invited to a voluntary police interview? Get advice from a defence solicitor before you answer questions. Usually free under legal aid.",
    },
  },
  {
    path: "/fees",
    label: "Fees",
    defaults: {
      title: "Solicitor Fees & Free Initial Consultation",
      description:
        "How John’s fees work: a free initial consultation, a clear scope of work, and fixed costs agreed with you before you instruct him.",
    },
  },
  {
    path: "/reviews",
    label: "Reviews",
    defaults: {
      title: "Verified Client Reviews",
      description:
        "Verified reviews from clients John Violaris has represented, independently collected by ReviewSolicitors.",
    },
  },
  {
    path: "/contact",
    label: "Contact",
    defaults: {
      title: "Contact John — Free Initial Consultation",
      description:
        "Call, WhatsApp, email or send the form to speak directly to John Violaris, motoring and criminal defence solicitor. Free initial consultation.",
    },
  },
  {
    path: "/cookies",
    label: "Cookie policy",
    defaults: {
      title: "Cookie Policy",
      description:
        "Everything this site keeps in your browser, what it is for and how long it stays.",
    },
  },
];

/**
 * Each offence page's title and description, by path.
 *
 * A default like every other here: the SEO Metadata editor shows it until John
 * writes his own. A service with no entry — one added later, or one whose slug
 * changes — falls back to "<name> Solicitor" and its standfirst. That fallback
 * is why the awkward names are listed at all: a menu label like "Totting Up ·
 * 12 Points" or "All Crime" makes a poor search title, and a standfirst runs
 * past what Google shows.
 */
const offenceDefaults: Record<string, RouteDefaults> = {
  "/services/drink-driving": {
    title: "Drink Driving Solicitor",
    description:
      "Charged with drink driving? It carries a minimum 12-month ban. Speak to John, a drink driving solicitor, before you plead. Free initial consultation.",
  },
  "/services/drug-driving": {
    title: "Drug Driving Solicitor",
    description:
      "Drug driving cases turn on the reading, the drug and the police procedure. Speak directly to John, a drug driving solicitor. Free initial consultation.",
  },
  "/services/failing-to-provide": {
    title: "Failing to Provide a Specimen Solicitor",
    description:
      "Failing to provide a specimen usually means a 12-month ban, and the technical issues are often missed. Speak to John before you plead. Free consultation.",
  },
  "/services/drunk-in-charge": {
    title: "Drunk in Charge Solicitor",
    description:
      "Drunk in charge is a different offence from drink driving, with no mandatory ban and a statutory defence. Speak directly to John. Free consultation.",
  },
  "/services/totting-up": {
    title: "Totting Up Solicitor — 12 Points",
    description:
      "12 points in three years? A six-month ban follows unless exceptional hardship is proved with evidence. Speak to John first. Free initial consultation.",
  },
  "/services/exceptional-hardship": {
    title: "Exceptional Hardship Solicitor",
    description:
      "Most exceptional hardship arguments fail for lack of evidence. John prepares the argument and the evidence properly. Free initial consultation.",
  },
  "/services/special-reasons": {
    title: "Special Reasons Solicitor",
    description:
      "A special reasons argument lets the court step back from a mandatory ban even where guilt is not in dispute. Speak directly to John. Free consultation.",
  },
  "/services/speeding": {
    title: "Speeding Solicitor",
    description:
      "Speeding with points already on your licence can trigger a totting up ban. Know your options before accepting anything. Free consultation with John.",
  },
  "/services/careless-driving": {
    title: "Careless Driving Solicitor",
    description:
      "Revised sentencing guidelines make bans for careless driving more common, even for first offences. Speak directly to John. Free initial consultation.",
  },
  "/services/dangerous-driving": {
    title: "Dangerous Driving Solicitor",
    description:
      "Dangerous driving carries a mandatory ban, an extended re-test and a real risk of custody. Specialist defence from John Violaris. Free consultation.",
  },
  "/services/mobile-phone": {
    title: "Mobile Phone Driving Offence Solicitor",
    description:
      "Using a phone while driving means six points, enough to end a new driver’s licence or trigger a totting up ban. Speak to John first. Free consultation.",
  },
  "/services/no-insurance": {
    title: "Driving Without Insurance Solicitor",
    description:
      "No insurance is strict liability, but special reasons, genuine belief and the employee exception can apply. Speak directly to John. Free consultation.",
  },
  "/services/failing-to-stop": {
    title: "Failing to Stop or Report Solicitor",
    description:
      "Section 170 creates two separate offences — failing to stop and failing to report — and each can be defended. Speak directly to John. Free consultation.",
  },
  "/services/driver-details": {
    title: "Failing to Provide Driver Details Solicitor",
    description:
      "Section 172 means six points for not naming the driver. Reasonable diligence is a real defence, but it needs evidence. Free initial consultation with John.",
  },
  "/services/magistrates-court": {
    title: "Magistrates’ Court Solicitor",
    description:
      "Due in the magistrates’ court? John knows how the court works and will represent you in person, from first hearing to trial. Free initial consultation.",
  },
  "/services/criminal-defence": {
    title: "Criminal Defence Solicitor",
    description:
      "Criminal defence for allegations of every kind, from first arrest to trial, from a solicitor with 20+ years in criminal courts. Free initial consultation.",
  },
  "/services/all-crime": {
    title: "Criminal Solicitor for Non-Motoring Offences",
    description:
      "Assault, dishonesty, drugs or public order, in the magistrates’ or Crown Court. John will also tell you whether legal aid should pay. Free consultation.",
  },
};

/** Newest of two optional timestamps. */
function latest(...values: (string | null | undefined)[]): string | undefined {
  const dates = values.filter((value): value is string => Boolean(value));

  return dates.length > 0 ? dates.sort().at(-1) : undefined;
}

export const listSeoRoutes = cache(async function listSeoRoutes(): Promise<
  SeoRoute[]
> {
  const { services, articles } = await getRouteIndex();

  const pages: SeoRoute[] = [
    { path: "/", label: "Home", group: "Pages", defaults: homeDefaults },
    ...fixedPages.map((page): SeoRoute => ({ ...page, group: "Pages" })),
    {
      path: "/blog",
      label: "Resources",
      group: "Pages",
      defaults: {
        title: "Motoring Law & Driving Offence Guides",
        description:
          "Plain-English guides to drink driving, penalty points, police interviews and more, from a solicitor with 20+ years of criminal defence experience.",
      },
    },
  ];

  // Police station representation links to its own page, which is already
  // listed above; only services with an offence page of their own belong here.
  const offencePages = services
    .filter((service) => !service.content.href)
    .map((service): SeoRoute => {
      const path = `/services/${service.slug}`;

      return {
        path,
        label: service.name,
        group: "Services",
        defaults: offenceDefaults[path] ?? {
          // The offence leads, because the offence is what was searched for.
          title: `${service.name} Solicitor`,
          description:
            service.page?.intro ?? service.content.intro ?? undefined,
        },
        lastModified: latest(service.updated_at, service.page?.updated_at),
      };
    });

  const articlePages = articles.map(
    (article): SeoRoute => ({
      path: `/blog/${article.slug}`,
      label: article.title,
      group: "Articles",
      defaults: {
        title: article.title,
        description: article.excerpt ?? undefined,
        ogType: "article",
        ...(article.featuredImage
          ? {
              image: {
                url: article.featuredImage,
                alt: article.featuredImageAlt ?? undefined,
              },
            }
          : {}),
        ...(article.published_at ? { publishedTime: article.published_at } : {}),
      },
      lastModified: latest(article.updated_at),
    }),
  );

  return [...pages, ...offencePages, ...articlePages];
});

/** One route by path, or undefined when it is not a public route. */
export async function findSeoRoute(path: string): Promise<SeoRoute | undefined> {
  return (await listSeoRoutes()).find((route) => route.path === path);
}

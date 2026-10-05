import type { Question } from "@/lib/content/pages";
import { deployment, type SiteConfig } from "@/lib/site-config";
import { verifiedPracticeFacts } from "@/lib/cms/settings/practice-facts";
import { faqAnswerText, faqSectionId, resolveFaqItems } from "@/lib/cms/faq";

/**
 * Schema.org markup: what each page tells search engines, as one connected
 * graph (SEO requirements REQ-010 to REQ-017).
 *
 * Every public page publishes a single JSON-LD block. Part of it is the same
 * everywhere — the website, the practice and John — and the rest is the page:
 * what kind of page it is, its breadcrumb trail, and the service, article or
 * questions it is about. Nodes refer to each other by `@id` instead of
 * restating a name or a phone number, so there is one statement of each fact
 * and nothing to drift.
 *
 * Pure on purpose, like `resolve.ts`: every value arrives as an argument, so
 * the builders can be checked without a database. `structuredDataFor` in
 * `metadata.ts` is the server side that gathers the values.
 *
 * Two rules hold throughout, both from PRD §25 and REQ-010:
 *
 *  - A value that is not set is left out, never emitted as an empty string,
 *    a placeholder or `null`. No telephone until a number is confirmed; no SRA
 *    number until John supplies it.
 *  - Nothing is stated here that the site does not already say on the page.
 *    The telephone is the one the `tel:` links dial, the questions are the
 *    ones a visitor can open, the breadcrumb is the trail printed above the
 *    heading.
 */

type Node = Record<string, unknown>;

export type JsonLdGraph = {
  "@context": "https://schema.org";
  "@graph": Node[];
};

/** An absolute address on the canonical domain, for a path or a full URL. */
export function absoluteUrl(pathOrUrl: string): string {
  return new URL(pathOrUrl, deployment.url).href;
}

/**
 * The permanent identifiers of the three things every page is about.
 *
 * These must never change once the site is live (REQ-017): an `@id` is how a
 * search engine recognises that this page's practice is the one it read
 * yesterday. They are built from the canonical domain, not the address a page
 * happens to be served from, so staging publishes the same graph production
 * will.
 */
export const schemaIds = {
  website: `${deployment.url}/#website`,
  practice: `${deployment.url}/#practice`,
  john: `${deployment.url}/#john`,
} as const;

function ref(id: string) {
  return { "@id": id };
}

export function graph(nodes: Node[]): JsonLdGraph {
  return { "@context": "https://schema.org", "@graph": nodes };
}

/**
 * The block as it goes into the page.
 *
 * `<` is escaped so no string in the content — an article title, a question —
 * can close the script element early. That is the sanitising the Next.js
 * JSON-LD guide asks for.
 */
export function serializeJsonLd(value: JsonLdGraph): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

// ---------------------------------------------------------------------------
// On every page
// ---------------------------------------------------------------------------

/**
 * The website, the practice and John (REQ-010, REQ-011, REQ-017).
 *
 * All of it comes from Site Settings and the service catalogue, so an edit
 * there reaches every page's markup with no deploy, as it reaches the header
 * and footer. `knowsAbout` is the published catalogue for the same reason: a
 * service added or withdrawn changes what John is said to practise.
 *
 * The profiles in `sameAs` are split by whose they are: ReviewSolicitors lists
 * the practice, the Law Society and LinkedIn list John. Each is set in Site
 * Settings and left out while blank. Practice identity, postal address, geo
 * and hours appear only after review, validation and matching Contact-page
 * publication. There is no price range under the approved fees scope.
 */
export function siteNodes({
  config,
  practiceAreas,
  portrait,
}: {
  config: SiteConfig;
  practiceAreas: string[];
  /** The photograph in the home page hero, as a path or a full URL. */
  portrait: string;
}): Node[] {
  const home = absoluteUrl("/");
  const facts = verifiedPracticeFacts(config);
  const address = facts?.addressStreet ? {
    "@type": "PostalAddress",
    streetAddress: facts.addressStreet,
    addressLocality: facts.addressLocality,
    ...(facts.addressRegion ? { addressRegion: facts.addressRegion } : {}),
    postalCode: facts.addressPostalCode,
    addressCountry: facts.addressCountry,
  } : null;

  return [
    {
      "@type": "WebSite",
      "@id": schemaIds.website,
      url: home,
      name: config.name,
      inLanguage: "en-GB",
      publisher: ref(schemaIds.practice),
    },
    {
      "@type": "LegalService",
      "@id": schemaIds.practice,
      name: config.name,
      url: home,
      description: `Criminal defence solicitor specialising in motoring offences and police station representation across ${config.jurisdiction}.`,
      // The branded card, which carries the name and the role.
      image: absoluteUrl("/share-image"),
      email: config.email,
      // Exactly what the `tel:` links dial, and absent while they fall back
      // to the contact page.
      ...(config.phoneE164 ? { telephone: config.phoneE164 } : {}),
      areaServed: { "@type": "AdministrativeArea", name: config.jurisdiction },
      ...sameAs(config.reviewSolicitorsUrl),
      ...(facts?.practiceLegalName ? { legalName: facts.practiceLegalName } : {}),
      ...(address ? { address } : {}),
      ...(address && facts?.latitude && facts.longitude ? {
        geo: { "@type": "GeoCoordinates", latitude: Number(facts.latitude), longitude: Number(facts.longitude) },
      } : {}),
      ...(facts?.openingHours ? { openingHours: facts.openingHours.split(";").map((entry) => entry.trim()) } : {}),
      ...(facts?.practiceSraNumber
        ? {
            identifier: {
              "@type": "PropertyValue",
              propertyID: "SRA practice identifier",
              value: facts.practiceSraNumber,
            },
          }
        : {}),
    },
    {
      "@type": "Person",
      "@id": schemaIds.john,
      name: config.name,
      jobTitle: config.role,
      url: absoluteUrl("/about"),
      image: absoluteUrl(portrait),
      worksFor: ref(schemaIds.practice),
      ...(practiceAreas.length > 0 ? { knowsAbout: practiceAreas } : {}),
      ...sameAs(config.lawSocietyUrl, config.linkedinUrl),
      ...(config.sraNumber ? {
        identifier: { "@type": "PropertyValue", propertyID: "SRA individual number", value: config.sraNumber },
      } : {}),
      // The qualification the footer states, with the year it states.
      ...(config.qualifiedYear
        ? {
            hasCredential: {
              "@type": "EducationalOccupationalCredential",
              name: "Solicitor of the Senior Courts of England and Wales",
              credentialCategory: "Professional qualification",
              recognizedBy: {
                "@type": "Organization",
                name: "Solicitors Regulation Authority",
                url: "https://www.sra.org.uk/",
              },
              dateCreated: config.qualifiedYear,
            },
          }
        : {}),
    },
  ];
}

/** `sameAs` with whichever of these addresses are set, or nothing. */
function sameAs(...urls: string[]): { sameAs?: string[] } {
  const set = urls.filter(Boolean);

  return set.length > 0 ? { sameAs: set } : {};
}

// ---------------------------------------------------------------------------
// Per page
// ---------------------------------------------------------------------------

/** What a route calls itself, with any SEO override applied. */
export type PageFacts = {
  path: string;
  title: string;
  description?: string;
  /** Path or URL; the page itself unless an override points elsewhere. */
  canonical: string;
};

/** One step of the breadcrumb, after "Home". */
export type Crumb = { name: string; path: string };

function webPageId(path: string): string {
  return `${absoluteUrl(path)}#webpage`;
}

/**
 * The page itself, and where it sits in the site (REQ-017).
 *
 * `type` narrows it where Schema.org has a word for the page: `AboutPage`,
 * `ContactPage`, `CollectionPage` for an index. A page whose questions are
 * marked up is an `FAQPage`, and its questions are its `mainEntity`.
 */
export function webPageNode({
  page,
  type = "WebPage",
  about = schemaIds.practice,
  mainEntity,
  hasPart,
  hasBreadcrumb,
}: {
  page: PageFacts;
  type?: "WebPage" | "AboutPage" | "ContactPage" | "CollectionPage" | "FAQPage";
  /**
   * The `@id` of what the page is about; the practice unless said otherwise,
   * and `null` for a page whose subject is its `mainEntity` instead.
   */
  about?: string | null;
  mainEntity?: Node | Node[];
  hasPart?: Node | Node[];
  hasBreadcrumb: boolean;
}): Node {
  return {
    "@type": type,
    "@id": webPageId(page.path),
    url: absoluteUrl(page.canonical),
    name: page.title,
    ...(page.description ? { description: page.description } : {}),
    inLanguage: "en-GB",
    isPartOf: ref(schemaIds.website),
    ...(about ? { about: ref(about) } : {}),
    ...(mainEntity ? { mainEntity } : {}),
    ...(hasPart ? { hasPart } : {}),
    ...(hasBreadcrumb ? { breadcrumb: ref(`${absoluteUrl(page.path)}#breadcrumb`) } : {}),
  };
}

/**
 * The breadcrumb trail (REQ-014).
 *
 * It has to match the trail printed on the page, so the caller passes the
 * same labels the page renders. "Home" leads every trail and is added here.
 */
export function breadcrumbNode(path: string, trail: Crumb[]): Node {
  return {
    "@type": "BreadcrumbList",
    "@id": `${absoluteUrl(path)}#breadcrumb`,
    itemListElement: [{ name: "Home", path: "/" }, ...trail].map(
      (crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        item: absoluteUrl(crumb.path),
      }),
    ),
  };
}

/**
 * Questions and answers, for an `FAQPage`'s `mainEntity` (REQ-013).
 *
 * Only the questions the page shows, word for word. Google stopped showing FAQ
 * dropdowns in results for sites like this one in 2023; the markup is for
 * search engines and AI answers understanding the page, not for display.
 */
export function questionNodes(questions: Question[]): Node[] {
  return questions.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  }));
}

/** A visible FAQ section is a distinct part; article/service identity stays intact. */
export function faqPageNode({ path, items, sectionId = faqSectionId() }: { path: string; items: unknown; sectionId?: string }): Node | null {
  const questions = resolveFaqItems(items);
  if (!questions.length) return null;
  return {
    "@type": "FAQPage",
    "@id": `${absoluteUrl(path)}#faq`,
    url: `${absoluteUrl(path)}#${sectionId}`,
    name: "Frequently asked questions",
    inLanguage: "en-GB",
    isPartOf: ref(webPageId(path)),
    mainEntity: questionNodes(questions.map((item) => ({ question: item.question, answer: faqAnswerText(item.answer) }))),
  };
}

/** The `@id` of the service a `/services/<slug>` page offers. */
export function serviceId(path: string): string {
  return `${absoluteUrl(path)}#service`;
}

/**
 * An offence or representation page (REQ-012).
 *
 * The provider is the practice by reference. No `offers`: there are no
 * published prices, and the requirement allows none without one.
 */
export function serviceNode({
  path,
  name,
  description,
  category,
  jurisdiction,
}: {
  path: string;
  name: string;
  description: string;
  /** The service's group in the catalogue, e.g. "Drugs & Alcohol". */
  category?: string;
  jurisdiction: string;
}): Node {
  return {
    "@type": "Service",
    "@id": serviceId(path),
    name,
    serviceType: "Criminal defence",
    ...(category ? { category } : {}),
    description,
    url: absoluteUrl(path),
    provider: ref(schemaIds.practice),
    areaServed: { "@type": "AdministrativeArea", name: jurisdiction },
  };
}

/** The `@id` of the article a `/blog/<slug>` page carries. */
export function articleId(path: string): string {
  return `${absoluteUrl(path)}#article`;
}

/**
 * An article (REQ-015).
 *
 * John is the author and the practice the publisher, both by reference. The
 * dates are the database's: `datePublished` is the one set in the editor and
 * `dateModified` the row's last save, which the database stamps itself. A post
 * with no publication date says nothing rather than borrowing the build time.
 */
export function blogPostingNode({
  path,
  headline,
  description,
  image,
  section,
  datePublished,
  dateModified,
}: {
  path: string;
  headline: string;
  description?: string;
  image?: string;
  section?: string;
  datePublished?: string | null;
  dateModified?: string;
}): Node {
  return {
    "@type": "BlogPosting",
    "@id": articleId(path),
    headline,
    ...(description ? { description } : {}),
    ...(image ? { image: absoluteUrl(image) } : {}),
    ...(section ? { articleSection: section } : {}),
    inLanguage: "en-GB",
    author: ref(schemaIds.john),
    publisher: ref(schemaIds.practice),
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    mainEntityOfPage: ref(webPageId(path)),
  };
}

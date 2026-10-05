/**
 * Search guidance shown beside the fields of the admin editors.
 *
 * Kept apart from each field's `hint` on purpose. A hint says what a field is
 * and where it shows; a tip says how to write it so the page does well in
 * Google. They are written once here so that a heading gets the same advice
 * in Website Content, the offence pages and the articles.
 *
 * Every tip follows from how the site renders the field — which text is a
 * page's one main heading (its <h1>), which is a subheading, which feeds the
 * breadcrumb or the structured data Google reads. Change a component's markup
 * and the tip for its fields may need to change with it.
 *
 * Legal advice is what Google calls a "Your Money or Your Life" subject, held
 * to a higher standard of accuracy and trust than most sites. That is why
 * several tips are about being exact and checkable rather than about keywords.
 *
 * No server-only imports: the editors are client components.
 */

export const seoTips = {
  // -- Headings --------------------------------------------------------------

  /** A page's <h1>, written as a plain line and an italic part beneath it. */
  mainHeading:
    "With the emphasised part, this is the page’s main heading — the strongest clue Google has to what the page is about. Name the subject in the words people search for, such as “police station interview”, rather than a slogan alone.",

  mainHeadingEmphasis:
    "Google reads this as the end of the main heading. Add to the subject rather than repeat it: a promise or a qualifier, such as “Specialist defence”.",

  /** A section's <h2>. */
  sectionHeading:
    "With the emphasised part, a subheading. Google uses subheadings to learn what a page covers, so one that names its topic does more than one that only sets a mood.",

  sectionHeadingEmphasis:
    "Google reads this as the end of the subheading above.",

  /** A single <h3> inside a section. */
  subheading:
    "A subheading to Google. Phrase it the way a client would ask, such as “Do I need a solicitor for a voluntary interview?”, so the text beneath it answers a real search.",

  /** The small capitals above a heading, which are not a heading. */
  eyebrow:
    "Decoration to Google, not a heading. Keep it a short label and put the words that matter in the heading.",

  /** A page opening's eyebrow, which is also the breadcrumb. */
  breadcrumb:
    "Google can show this in its results in place of the web address, as “Home › …”. Use the page’s plain name.",

  // -- Text ------------------------------------------------------------------

  /** The paragraph directly under a page's main heading. */
  standfirst:
    "The first sentences Google reads, and the ones it most often quotes when it writes its own snippet. Say plainly what the page covers and who it helps, using the main search phrase once.",

  /** The short line set beside a section heading. */
  sectionIntro:
    "Ordinary text to Google. A sentence saying what the section is about helps more than a tagline.",

  prose:
    "Write for a worried reader on a phone; Google rewards pages people find useful. Use the words they would search — the offence, the court, the outcome — where they fit naturally, never repeated for their own sake.",

  list:
    "Google reads lists easily and sometimes lifts one straight into its results. Keep each line short and specific.",

  /** Text on a button or link. */
  linkText:
    "Link words tell Google what the page they lead to is about. Describe the destination, such as “See how fees work”, rather than “Click here”.",

  /** Labels and decoration with no weight in search. */
  minor: "Little weight in search. Write it for the reader.",

  /** Settings that never reach a page Google reads, or carry no weight there. */
  noSearchEffect: "No effect on search.",

  /** Figures and claims of experience. */
  figures:
    "Text Google can read. Keep every figure true and checkable: legal sites are judged on trust, and an inflated claim costs more than it gains.",

  // -- Repeating groups ------------------------------------------------------

  /** Cards, steps and promises whose titles render as headings. */
  cards:
    "Each title is a subheading to Google. Make titles specific — “Fixed fees agreed before you start” says more than “Clarity” — and keep the text under each to a plain sentence or two.",

  /** The questions on the fees page, marked up there as an FAQ. */
  questions:
    "These are given to Google as questions and answers on the fees page. Write each question the way a client would type it into Google, and answer it in the first sentence.",

  // -- Images ----------------------------------------------------------------

  image:
    "A real photograph builds the trust Google looks for on legal sites; stock photos add nothing. The site resizes it for each screen, so upload the sharpest version you have.",

  imageAlt:
    "Google Images reads this, as do screen readers. Describe what the picture shows in a plain sentence, such as “John Violaris, solicitor, at his desk”, not a list of keywords.",

  // -- Addresses and publication ---------------------------------------------

  slug:
    "Part of the web address, which Google shows in results. Short, lower case and hyphenated, using the main search words, such as “drink-driving”. Once a page is in Google, change it only to fix a mistake: even with the redirect, it takes a while to regain its place.",

  published:
    "Unpublished, the address stops working and Google drops the page from its results within a few weeks, losing the place it had earned. Publishing again brings it back, though not always to the same place.",

  /** A pointer to where a page's Google title and description are written. */
  searchListing:
    "The title and description Google shows for a page are written under SEO Metadata, not here.",
} as const;

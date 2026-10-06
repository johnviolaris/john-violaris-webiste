import { initialCmsFormState, type CmsFormState } from "@/lib/cms/form";
import type { SectionDraftToken } from "@/lib/cms/sections/drafts";
import { seoTips } from "@/lib/cms/seo-tips";
import {
  aboutBackgroundDefaults,
  careerBandDefaults,
  contactDetailsDefaults,
  contactPrepareDefaults,
  ctaDefaults,
  feesBodyDefaults,
  feesPreviewDefaults,
  feesStagesDefaults,
  heroDefaults,
  meetJohnDefaults,
  offenceStripDefaults,
  pageIntroDefaults,
  policeStationDefaults,
  policeStationDetailDefaults,
  policeStationStagesDefaults,
  processDefaults,
  servicesIntroDefaults,
  testimonialsIntroDefaults,
  whyInstructDefaults,
} from "@/lib/content/pages";

/**
 * What is editable under "Website Content", and what each field is.
 *
 * One registry rather than a page per section. Every section is the same three
 * things — a list of fields, the copy those fields hold by default, and the
 * routes they render on — so describing them as data means the admin form, the
 * server action that receives it and the revalidation after a save are all
 * written once. Making another section editable is an entry in this file.
 *
 * Deliberately free of server-only imports: the editor is a client component
 * and renders these labels and hints directly.
 */

// ---------------------------------------------------------------------------
// Content shapes
// ---------------------------------------------------------------------------

/** One row of a repeating field — a process step, a stat, an FAQ entry. */
export type SectionItem = Record<string, string | string[]>;

export type SectionValue = string | string[] | SectionItem[];

/** What a `page_sections.content` column holds. */
export type SectionContent = Record<string, SectionValue>;

/**
 * How a field is written and what it becomes.
 *
 * - `text`   one line, stored as a string.
 * - `lines`  a textarea, one entry per line, joined with `<br />` on the page.
 *            For headings and standfirsts that break at a chosen point.
 * - `prose`  a textarea, one entry per *paragraph*, separated by blank lines.
 *            A single newline is where someone wrapped a long sentence, not a
 *            new paragraph — see `readParagraphs` in `lib/cms/form.ts`.
 * - `list`   a textarea, one bullet per line.
 * - `items`  a repeating group, described by `item` below.
 * - `image`  an uploaded image, stored as its address — a path under
 *            `public/` for the image the site shipped with, or the storage
 *            URL of one uploaded since. Pair it with a `text` field for its
 *            description.
 */
export type FieldKind = "text" | "lines" | "prose" | "list" | "items" | "image";

/** A field inside a repeating group. */
export type ItemField = {
  key: string;
  label: string;
  /**
   * `prose` stores paragraphs; `icon` offers the icon set; `select` offers
   * `options`; the rest are plain.
   */
  kind: "text" | "textarea" | "prose" | "icon" | "select";
  hint?: string;
  maxLength?: number;
  rows?: number;
  /**
   * A row that has anything in it must fill this in. Rows left entirely empty
   * are still dropped rather than rejected — that is the row "Add" created and
   * nobody used.
   */
  required?: boolean;
  /** Required when `kind` is `select`. The first is the fallback. */
  options?: { value: string; label: string }[];
};

export type SectionField = {
  key: string;
  label: string;
  kind: FieldKind;
  hint?: string;
  /**
   * How to write the field for search, shown apart from the hint. For an
   * `items` field it covers the rows as a whole, so it is shown once rather
   * than repeated in every row.
   */
  seo?: string;
  /** An empty required field is rejected; an empty optional one is stored empty. */
  required?: boolean;
  /**
   * Per entry, not for the whole field: a `prose` field's limit applies to each
   * paragraph. Over-length text is truncated rather than rejected, as elsewhere
   * in the CMS — a pasted sentence two characters long should save.
   */
  maxLength?: number;
  rows?: number;
  /** Required when `kind` is `items`. */
  item?: {
    /** Singular, e.g. "Step". Numbered in the editor. */
    label: string;
    fields: ItemField[];
    /** A ceiling on how many rows can be saved. */
    max?: number;
  };
};

export type SectionDefinition = {
  key: string;
  label: string;
  description: string;
  /** What the section does for search, as a whole. */
  seo?: string;
  /**
   * Public routes this section renders on. Drives revalidation after a save,
   * and tells the editor where a change will show up.
   *
   * `"*"` means every page — the closing call to action is in the page body of
   * all of them, so its routes really are the whole site.
   */
  appearsOn: string[];
  fields: SectionField[];
  defaults: SectionContent;
};

export type PageGroup = {
  /** Stored in `page_sections.page`. */
  key: string;
  label: string;
  description: string;
  /** The searches the page should win, and what matters most for them. */
  seo?: string;
  sections: SectionDefinition[];
};

// ---------------------------------------------------------------------------
// Field builders
//
// The same three or four fields open most sections. Writing them out
// twenty times would bury the differences that matter.
// ---------------------------------------------------------------------------

const eyebrow: SectionField = {
  key: "eyebrow",
  label: "Eyebrow",
  kind: "text",
  hint: "The small capitals above the heading.",
  seo: seoTips.eyebrow,
  required: true,
  maxLength: 80,
};

const headline: SectionField = {
  key: "headline",
  label: "Heading",
  kind: "lines",
  hint: "One line per line on the page.",
  seo: seoTips.sectionHeading,
  required: true,
  maxLength: 120,
  rows: 2,
};

const headlineEmphasis: SectionField = {
  key: "headlineEmphasis",
  label: "Heading, emphasised part",
  kind: "lines",
  hint: "Rendered in italic beneath the heading. One line per line on the page.",
  seo: seoTips.sectionHeadingEmphasis,
  required: true,
  maxLength: 120,
  rows: 2,
};

const intro: SectionField = {
  key: "intro",
  label: "Standfirst",
  kind: "lines",
  hint: "The short line set beside the heading. Leave blank for none.",
  seo: seoTips.sectionIntro,
  maxLength: 200,
  rows: 3,
};

/** eyebrow + split heading + standfirst, the opening of most sections. */
const headingFields: SectionField[] = [
  eyebrow,
  headline,
  headlineEmphasis,
  intro,
];

const titleBodyItem = {
  label: "Card",
  fields: [
    { key: "title", label: "Title", kind: "text", maxLength: 120 },
    { key: "body", label: "Text", kind: "textarea", maxLength: 600, rows: 3 },
  ] satisfies ItemField[],
  max: 12,
};

const iconCardItem = {
  label: "Card",
  fields: [
    { key: "icon", label: "Icon", kind: "icon" },
    { key: "title", label: "Title", kind: "text", maxLength: 120 },
    { key: "body", label: "Text", kind: "textarea", maxLength: 600, rows: 3 },
  ] satisfies ItemField[],
  max: 12,
};

/** The four fields of a page's opening block, shared by seven pages. */
function introSection(page: keyof typeof pageIntroDefaults): SectionDefinition {
  return {
    key: "intro",
    label: "Page opening",
    description: "The breadcrumb label, heading and standfirst at the top of the page.",
    seo: "The first thing Google reads on the page. The heading here is the page’s main heading, so it carries more weight than any other text on it.",
    appearsOn: [`/${page}`],
    fields: [
      {
        key: "eyebrow",
        label: "Eyebrow",
        kind: "text",
        hint: "Also used as the breadcrumb after “Home /”.",
        seo: seoTips.breadcrumb,
        required: true,
        maxLength: 80,
      },
      {
        key: "title",
        label: "Heading",
        kind: "text",
        seo: seoTips.mainHeading,
        required: true,
        maxLength: 120,
      },
      {
        key: "emphasis",
        label: "Heading, emphasised part",
        kind: "text",
        hint: "Rendered in italic on the second line.",
        seo: seoTips.mainHeadingEmphasis,
        required: true,
        maxLength: 120,
      },
      {
        key: "description",
        label: "Standfirst",
        kind: "text",
        hint: "One or two sentences beneath the heading.",
        seo: seoTips.standfirst,
        required: true,
        maxLength: 400,
        rows: 3,
      },
    ],
    defaults: { ...pageIntroDefaults[page] },
  };
}

// ---------------------------------------------------------------------------
// The registry
// ---------------------------------------------------------------------------

export const pageGroups: PageGroup[] = [
  {
    key: "home",
    label: "Home page",
    description: "The hero and the bands beneath it.",
    seo: "The page most searches land on, and the one that should win the broad ones: “motoring solicitor”, “driving offence solicitor”, “criminal defence solicitor”. The hero heading is the most important text on the whole site.",
    sections: [
      {
        key: "hero",
        label: "Hero",
        description:
          "The opening screen: heading, introduction, the personal commitment card and the experience figures.",
        seo: "The home page’s main heading is here. Say what John does and where — a motoring and criminal defence solicitor across England and Wales — in words a client would search, not only in a slogan.",
        appearsOn: ["/"],
        fields: [
          {
            key: "toplineLeft",
            label: "Top line, left",
            kind: "text",
            seo: seoTips.minor,
            maxLength: 60,
          },
          {
            key: "toplineRight",
            label: "Top line, right",
            kind: "text",
            seo: seoTips.minor,
            maxLength: 60,
          },
          { ...eyebrow, hint: "The small capitals above the heading." },
          { ...headline, seo: seoTips.mainHeading },
          { ...headlineEmphasis, seo: seoTips.mainHeadingEmphasis },
          {
            key: "description",
            label: "Introduction",
            kind: "lines",
            hint: "One line per line on the page, on wider screens.",
            seo: seoTips.standfirst,
            required: true,
            maxLength: 200,
            rows: 3,
          },
          {
            key: "ctaLabel",
            label: "Button",
            kind: "text",
            seo: seoTips.linkText,
            required: true,
            maxLength: 60,
          },
          {
            key: "reassuranceLeft",
            label: "Below the button, left",
            kind: "text",
            seo: seoTips.minor,
            maxLength: 60,
          },
          {
            key: "reassuranceRight",
            label: "Below the button, right",
            kind: "text",
            seo: seoTips.minor,
            maxLength: 60,
          },
          {
            key: "portrait",
            label: "Portrait",
            kind: "image",
            hint: "The photograph beside the heading. A portrait-shaped image works best — it is shown taller than it is wide. JPEG, PNG, WebP or AVIF, up to 4 MB.",
            seo: seoTips.image,
            required: true,
            maxLength: 500,
          },
          {
            key: "portraitAlt",
            label: "Portrait description",
            kind: "text",
            hint: "What the photograph shows, for anyone using a screen reader.",
            seo: seoTips.imageAlt,
            required: true,
            maxLength: 200,
          },
          {
            key: "cardLabel",
            label: "Card label",
            kind: "text",
            hint: "Top-left of the card that slides in over the portrait.",
            seo: seoTips.minor,
            maxLength: 60,
          },
          {
            key: "cardEyebrow",
            label: "Card eyebrow",
            kind: "text",
            seo: seoTips.minor,
            maxLength: 80,
          },
          {
            key: "cardBody",
            label: "Card text",
            kind: "lines",
            hint: "One line per line on the card.",
            seo: seoTips.minor,
            maxLength: 120,
            rows: 3,
          },
          {
            key: "cardBodyEmphasis",
            label: "Card text, emphasised ending",
            kind: "text",
            hint: "Italic, on the end of the last line.",
            seo: seoTips.minor,
            maxLength: 60,
          },
          {
            key: "cardRole",
            label: "Card role line",
            kind: "text",
            seo: seoTips.minor,
            maxLength: 80,
          },
          {
            key: "cardFooterLabel",
            label: "Card link",
            kind: "text",
            seo: seoTips.linkText,
            maxLength: 60,
          },
          {
            key: "exploreLabel",
            label: "Scroll link",
            kind: "text",
            seo: seoTips.minor,
            maxLength: 60,
          },
          {
            key: "bottomTagline",
            label: "Bottom line",
            kind: "text",
            seo: seoTips.minor,
            maxLength: 80,
          },
          {
            key: "stats",
            label: "Experience figures",
            kind: "items",
            hint: "The dark band under the hero. Four fit the row comfortably.",
            seo: seoTips.figures,
            item: {
              label: "Figure",
              fields: [
                { key: "value", label: "Figure", kind: "text", maxLength: 24 },
                {
                  key: "suffix",
                  label: "Suffix",
                  kind: "text",
                  hint: "Raised after the figure, e.g. “+”. Optional.",
                  maxLength: 4,
                },
                { key: "label", label: "Label", kind: "text", maxLength: 80 },
              ],
              max: 6,
            },
          },
        ],
        defaults: { ...heroDefaults },
      },
      {
        key: "offence-strip",
        label: "Common charges rail",
        description:
          "The slim rail closing the hero. The charges themselves come from the service catalogue.",
        seo: "Each charge in the rail is a link to its own page, which helps Google find those pages from the home page. Which charges appear is set under Services.",
        appearsOn: ["/"],
        fields: [{ ...eyebrow, required: true }],
        defaults: { ...offenceStripDefaults },
      },
      {
        key: "why-instruct",
        label: "Why instruct me",
        description: "The four reasons to instruct a one-solicitor practice.",
        seo: "A subheading and a set of cards Google reads as smaller headings. Name reasons a client would actually weigh up; specific beats clever.",
        appearsOn: ["/"],
        fields: [
          ...headingFields,
          {
            key: "cards",
            label: "Reasons",
            kind: "items",
            seo: seoTips.cards,
            item: iconCardItem,
          },
        ],
        defaults: { ...whyInstructDefaults },
      },
      {
        key: "testimonials",
        label: "Reviews band heading",
        description:
          "The copy framing the reviews. The reviews themselves are collected by ReviewSolicitors and are not editable here.",
        seo: "The reviews are trusted because clients wrote them and nobody here can change them. The heading around them is an ordinary subheading.",
        appearsOn: ["/"],
        fields: [
          ...headingFields,
          {
            key: "linkLabel",
            label: "Button",
            kind: "text",
            seo: seoTips.linkText,
            maxLength: 60,
          },
          {
            key: "note",
            label: "Note beneath the button",
            kind: "text",
            seo: seoTips.minor,
            maxLength: 160,
          },
        ],
        defaults: { ...testimonialsIntroDefaults },
      },
    ],
  },

  {
    key: "about",
    label: "About",
    description: "John's introduction, background and route to practice.",
    seo: "Searches for John by name, and the trust Google looks for behind any legal advice: who he is, when he qualified, where he practises. Specific, checkable facts here support every other page.",
    sections: [
      introSection("about"),
      {
        key: "meet-john",
        label: "Meet John",
        description:
          "The personal introduction. Rendered on the home page and the about page, so an edit changes both.",
        seo: "Google looks for the person behind legal advice. Real experience — when John qualified, the courts he works in, the cases he takes — is what it looks for, and what a client wants to read.",
        appearsOn: ["/", "/about"],
        fields: [
          eyebrow,
          headline,
          headlineEmphasis,
          {
            key: "aside",
            label: "Aside",
            kind: "lines",
            hint: "The short line under the heading. One line per line.",
            seo: seoTips.sectionIntro,
            maxLength: 120,
            rows: 2,
          },
          {
            key: "signoff",
            label: "Signature",
            kind: "text",
            seo: seoTips.minor,
            maxLength: 60,
          },
          {
            key: "aboutLinkLabel",
            label: "Link to the about page",
            kind: "text",
            hint: "Shown on the home page only.",
            seo: seoTips.linkText,
            maxLength: 60,
          },
          {
            key: "storyLead",
            label: "Opening line",
            kind: "lines",
            hint: "Set larger than the rest. One line per line.",
            seo: seoTips.sectionIntro,
            maxLength: 120,
            rows: 2,
          },
          {
            key: "story",
            label: "Story",
            kind: "prose",
            hint: "Separate paragraphs with a blank line.",
            seo: seoTips.prose,
            required: true,
            maxLength: 1200,
            rows: 10,
          },
          {
            key: "promises",
            label: "Promises",
            kind: "items",
            hint: "The three small cards closing the section.",
            seo: seoTips.cards,
            item: iconCardItem,
          },
        ],
        defaults: { ...meetJohnDefaults },
      },
      {
        key: "background",
        label: "Background and approach",
        description: "Education, practice, and the principles behind the work.",
        seo: "The kind of experience a reader can check on the SRA register, and that Google looks for on legal sites. Be specific: years, courts, kinds of case.",
        appearsOn: ["/about"],
        fields: [
          ...headingFields,
          {
            key: "entries",
            label: "Entries",
            kind: "items",
            hint: "Numbered in the order below.",
            seo: seoTips.cards,
            item: {
              label: "Entry",
              fields: [
                { key: "title", label: "Title", kind: "text", maxLength: 120 },
                {
                  key: "paragraphs",
                  label: "Text",
                  kind: "prose",
                  hint: "Separate paragraphs with a blank line.",
                  maxLength: 1600,
                  rows: 6,
                },
              ],
              max: 10,
            },
          },
        ],
        defaults: { ...aboutBackgroundDefaults },
      },
      {
        key: "career",
        label: "Career band",
        description: "The dark band tracing the route to practice.",
        seo: "A short timeline. Exact years and roles make the rest of the page easier to trust.",
        appearsOn: ["/about"],
        fields: [
          { ...eyebrow, required: true },
          {
            key: "milestones",
            label: "Milestones",
            kind: "items",
            seo: seoTips.figures,
            item: {
              label: "Milestone",
              fields: [
                { key: "year", label: "Year", kind: "text", maxLength: 24 },
                { key: "title", label: "What happened", kind: "text", maxLength: 120 },
              ],
              max: 12,
            },
          },
        ],
        defaults: { ...careerBandDefaults },
      },
    ],
  },

  {
    key: "services",
    label: "Services",
    description:
      "The services index page, and the explorer heading it shares with the home page.",
    seo: "The broad searches — “driving offence solicitor”, “motoring offences” — and the route into every offence page. Each offence ranks on its own page, edited under Service Pages.",
    sections: [
      introSection("services"),
      {
        key: "explorer",
        label: "Service explorer heading",
        description:
          "The heading above the service explorer, and the note beneath it. The services themselves come from the catalogue.",
        seo: "The services listed under this heading are links to each offence page, one of the main ways Google finds them. The services themselves are edited under Services.",
        appearsOn: ["/", "/services"],
        fields: [
          ...headingFields,
          {
            key: "allServicesLabel",
            label: "“All services” link",
            kind: "text",
            seo: seoTips.linkText,
            maxLength: 60,
          },
          {
            key: "noteQuestion",
            label: "Closing question",
            kind: "text",
            seo: seoTips.minor,
            maxLength: 120,
          },
          {
            key: "noteLinkLabel",
            label: "Closing link",
            kind: "text",
            seo: seoTips.linkText,
            maxLength: 120,
          },
        ],
        defaults: { ...servicesIntroDefaults },
      },
    ],
  },

  {
    key: "police-station",
    label: "Police station",
    description: "Representation before, during and after a police interview.",
    seo: "“Police station solicitor”, “police interview solicitor”, “voluntary interview”. Say those things plainly in the headings and the first paragraphs.",
    sections: [
      introSection("police-station"),
      {
        key: "feature",
        label: "Interview under caution",
        description:
          "The dark band making the case for representation. Rendered on the home page and the police station page.",
        seo: "Shown on two pages, so Google reads it on both. Keep it about police interviews — the searches the police station page should win.",
        appearsOn: ["/", "/police-station"],
        fields: [
          { ...eyebrow, hint: "Preceded by the pulsing dot." },
          headline,
          headlineEmphasis,
          {
            key: "body",
            label: "Text",
            kind: "prose",
            seo: seoTips.prose,
            required: true,
            maxLength: 1600,
            rows: 8,
          },
          {
            key: "ctaLabel",
            label: "Button",
            kind: "text",
            seo: seoTips.linkText,
            maxLength: 60,
          },
          {
            key: "urgentLabel",
            label: "Urgent link",
            kind: "text",
            seo: seoTips.linkText,
            maxLength: 80,
          },
          {
            key: "railEyebrow",
            label: "Panel eyebrow",
            kind: "text",
            seo: seoTips.minor,
            maxLength: 60,
          },
          {
            key: "railValue",
            label: "Panel figure",
            kind: "text",
            seo: seoTips.figures,
            maxLength: 24,
          },
          {
            key: "railSuffix",
            label: "Panel figure suffix",
            kind: "text",
            seo: seoTips.minor,
            maxLength: 4,
          },
          {
            key: "railLabel",
            label: "Panel figure label",
            kind: "text",
            seo: seoTips.figures,
            maxLength: 80,
          },
          {
            key: "railLines",
            label: "Panel text",
            kind: "lines",
            hint: "One line per line on the panel.",
            seo: seoTips.minor,
            maxLength: 120,
            rows: 3,
          },
          {
            key: "railLinesEmphasis",
            label: "Panel text, emphasised last line",
            kind: "text",
            seo: seoTips.minor,
            maxLength: 120,
          },
          {
            key: "railLocation",
            label: "Panel footer",
            kind: "text",
            seo: seoTips.minor,
            maxLength: 120,
          },
        ],
        defaults: { ...policeStationDefaults },
      },
      {
        key: "detail",
        label: "Interview guidance",
        description:
          "What the police station stage involves, what John does there, and the two panels beside it.",
        seo: "The page’s main content, and the words most likely to match a search. Each heading here is a subheading to Google; the questions clients actually ask make the best ones.",
        appearsOn: ["/police-station"],
        fields: [
          eyebrow,
          headline,
          headlineEmphasis,
          {
            key: "whyHeading",
            label: "First heading",
            kind: "text",
            seo: seoTips.subheading,
            maxLength: 120,
          },
          {
            key: "whyBody",
            label: "First section",
            kind: "prose",
            seo: seoTips.prose,
            maxLength: 1600,
            rows: 6,
          },
          {
            key: "supportHeading",
            label: "Second heading",
            kind: "text",
            seo: seoTips.subheading,
            maxLength: 120,
          },
          {
            key: "support",
            label: "What John does",
            kind: "list",
            hint: "One bullet per line.",
            seo: seoTips.list,
            maxLength: 300,
            rows: 6,
          },
          {
            key: "continuityHeading",
            label: "Third heading",
            kind: "text",
            seo: seoTips.subheading,
            maxLength: 120,
          },
          {
            key: "continuityBody",
            label: "Third section",
            kind: "prose",
            seo: seoTips.prose,
            maxLength: 1200,
            rows: 4,
          },
          {
            key: "legalAidEyebrow",
            label: "Legal aid panel eyebrow",
            kind: "text",
            seo: seoTips.eyebrow,
            maxLength: 80,
          },
          {
            key: "legalAidHeading",
            label: "Legal aid panel heading",
            kind: "text",
            seo: seoTips.subheading,
            maxLength: 120,
          },
          {
            key: "legalAidBody",
            label: "Legal aid panel text",
            kind: "prose",
            seo: seoTips.prose,
            maxLength: 800,
            rows: 4,
          },
          {
            key: "urgentEyebrow",
            label: "Urgent panel eyebrow",
            kind: "text",
            seo: seoTips.eyebrow,
            maxLength: 80,
          },
          {
            key: "urgentHeading",
            label: "Urgent panel heading",
            kind: "text",
            seo: seoTips.subheading,
            maxLength: 120,
          },
          {
            key: "urgentBody",
            label: "Urgent panel text",
            kind: "prose",
            seo: seoTips.prose,
            maxLength: 800,
            rows: 4,
          },
          {
            key: "urgentCallLabel",
            label: "Call button",
            kind: "text",
            hint: "Shown when a telephone number is configured.",
            seo: seoTips.linkText,
            maxLength: 60,
          },
          {
            key: "urgentCallFallbackLabel",
            label: "Call button, no number configured",
            kind: "text",
            seo: seoTips.linkText,
            maxLength: 60,
          },
          {
            key: "urgentEmailLabel",
            label: "Email link",
            kind: "text",
            seo: seoTips.linkText,
            maxLength: 60,
          },
          {
            key: "prepLabel",
            label: "Preparation link",
            kind: "text",
            seo: seoTips.linkText,
            maxLength: 60,
          },
        ],
        defaults: { ...policeStationDetailDefaults },
      },
      {
        key: "stages",
        label: "Before, during, after",
        description: "The three cards closing the police station page.",
        seo: "Google reads each card title as a subheading. Before, during and after an interview are exactly the stages people search about.",
        appearsOn: ["/police-station"],
        fields: [
          {
            key: "cards",
            label: "Cards",
            kind: "items",
            seo: seoTips.cards,
            item: titleBodyItem,
          },
        ],
        defaults: { ...policeStationStagesDefaults },
      },
    ],
  },

  {
    key: "fees",
    label: "Fees",
    description:
      "The fees page, and the questions it shares with the home page. The site publishes no fee figures.",
    seo: "“Solicitor fees”, “free consultation”, and the questions people ask about cost. The questions on this page are given to Google as an FAQ.",
    sections: [
      introSection("fees"),
      {
        key: "body",
        label: "How fees work",
        description: "The text beneath the numbered cards on the fees page.",
        seo: "People often search how much a solicitor costs before they call one. A plain explanation of how fees are agreed is what answers that search.",
        appearsOn: ["/fees"],
        fields: [
          { ...eyebrow, hint: "The small capitals above the first paragraph." },
          {
            key: "body",
            label: "Text",
            kind: "prose",
            hint: "The first paragraph is set large on the left, the last is highlighted as a closing note, and any in between are ordinary text.",
            seo: seoTips.prose,
            required: true,
            maxLength: 800,
            rows: 12,
          },
        ],
        defaults: { ...feesBodyDefaults },
      },
      {
        key: "stages",
        label: "How fees are agreed",
        description: "The three numbered cards opening the fees page.",
        seo: "Google reads each card title as a subheading. Titles that say what happens — “A free first conversation” — do more than labels.",
        appearsOn: ["/fees"],
        fields: [
          {
            key: "cards",
            label: "Cards",
            kind: "items",
            seo: seoTips.cards,
            item: {
              label: "Card",
              fields: [
                { key: "eyebrow", label: "Eyebrow", kind: "text", maxLength: 60 },
                { key: "title", label: "Title", kind: "text", maxLength: 120 },
                { key: "body", label: "Text", kind: "textarea", maxLength: 600, rows: 3 },
              ],
              max: 8,
            },
          },
        ],
        defaults: { ...feesStagesDefaults },
      },
      {
        key: "preview",
        label: "Honesty and questions",
        description:
          "The free-consultation note and the frequently asked questions. Rendered on the home page and the fees page.",
        seo: "The questions here are given to Google as an FAQ on the fees page. Adding the questions clients really ask, answered plainly, is one of the best ways to appear for longer searches.",
        appearsOn: ["/", "/fees"],
        fields: [
          eyebrow,
          headline,
          {
            key: "headlineEmphasisLead",
            label: "Heading, second line start",
            kind: "text",
            hint: "Plain text before the italic ending, e.g. “with”.",
            seo: seoTips.sectionHeadingEmphasis,
            maxLength: 60,
          },
          {
            key: "headlineEmphasis",
            label: "Heading, emphasised ending",
            kind: "text",
            seo: seoTips.sectionHeadingEmphasis,
            required: true,
            maxLength: 60,
          },
          {
            key: "body",
            label: "Text",
            kind: "prose",
            seo: seoTips.prose,
            maxLength: 800,
            rows: 4,
          },
          {
            key: "linkLabel",
            label: "Link to fees",
            kind: "text",
            seo: seoTips.linkText,
            maxLength: 60,
          },
          {
            key: "questions",
            label: "Questions",
            kind: "items",
            hint: "Shown as an expandable list.",
            seo: seoTips.questions,
            item: {
              label: "Question",
              fields: [
                { key: "question", label: "Question", kind: "text", maxLength: 200 },
                { key: "answer", label: "Answer", kind: "textarea", maxLength: 800, rows: 4 },
              ],
              max: 12,
            },
          },
        ],
        defaults: { ...feesPreviewDefaults },
      },
    ],
  },

  {
    key: "reviews",
    label: "Reviews",
    description: "The reviews page opening. The reviews are supplied by ReviewSolicitors.",
    seo: "Searches for John’s name with “reviews”. The reviews are the content; the opening only needs to introduce them.",
    sections: [introSection("reviews")],
  },

  {
    key: "cookies",
    label: "Cookie policy",
    description:
      "The cookie policy's opening. The list of cookies below it follows what the site actually stores, so it is kept in the code rather than edited here.",
    seo: "Not a page people search for. Accurate and plain is all it needs.",
    sections: [introSection("cookies")],
  },

  {
    key: "privacy",
    label: "Privacy notice",
    description:
      "The privacy notice's opening. The notice below it describes what the site actually does with an enquiry, so it is kept in the code rather than edited here.",
    seo: "Not a page people search for. Accurate and plain is all it needs.",
    sections: [introSection("privacy")],
  },

  {
    key: "contact",
    label: "Contact",
    description: "The contact page, beside the enquiry form.",
    seo: "Searches for John by name from people ready to get in touch. The telephone and email Google reads come from Site Settings.",
    sections: [
      introSection("contact"),
      {
        key: "details",
        label: "Ways to get in touch",
        description:
          "The labels on the email, telephone and WhatsApp rows, and the note about what enquiring does not create.",
        seo: "The contact details themselves come from Site Settings, which is where Google reads them. The labels here are for the reader.",
        appearsOn: ["/contact"],
        fields: [
          { ...eyebrow, hint: "Above the heading." },
          headline,
          headlineEmphasis,
          {
            key: "emailLabel",
            label: "Email row label",
            kind: "text",
            seo: seoTips.minor,
            maxLength: 60,
          },
          {
            key: "callLabel",
            label: "Telephone row label",
            kind: "text",
            seo: seoTips.minor,
            maxLength: 60,
          },
          {
            key: "whatsappLabel",
            label: "WhatsApp row label",
            kind: "text",
            hint: "Only shown when a WhatsApp number is configured.",
            seo: seoTips.minor,
            maxLength: 60,
          },
          {
            key: "whatsappValue",
            label: "WhatsApp row value",
            kind: "text",
            seo: seoTips.minor,
            maxLength: 60,
          },
          {
            key: "disclaimer",
            label: "Note",
            kind: "prose",
            hint: "Check any change here with John — it states what getting in touch does not create.",
            seo: seoTips.minor,
            required: true,
            maxLength: 1200,
            rows: 5,
          },
        ],
        defaults: { ...contactDetailsDefaults },
      },
      {
        key: "prepare",
        label: "What to have ready",
        description: "The panel beside the contact details.",
        seo: "Practical, specific guidance is what Google rewards. A clear list of what to have ready helps the reader and the page alike.",
        appearsOn: ["/contact"],
        fields: [
          eyebrow,
          headline,
          headlineEmphasis,
          {
            key: "listIntro",
            label: "Above the list",
            kind: "text",
            seo: seoTips.minor,
            maxLength: 120,
          },
          {
            key: "list",
            label: "List",
            kind: "list",
            hint: "One item per line.",
            seo: seoTips.list,
            maxLength: 200,
            rows: 5,
          },
          {
            key: "listNote",
            label: "Below the list",
            kind: "prose",
            seo: seoTips.prose,
            maxLength: 400,
            rows: 3,
          },
          {
            key: "ctaLabel",
            label: "Button",
            kind: "text",
            seo: seoTips.linkText,
            maxLength: 60,
          },
          {
            key: "urgentHeading",
            label: "Urgent heading",
            kind: "text",
            seo: seoTips.minor,
            maxLength: 120,
          },
          {
            key: "urgentBody",
            label: "Urgent text",
            kind: "prose",
            seo: seoTips.prose,
            maxLength: 600,
            rows: 3,
          },
        ],
        defaults: { ...contactPrepareDefaults },
      },
    ],
  },

  {
    key: "shared",
    label: "Shared sections",
    description: "Copy that appears on more than one page.",
    seo: "Repeated on several pages, so Google gives it little weight on any one of them. Words specific to one page belong on that page instead.",
    sections: [
      {
        key: "process",
        label: "What happens next",
        description:
          "The four steps of working with John. Rendered on the home page and the about page.",
        seo: "Shown on two pages. Clear, concrete steps reassure readers and tell Google what working with John involves.",
        appearsOn: ["/", "/about"],
        fields: [
          ...headingFields,
          {
            key: "steps",
            label: "Steps",
            kind: "items",
            hint: "Numbered in the order below.",
            seo: seoTips.cards,
            item: titleBodyItem,
          },
        ],
        defaults: { ...processDefaults },
      },
      {
        key: "cta",
        label: "Closing call to action",
        description:
          "The band that closes every page except contact, which ends with the enquiry form instead.",
        seo: "On every page, so Google sees it many times and weighs it lightly on each. Keep it short and about getting in touch.",
        appearsOn: ["*"],
        fields: [
          eyebrow,
          {
            key: "badge",
            label: "Badge",
            kind: "text",
            seo: seoTips.minor,
            maxLength: 60,
          },
          headline,
          headlineEmphasis,
          {
            key: "body",
            label: "Text",
            kind: "lines",
            hint: "One line per line on the page.",
            seo: seoTips.sectionIntro,
            maxLength: 160,
            rows: 3,
          },
          {
            key: "ctaLabel",
            label: "Button",
            kind: "text",
            seo: seoTips.linkText,
            maxLength: 60,
          },
          {
            key: "footerLeft",
            label: "Footer, left",
            kind: "text",
            seo: seoTips.minor,
            maxLength: 120,
          },
          {
            key: "footerRight",
            label: "Footer, right",
            kind: "text",
            seo: seoTips.minor,
            maxLength: 80,
          },
        ],
        defaults: { ...ctaDefaults },
      },
    ],
  },
];

/**
 * The editor's starting state.
 *
 * Here rather than beside the action that consumes it: every export of a
 * `"use server"` module has to be an async function, so a plain constant in
 * `actions.ts` fails the build the moment a Server Component imports from it.
 */
export const initialSectionFormState: SectionFormState =
  initialCmsFormState({});

/**
 * A section editor's state. `reset` marks the answer to "Revert to original",
 * which the editor has to tell apart from a save: its rows and images still
 * hold the edits that were just discarded, and have to go back to the
 * defaults too.
 */
export type SectionFormState = CmsFormState & { reset?: boolean; savedDraft?: SectionDraftToken | null; savedLiveContent?: SectionContent | null };

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

export function findGroup(page: string): PageGroup | undefined {
  return pageGroups.find((group) => group.key === page);
}

export function findSection(
  page: string,
  section: string,
): SectionDefinition | undefined {
  return findGroup(page)?.sections.find((entry) => entry.key === section);
}

/** Every section of a page, as `(page, section)` pairs. Used by the seedless read. */
export function sectionKeys(page: string): string[] {
  return findGroup(page)?.sections.map((section) => section.key) ?? [];
}

// ---------------------------------------------------------------------------
// FormData encoding
//
// Field names are shared by the editor that writes them and the action that
// reads them, so they are generated here rather than spelled out in both.
// ---------------------------------------------------------------------------

export function fieldName(key: string): string {
  return `field.${key}`;
}

export function itemCountName(key: string): string {
  return `count.${key}`;
}

export function itemFieldName(
  key: string,
  index: number,
  subKey: string,
): string {
  return `item.${key}.${index}.${subKey}`;
}

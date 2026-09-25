import type { IconName } from "@/components/ui/icons";

/**
 * The editorial copy on the core pages, as written.
 *
 * Two jobs, the same way `lib/content/blog.ts` has two:
 *
 *  1. It is what the pages render out of the box. Nothing has to be seeded into
 *     Supabase for the site to read exactly as it does today.
 *  2. It is the fallback. A section John has never edited has no row in
 *     `page_sections`, and `getPageContent` hands back the default below.
 *
 * Because of (2) this file is the definition of what a section says by default,
 * not a copy of something in the database. Editing a string here changes the
 * site for every section that has not been overridden — which, until John
 * starts editing, is all of them.
 *
 * ## On line breaks
 *
 * Several headings and standfirsts break at a deliberate point: "Your defence…"
 * above "My personal attention." is a design decision, not the browser wrapping
 * text. Those fields are `string[]`, one entry per line, and the component
 * joins them with `<br />`. An editor who types one line gets one line; the
 * markup is never something anyone has to type.
 *
 * Prose fields are `string[]` too, but one entry per *paragraph*. The field
 * kind in `lib/cms/sections/schema.ts` says which is which, and the admin form
 * labels them differently ("one per line" against "separate with a blank line").
 */

// ---------------------------------------------------------------------------
// Shared item shapes
// ---------------------------------------------------------------------------

/** A titled card with a line of prose. Used by several grids. */
export type TitledCard = {
  title: string;
  body: string;
};

/** A card that also carries an icon. */
export type IconCard = TitledCard & {
  icon: IconName;
};

/** One figure in the experience band. */
export type Stat = {
  value: string;
  /** Rendered small and raised, e.g. the "+" in "10,000+". Optional. */
  suffix?: string;
  label: string;
};

/** A question and its answer, for the FAQ list. */
export type Question = {
  question: string;
  answer: string;
};

/** One entry on the career band. */
export type Milestone = {
  year: string;
  title: string;
};

/** A heading with prose beneath it, numbered by position. */
export type NumberedEntry = {
  title: string;
  paragraphs: string[];
};

/** The eyebrow / headline / standfirst that opens a non-home page. */
export type PageIntroContent = {
  eyebrow: string;
  title: string;
  emphasis: string;
  description: string;
};

/** The heading row that opens most sections: eyebrow, split heading, aside. */
export type SectionHeading = {
  eyebrow: string;
  headline: string[];
  headlineEmphasis: string[];
  intro: string[];
};

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------

export type HeroContent = {
  toplineLeft: string;
  toplineRight: string;
  eyebrow: string;
  headline: string[];
  headlineEmphasis: string[];
  description: string[];
  ctaLabel: string;
  reassuranceLeft: string;
  reassuranceRight: string;
  /**
   * The photograph beside the heading: a path under `public/` or an uploaded
   * image's storage URL.
   */
  portrait: string;
  portraitAlt: string;
  cardLabel: string;
  cardEyebrow: string;
  cardBody: string[];
  cardBodyEmphasis: string;
  cardRole: string;
  cardFooterLabel: string;
  exploreLabel: string;
  bottomTagline: string;
  stats: Stat[];
};

export const heroDefaults: HeroContent = {
  toplineLeft: "Independent criminal defence",
  toplineRight: "England & Wales",
  eyebrow: "John Violaris · Solicitor",
  headline: ["Your defence…"],
  headlineEmphasis: ["My personal", "attention."],
  description: [
    "Whether you’re fighting for your licence or your freedom,",
    "speak directly to the solicitor who will stand beside you.",
  ],
  ctaLabel: "Let’s talk about your case",
  reassuranceLeft: "Free initial consultation",
  reassuranceRight: "No obligation",
  portrait: "/Profile 7.png",
  portraitAlt: "Portrait of John Violaris, criminal defence solicitor",
  cardLabel: "A personal commitment",
  cardEyebrow: "One solicitor. Throughout.",
  cardBody: ["When you instruct me,", "you deal with"],
  cardBodyEmphasis: "me.",
  cardRole: "Criminal Defence & Motoring Solicitor",
  cardFooterLabel: "Meet your solicitor",
  exploreLabel: "Explore how I can help",
  bottomTagline: "Personal representation. Serious experience.",
  stats: [
    { value: "20", suffix: "+", label: "Years in criminal defence" },
    { value: "10,000", suffix: "+", label: "Clients represented" },
    { value: "2005", label: "Qualified as a solicitor" },
    { value: "You + John", label: "No third parties" },
  ],
};

/** The slim rail of common charges closing the hero. */
export const offenceStripDefaults = {
  eyebrow: "What I defend",
};

export type ServicesIntroContent = SectionHeading & {
  allServicesLabel: string;
  noteQuestion: string;
  noteLinkLabel: string;
};

export const servicesIntroDefaults: ServicesIntroContent = {
  eyebrow: "How I can help",
  headline: ["A clear way forward."],
  headlineEmphasis: ["Whatever you’re facing."],
  intro: [],
  allServicesLabel: "View all services",
  noteQuestion: "Not sure where your situation fits?",
  noteLinkLabel: "Tell me what’s happened. We’ll take it from there.",
};

export type WhyInstructContent = SectionHeading & {
  cards: IconCard[];
};

export const whyInstructDefaults: WhyInstructContent = {
  eyebrow: "Why instruct me",
  headline: ["You hire a solicitor."],
  headlineEmphasis: ["You should get one."],
  intro: [
    "Large firms sell you a brand,",
    "then hand you to whoever is free.",
  ],
  cards: [
    {
      icon: "scales",
      title: "One solicitor, start to finish",
      body: "The solicitor you speak to on the phone is the one who presents your evidence and stands up for you in court. No hand-offs, no agents.",
    },
    {
      icon: "pound",
      title: "Fixed fees, agreed up front",
      body: "You’ll know exactly what your case costs before you instruct me. No hourly meter, no open-ended billing, no unexpected invoices.",
    },
    {
      icon: "history",
      title: "Two decades of criminal practice",
      body: "Qualified in 2005 and have been representing clients ever since. I know how these hearings run and how the Court thinks.",
    },
    {
      icon: "target",
      title: "Honest advice, not sales talk",
      body: "I will tell you if you have a defence worth running — and I will tell you just as plainly when mitigation is the better route.",
    },
  ],
};

// ---------------------------------------------------------------------------
// About
// ---------------------------------------------------------------------------

export type MeetJohnContent = {
  eyebrow: string;
  headline: string[];
  headlineEmphasis: string[];
  aside: string[];
  signoff: string;
  aboutLinkLabel: string;
  storyLead: string[];
  story: string[];
  promises: IconCard[];
};

export const meetJohnDefaults: MeetJohnContent = {
  eyebrow: "The person in your corner",
  headline: ["I’m John."],
  headlineEmphasis: ["Your solicitor."],
  aside: ["From our first conversation", "to the conclusion of your case."],
  signoff: "John Violaris",
  aboutLinkLabel: "A little more about me",
  storyLead: ["Behind every case is a person.", "That’s where I start."],
  story: [
    "Everybody has their own story and no case is ever the same. When the police accuse you of wrong it’s rattling. The best lawyers aren’t just masters in advocacy. They’re stress relievers who are excellent with people from all walks of life.",
    "When you hire me you get me. No secretaries answering the phone or strangers turning up at Court. I will know your background and understand your best interests. I offer a personalised service where you stay in the loop.",
    "Criminal proceedings are far less stressful when the process is clear and you know what to expect at every given stage.",
  ],
  promises: [
    {
      icon: "call",
      title: "Direct access",
      body: "I’ll be handling your case from start to finish.",
    },
    {
      icon: "bulb",
      title: "Clear advice",
      body: "Understand your options and possible outcomes.",
    },
    {
      icon: "heart",
      title: "Personal attention",
      body: "Your circumstances shape the approach.",
    },
  ],
};

export type AboutBackgroundContent = SectionHeading & {
  entries: NumberedEntry[];
};

export const aboutBackgroundDefaults: AboutBackgroundContent = {
  eyebrow: "Background and approach",
  headline: ["Experience built"],
  headlineEmphasis: ["case by case."],
  intro: ["Education, practice and the principles behind John’s work."],
  entries: [
    {
      title: "Education",
      paragraphs: [
        "John graduated from the University of Bristol in 2001 with a 2:1 degree in LLB Law (European Legal Studies), before completing the Legal Practice Course at UWE Bristol in 2002.",
        "He went on to complete his training contract at Galbraith Branley Solicitors in North London between 2003 to 2005, where he began representing clients at police stations.",
      ],
    },
    {
      title: "Practice",
      paragraphs: [
        "John qualified in 2005 and has specialised in criminal defence at the police station and magistrates’ court ever since.",
        "John currently practices at Darryl Ingram Solicitors and is a Duty Solicitor serving local courts and police stations in the Greater London area. His experience spans all crime representing people from all backgrounds. His current practice is focused on motoring defences and trial representation.",
      ],
    },
    {
      title: "What drives him",
      paragraphs: [
        "Throughout more than 20 years in legal-aid practice, John worked on a simple principle: the value of a case should never be measured by the fee attached to it. What mattered was the person relying on him and the outcome they faced. That same commitment continues today — every client matters, every case deserves careful preparation, and every result is worth fighting for.",
      ],
    },
    {
      title: "His approach",
      paragraphs: [
        "Thorough preparation. Clear advice. Personal representation.",
        "John handles your case from beginning to end, explaining what to expect, preparing every detail and advocating for you personally in court. The solicitor you instruct is the solicitor who knows your case — and the one standing beside you when it matters most.",
      ],
    },
  ],
};

export type CareerBandContent = {
  eyebrow: string;
  milestones: Milestone[];
};

export const careerBandDefaults: CareerBandContent = {
  eyebrow: "Twenty years to this point",
  milestones: [
    { year: "2001", title: "LLB (Hons), University of Bristol" },
    { year: "2002", title: "Legal Practice Course, UWE Bristol" },
    { year: "2003", title: "Training contract" },
    { year: "2005", title: "Admitted as a solicitor" },
    { year: "2014", title: "Qualified as a duty solicitor" },
    { year: "Today", title: "Motoring & criminal defence practice" },
  ],
};

// ---------------------------------------------------------------------------
// Shared — process and the closing call to action
// ---------------------------------------------------------------------------

export type ProcessContent = SectionHeading & {
  steps: TitledCard[];
};

export const processDefaults: ProcessContent = {
  eyebrow: "What happens next",
  headline: ["Less uncertainty."],
  headlineEmphasis: ["Less stress"],
  intro: [
    "You don’t have to work it all out today.",
    "It starts with a conversation.",
  ],
  steps: [
    {
      title: "We talk.",
      body: "Start by telling me what’s happened and what’s worrying you. The first conversation is free, confidential and comes with no obligation.",
    },
    {
      title: "We make a plan.",
      body: "I’ll explain where you stand, talk you through your options and agree a clear strategy with you.",
    },
    {
      title: "I prepare.",
      body: "I examine the evidence, identify the issues and prepare your case thoroughly, keeping you informed and ready at every stage.",
    },
    {
      title: "I stand beside you.",
      body: "The solicitor who advises you is the solicitor who prepares your case and represents you in court. One point of contact. Personal representation from start to finish.",
    },
  ],
};

export type CtaContent = {
  eyebrow: string;
  badge: string;
  headline: string[];
  headlineEmphasis: string[];
  body: string[];
  ctaLabel: string;
  footerLeft: string;
  footerRight: string;
};

export const ctaDefaults: CtaContent = {
  eyebrow: "Your next step",
  badge: "Free initial consultation",
  headline: ["Let’s take the"],
  headlineEmphasis: ["next step. Together."],
  body: [
    "You don’t need all the answers.",
    "Just start with what’s happened.",
  ],
  ctaLabel: "Book a free consultation",
  footerLeft: "John Violaris · Criminal Defence Solicitor",
  footerRight: "England & Wales",
};

// ---------------------------------------------------------------------------
// Police station
// ---------------------------------------------------------------------------

export type PoliceStationContent = {
  eyebrow: string;
  headline: string[];
  headlineEmphasis: string[];
  body: string[];
  ctaLabel: string;
  urgentLabel: string;
  railEyebrow: string;
  railValue: string;
  railSuffix: string;
  railLabel: string;
  railLines: string[];
  railLinesEmphasis: string;
  railLocation: string;
};

export const policeStationDefaults: PoliceStationContent = {
  eyebrow: "Police station representation",
  headline: ["Interview under caution?"],
  headlineEmphasis: ["Allow me to help."],
  body: [
    "Whether you’ve been arrested or invited to attend a voluntary interview, it can be a harrowing experience. Some cases are made or broken at the interview stage. Having someone there who understands this well can put you at a significant advantage. When your police interview representative has practical experience in dealing with cases that go all the way to trial, they have the foresight to advise you comprehensively. When your ‘solicitor’ is unclear about how things could pan out, they could give you the wrong advice.",
  ],
  ctaLabel: "Help at the police station",
  urgentLabel: "Interview today? Get in touch directly",
  railEyebrow: "Experience you can turn to",
  railValue: "10,000",
  railSuffix: "+",
  railLabel: "clients represented",
  railLines: ["Calm advice.", "Careful preparation."],
  railLinesEmphasis: "A familiar face beside you.",
  railLocation: "Representing clients across England & Wales",
};

export type PoliceStationDetailContent = {
  eyebrow: string;
  headline: string[];
  headlineEmphasis: string[];
  whyHeading: string;
  whyBody: string[];
  supportHeading: string;
  support: string[];
  continuityHeading: string;
  continuityBody: string[];
  legalAidEyebrow: string;
  legalAidHeading: string;
  legalAidBody: string[];
  urgentEyebrow: string;
  urgentHeading: string;
  urgentBody: string[];
  urgentCallLabel: string;
  urgentCallFallbackLabel: string;
  urgentEmailLabel: string;
  prepLabel: string;
};

export const policeStationDetailDefaults: PoliceStationDetailContent = {
  eyebrow: "Before, during and after interview",
  headline: ["Advice at the stage"],
  headlineEmphasis: ["that shapes the case."],
  whyHeading: "Why the police station stage matters",
  whyBody: [
    "What you choose to say (or not to say) can affect the whole course of an investigation. Even if you’re desperate to give your account and dispute the allegation, sometimes it’s better to submit a carefully drafted prepared statement than to answer all questions openly. Early legal advice can influence whether you end up being charged in the first place.",
  ],
  supportHeading: "What I can do for you at the police station",
  support: [
    "Receive disclosure before the interview and ask further questions about any missing detail",
    "Advise you privately and confidentially about the allegation and your options",
    "Discuss whether it’s in your best interests to give an account or to exercise your right to silence",
    "Represent you during the interview and intervene when necessary",
    "Explain the various case disposal options and advise you about what’s likely to happen next",
  ],
  continuityHeading: "The advantage of continuity",
  continuityBody: [
    "If you’re charged and given a court date, I’ll already know what’s been said and the extent of the evidence against you. There will be no need to explain everything again to somebody new.",
  ],
  legalAidEyebrow: "Police station legal advice",
  legalAidHeading: "Usually available free of charge.",
  legalAidBody: [
    "Legal advice at a police station is normally funded through legal aid and is not means tested. I will confirm the position for your particular circumstances before attending.",
  ],
  urgentEyebrow: "Interview today?",
  urgentHeading: "Contact me as soon as you can.",
  urgentBody: [
    "Even if you’re clueless about the allegation, I can help you find out more before we attend the interview together.",
  ],
  urgentCallLabel: "Call John",
  urgentCallFallbackLabel: "Urgent contact",
  urgentEmailLabel: "Email John",
  prepLabel: "What to have ready",
};

/** The three cards beneath the police station detail. */
export type PoliceStationStagesContent = {
  cards: TitledCard[];
};

export const policeStationStagesDefaults: PoliceStationStagesContent = {
  cards: [
    {
      title: "Before the interview",
      body: "Call me to discuss the time, date and location of the interview. Even if you haven’t been told anything about the allegation, I can contact the investigating officer on your behalf to find out more.",
    },
    {
      title: "Personal support",
      body: "I will discuss your circumstances and help you to understand the situation. I can professionally support you before, during and after the interview takes place.",
    },
    {
      title: "After the interview",
      body: "I will help you understand the next steps and discuss whether you are likely to need any further representation.",
    },
  ],
};

// ---------------------------------------------------------------------------
// Fees
// ---------------------------------------------------------------------------

export type FeesPreviewContent = {
  eyebrow: string;
  headline: string[];
  headlineEmphasisLead: string;
  headlineEmphasis: string;
  body: string[];
  linkLabel: string;
  questions: Question[];
};

export const feesPreviewDefaults: FeesPreviewContent = {
  eyebrow: "Let’s be clear",
  headline: ["Good advice starts"],
  headlineEmphasisLead: "with",
  headlineEmphasis: "honesty.",
  body: [
    "Your first consultation is free. Before you instruct me, we’ll discuss the work involved and the fees, so you can make an informed decision.",
  ],
  linkLabel: "More about fees",
  questions: [
    {
      question: "Will I deal directly with John?",
      answer:
        "Yes. Personal representation is central to the practice. Your initial conversation is with John, and he will explain how he can help with your case.",
    },
    {
      question: "What should I have ready for the first conversation?",
      answer:
        "Any letters, notices or court papers you have received, along with the dates of any hearing or police interview. If you don’t have everything to hand, you can still get in touch.",
    },
    {
      question: "Can John help outside London?",
      answer:
        "John represents clients across England and Wales. Share the location of your case when you get in touch so he can discuss the arrangements with you.",
    },
    {
      question: "What if my court hearing or interview is urgent?",
      answer:
        "Make the date and urgency clear when contacting John. For an imminent hearing or interview, please call rather than waiting for an email response.",
    },
  ],
};

/**
 * The text beneath the numbered cards on the fees page. How fees are worked
 * out, not what they are: the site deliberately publishes no figures.
 *
 * The paragraphs are laid out by position: the first is the large lead beside
 * the eyebrow, the last is set apart as the closing note, and any in between
 * are ordinary text.
 */
export type FeesBodyContent = {
  eyebrow: string;
  body: string[];
};

export const feesBodyDefaults: FeesBodyContent = {
  eyebrow: "How fees work",
  body: [
    "Fees can vary for several reasons, such as the number of hearings, their location, whether your case ends up at trial, whether an expert report is needed, how complex your case is etc.",
    "Once I’ve analysed your case and understood the course that it could take, I’ll provide you with fixed preparation and representation costs for every eventuality. Whether you need me for a single appearance or multiple, you’ll know how much it will cost in advance.",
    "Payments can be staged and I will charge you considerably less than a law firm would. Plus, you’d have the advantage of working with me directly rather than several faces with limited understanding of your background and instructions.",
    "Our initial discussion about your case is free, so you have nothing to lose by booking a call with me.",
  ],
};

/** The three numbered cards opening the fees page, above that text. */
export type FeesStagesContent = {
  cards: { eyebrow: string; title: string; body: string }[];
};

export const feesStagesDefaults: FeesStagesContent = {
  cards: [
    {
      eyebrow: "01 / Initial consultation",
      title: "A conversation. Free.",
      body: "Talk through what has happened and find out how John can help. There is no obligation to instruct him.",
    },
    {
      eyebrow: "02 / Your case",
      title: "A clear scope of work.",
      body: "The work required depends on the allegation, the evidence and the stage of the case. John will discuss your individual requirements.",
    },
    {
      eyebrow: "03 / Before you instruct",
      title: "Fees discussed with you.",
      body: "Ask what is included and whether further work or hearings could affect the cost. You can make your decision with that information to hand.",
    },
  ],
};

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------

export type ContactDetailsContent = {
  eyebrow: string;
  headline: string[];
  headlineEmphasis: string[];
  emailLabel: string;
  callLabel: string;
  whatsappLabel: string;
  whatsappValue: string;
  disclaimer: string[];
};

export const contactDetailsDefaults: ContactDetailsContent = {
  eyebrow: "Start a conversation",
  headline: ["A direct line."],
  headlineEmphasis: ["A personal response."],
  emailLabel: "Email John",
  callLabel: "Call John",
  whatsappLabel: "Prefer a message?",
  whatsappValue: "WhatsApp John",
  disclaimer: [
    "Getting in touch does not create a solicitor–client relationship, and no relationship exists until John has confirmed he is able to act and the terms of business are agreed. Please do not send confidential details of your case until then.",
  ],
};

export type ContactPrepareContent = {
  eyebrow: string;
  headline: string[];
  headlineEmphasis: string[];
  listIntro: string;
  list: string[];
  listNote: string[];
  ctaLabel: string;
  urgentHeading: string;
  urgentBody: string[];
};

export const contactPrepareDefaults: ContactPrepareContent = {
  eyebrow: "Your first conversation",
  headline: ["We’ll take it"],
  headlineEmphasis: ["one step at a time."],
  listIntro: "It helps to have:",
  list: [
    "A brief outline of what happened",
    "Any letters or court papers",
    "Your hearing or interview date",
    "The location of your case",
  ],
  listNote: ["You can still get in touch if you don’t have everything yet."],
  ctaLabel: "Arrange a free consultation",
  urgentHeading: "Court tomorrow? Interview today?",
  urgentBody: [
    "Please call rather than email. Make the date and urgency clear when you get in touch.",
  ],
};

// ---------------------------------------------------------------------------
// Testimonials band
//
// The reviews themselves are imported from ReviewSolicitors and are not
// editable — see `lib/content/home.ts` and the read-only admin list. Only the
// copy framing them lives here.
// ---------------------------------------------------------------------------

export type TestimonialsIntroContent = SectionHeading & {
  linkLabel: string;
  note: string;
};

export const testimonialsIntroDefaults: TestimonialsIntroContent = {
  eyebrow: "In their words",
  headline: ["People who were"],
  headlineEmphasis: ["where you are now."],
  intro: [
    "Every case is different.",
    "What stays the same is who handles it.",
  ],
  linkLabel: "View all verified reviews",
  note: "Independently collected and published by ReviewSolicitors.",
};

// ---------------------------------------------------------------------------
// Page intros
// ---------------------------------------------------------------------------

/**
 * The blog index's opening. Kept apart from `pageIntroDefaults` because that
 * map is also the list of pages the `[page]` route renders, and `/blog` has a
 * route of its own.
 */
export const blogIntroDefaults: PageIntroContent = {
  eyebrow: "Useful information",
  title: "A little clarity.",
  emphasis: "Before we talk.",
  description:
    "Plain-English explanations of motoring law from a practising solicitor with over 20 years of criminal defence experience.",
};

/**
 * The button under the reviews page opening, which the standfirst asks the
 * visitor to use. It goes to ReviewSolicitors' own form for reviewing John, so
 * a review left through it is collected by them like every other one on the
 * page. Not in the CMS: the address is issued by ReviewSolicitors, and a typo
 * in it would break the one thing the button is for.
 */
export const leaveReviewLink = {
  label: "Leave a review",
  href: "https://www.reviewsolicitors.co.uk/review/53461/byvPZJ3nkz",
};

export const pageIntroDefaults: Record<string, PageIntroContent> = {
  about: {
    eyebrow: "About John",
    title: "Serious experience.",
    emphasis: "A personal approach.",
    description:
      "“Work doesn’t feel like work when you’re doing what you love.” — John Violaris",
  },
  services: {
    eyebrow: "Areas of practice",
    title: "Your situation.",
    emphasis: "A considered response.",
    description:
      "Motoring offences, police interviews and criminal defence. Find the support that fits what you’re facing.",
  },
  "police-station": {
    eyebrow: "Police station representation",
    title: "The first conversation",
    emphasis: "can matter the most.",
    description:
      "Allow me to assist before fatal errors irreparably damage your case.",
  },
  fees: {
    eyebrow: "Fees & consultation",
    title: "Losing your freedom is costly",
    emphasis: "saving it is priceless.",
    description:
      "You deserve expert representation without having to pay through the roof for it.",
  },
  reviews: {
    eyebrow: "Client reviews",
    title: "Verified reviews.",
    emphasis: "Independently collected.",
    description:
      "Your views are encouraged and appreciated. Please remember to leave a review!",
  },
  contact: {
    eyebrow: "Speak to John",
    title: "Tell me what’s happened.",
    emphasis: "We’ll start there.",
    description:
      "A free initial conversation, directly with John. Share your situation, your concerns and any important dates.",
  },
  cookies: {
    eyebrow: "Cookie policy",
    title: "What this site stores.",
    emphasis: "And why.",
    description:
      "Everything this site keeps in your browser, what it is for and how long it stays.",
  },
};

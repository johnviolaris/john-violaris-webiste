/**
 * Per-offence content for the individual service pages, as the site shipped
 * with it.
 *
 * No longer what the site renders: the pages are edited under Service pages in
 * the CMS. This module is the seed that filled `service_pages` and the fallback
 * served when Supabase cannot be read — the same arrangement as `services.ts`.
 * An edit to the words belongs in the CMS; one made here reaches nothing.
 *
 * Eleven offence pages are long-form: John's own pages, carried over in full
 * from the standalone `jv-*.html` files his first demo pointed at ("delivered
 * separately") and, for drink driving, from the demo's Drink Driving tab. They
 * live one to a file under `service-pages/` and are written in the markup
 * described in `service-markup.ts`. Only what belongs to the site rather than
 * the page was left out: the demo's header, footer, buttons and contact box,
 * which the site has its own versions of, and the fixed-fee boxes, because no
 * prices are published.
 *
 * The other six (drunk in charge, totting up, exceptional hardship, the
 * magistrates' court and the two crime pages) keep the shorter template:
 * the demo had no page for them.
 */

import type { FaqItem } from "@/lib/cms/faq";
import { carelessDriving } from "@/lib/content/service-pages/careless-driving";
import { dangerousDriving } from "@/lib/content/service-pages/dangerous-driving";
import { drinkDriving } from "@/lib/content/service-pages/drink-driving";
import { driverDetails } from "@/lib/content/service-pages/driver-details";
import { drugDriving } from "@/lib/content/service-pages/drug-driving";
import { failingToProvide } from "@/lib/content/service-pages/failing-to-provide";
import { failingToStop } from "@/lib/content/service-pages/failing-to-stop";
import { mobilePhone } from "@/lib/content/service-pages/mobile-phone";
import { noInsurance } from "@/lib/content/service-pages/no-insurance";
import { specialReasons } from "@/lib/content/service-pages/special-reasons";
import { speeding } from "@/lib/content/service-pages/speeding";

export type PenaltyCard = {
  /** Optional small capitals above the headline, e.g. "Mandatory on conviction". */
  kicker?: string;
  /** The headline consequence, e.g. "12-month minimum ban". */
  label: string;
  /** The qualifying note beneath it, e.g. "Mandatory on conviction". */
  note: string;
  /**
   * `risk` renders in the alert colour (a consequence to the client),
   * `note` renders in gold (a qualification or an opportunity).
   */
  tone: "risk" | "note";
};

/** A two-column row in one of the outcome tables. */
export type TableRow = {
  /** Left column: the outcome or order itself. */
  label: string;
  /** Right column: what it means for the client. */
  note: string;
};

/**
 * One section of a long-form page.
 *
 * The heading is the section's `h2` and the eyebrow the small capitals above
 * it. A section with no eyebrow carries on from the one before; one with no
 * heading is an untitled opening, left out of the contents list.
 */
export type ServiceSection = {
  eyebrow?: string;
  heading?: string;
  /** Written in the markup described in `service-markup.ts`. */
  body: string;
};

/** A hand-picked link to another page of the site. */
export type ServiceLink = {
  label: string;
  /** A site path, e.g. "/services/speeding". */
  href: string;
};

export type ServiceDetail = {
  /** Optional, reviewed questions. Missing legacy data leaves the page unchanged. */
  faqItems?: FaqItem[];
  /** Hero heading; rendered before the italic `emphasis`. */
  headline: string;
  emphasis: string;
  /** Long-form standfirst beneath the heading. */
  intro: string;
  /** The "at a glance" cards beneath the heading. */
  penalties: PenaltyCard[];
  /** Section heading for the issues list — varies by offence type. */
  issuesHeading?: string;
  issuesIntro?: string;
  /** The points John examines. Rendered as a definition list. */
  defenceIssues?: { title: string; body: string }[];
  /** What happens, in order, from the client's point of view. Not rendered. */
  process?: { title: string; body: string }[];
  /**
   * The long-form body. A page with sections renders them in place of the
   * shorter template — the legal framework line, "Clarity first" and its
   * points, the outcome tables and the shared checklist.
   */
  sections?: ServiceSection[];
  /**
   * The statement that opens a long-form page, beneath the at-a-glance cards.
   * One line of markup: bold, italic and links.
   */
  lead?: string;
  /** A highlighted box after the opening, e.g. "Already have points?". */
  alertTitle?: string;
  alertBody?: string;
  /** John in his own words, set as a pull quote after the last section. */
  quote?: string;
  quoteCite?: string;
  /** Related pages chosen for this page, in place of the group's list. */
  relatedLinks?: ServiceLink[];
  /** The closing banner's heading for this page, in place of the default. */
  ctaHeading?: string;
  ctaEmphasis?: string;
  /**
   * Rows for the outcomes table. Where an offence supplies these, the table
   * lists the court's disposal options; where it does not, the table falls
   * back to the three `penalties` cards as before.
   */
  outcomes?: TableRow[];
  /**
   * Orders the court can impose alongside the sentence. The section is only
   * rendered for offences that supply them.
   */
  ancillaryOrders?: TableRow[];
};

export const serviceDetails: Record<string, ServiceDetail> = {
  "/services/drink-driving": drinkDriving,

  "/services/drug-driving": drugDriving,

  "/services/failing-to-provide": failingToProvide,

  "/services/drunk-in-charge": {
    headline: "Drunk in charge.",
    emphasis: "A different offence, and a different answer.",
    intro:
      "Being in charge of a vehicle while over the limit is not the same offence as driving, and it does not carry the same mandatory ban. The statutory defence of no likelihood of driving is often the heart of the case.",
    penalties: [
      {
        label: "10 penalty points",
        note: "Or discretionary disqualification",
        tone: "risk",
      },
      {
        label: "Up to 3 months’ custody",
        note: "Most serious cases",
        tone: "risk",
      },
      {
        label: "Statutory defence available",
        note: "No likelihood of driving",
        tone: "note",
      },
    ],
    issuesHeading: "The issues I examine",
    issuesIntro:
      "Whether you were in charge at all, and whether you were going to drive, are both open to argument.",
    defenceIssues: [
      {
        title: "No likelihood of driving",
        body: "If you can show there was no likelihood of your driving while over the limit, a statutory defence is available. Expert evidence is often needed.",
      },
      {
        title: "Whether you were in charge",
        body: "Proximity to the vehicle, possession of the keys and your intentions are all relevant. Being near a car is not, by itself, being in charge.",
      },
      {
        title: "The reading and the procedure",
        body: "The same evidential and procedural points that arise in a driving case arise here.",
      },
      {
        title: "Avoiding disqualification",
        body: "Disqualification is discretionary rather than mandatory, so there is real scope to argue for points instead of a ban.",
      },
    ],
    process: [
      {
        title: "The first conversation",
        body: "Where you were, where the vehicle was and what you intended to do all matter. I will take a careful account.",
      },
      {
        title: "Building the defence",
        body: "Where the statutory defence is advanced, expert evidence on when you would have fallen below the limit is often central.",
      },
      {
        title: "Advising on plea",
        body: "A clear view of whether the defence is realistic, and what the sentence is likely to be if it is not.",
      },
      {
        title: "At court",
        body: "Representation at trial or in mitigation, with the focus on keeping your licence.",
      },
    ],
  },

  "/services/totting-up": {
    headline: "Twelve points.",
    emphasis: "A ban is not automatic.",
    intro:
      "When a driver accumulates 12 or more penalty points within three years, a mandatory six-month disqualification follows unless exceptional hardship is established. That is a high threshold — but it is a real one, and it is met with evidence.",
    penalties: [
      {
        label: "6-month minimum ban",
        note: "At 12 points within 3 years",
        tone: "risk",
      },
      {
        label: "Longer for repeat bans",
        note: "12 or 24 months if previously disqualified",
        tone: "risk",
      },
      {
        label: "Exceptional hardship",
        note: "Can avoid the ban entirely",
        tone: "note",
      },
    ],
    issuesHeading: "How the ban is avoided",
    issuesIntro:
      "The court must impose the ban unless it is persuaded otherwise. Persuading it is a matter of preparation.",
    defenceIssues: [
      {
        title: "Checking the points are correct",
        body: "Points wrongly recorded, or outside the three-year window, should not count. The starting position is worth verifying.",
      },
      {
        title: "Exceptional hardship",
        body: "Hardship to you alone is rarely enough. Hardship to employees, dependants and others who rely on you is where these arguments succeed.",
      },
      {
        title: "Evidence, not assertion",
        body: "The court expects documents and witnesses — employment records, accounts, medical evidence and statements from those affected.",
      },
      {
        title: "Arguments already used",
        body: "The same circumstances cannot generally be relied on twice within three years. What was said before matters.",
      },
      {
        title: "A shorter ban",
        body: "Where the ban cannot be avoided, there is scope to argue for the minimum period rather than more.",
      },
    ],
    process: [
      {
        title: "The first conversation",
        body: "I will look at your licence, the points on it and the dates, and tell you honestly whether an argument is available.",
      },
      {
        title: "Preparing the evidence",
        body: "This is the part that decides the case. Statements, financial material and supporting documents are prepared in good time.",
      },
      {
        title: "Preparing you",
        body: "You will usually give evidence yourself. We will go through what you will be asked before the day.",
      },
      {
        title: "At court",
        body: "I present the argument and examine the witnesses, with the aim of keeping you on the road.",
      },
    ],
  },

  "/services/exceptional-hardship": {
    headline: "Exceptional hardship.",
    emphasis: "What the court is really looking for.",
    intro:
      "Most exceptional hardship arguments fail, and they fail for the same reason: they describe inconvenience rather than hardship, and they are not supported by evidence. Prepared properly, the argument is a strong one.",
    penalties: [
      {
        label: "Avoids the ban if accepted",
        note: "Points remain on the licence",
        tone: "note",
      },
      {
        label: "6-month ban if refused",
        note: "Imposed the same day",
        tone: "risk",
      },
      {
        label: "Usually once in 3 years",
        note: "The same grounds cannot be repeated",
        tone: "note",
      },
    ],
    issuesHeading: "What makes an argument succeed",
    issuesIntro:
      "The test is not whether a ban would be difficult. It is whether the consequences go beyond what any driver would suffer.",
    defenceIssues: [
      {
        title: "Hardship to other people",
        body: "The most persuasive arguments show real consequences for employees, family members, patients or clients who depend on you.",
      },
      {
        title: "Loss of employment",
        body: "Losing a job is not automatically exceptional. The argument is about what follows from it, and for whom.",
      },
      {
        title: "Documented evidence",
        body: "Employment contracts, accounts, care arrangements and medical letters carry weight where assertions do not.",
      },
      {
        title: "Witnesses who attend",
        body: "An employer or dependant who comes to court and answers questions is worth a great deal more than a letter.",
      },
      {
        title: "Alternatives considered",
        body: "The court will ask whether public transport, taxis or another driver could meet the need. Have the answer ready.",
      },
    ],
    process: [
      {
        title: "An honest assessment",
        body: "I will tell you at the outset whether your circumstances are likely to meet the threshold. That is more useful than optimism.",
      },
      {
        title: "Building the case",
        body: "We identify who is affected and gather the documents and statements that demonstrate it.",
      },
      {
        title: "Preparing for questions",
        body: "You and any witnesses will be asked to justify the position. Preparation makes the difference on the day.",
      },
      {
        title: "At court",
        body: "The argument is presented in full, with the evidence to support it.",
      },
    ],
  },

  "/services/special-reasons": specialReasons,

  "/services/speeding": speeding,

  "/services/careless-driving": carelessDriving,

  "/services/dangerous-driving": dangerousDriving,

  "/services/mobile-phone": mobilePhone,

  "/services/no-insurance": noInsurance,

  "/services/failing-to-stop": failingToStop,

  "/services/driver-details": driverDetails,

  "/services/magistrates-court": {
    headline: "The magistrates’ court.",
    emphasis: "Need not be daunting.",
    intro:
      "Whether you’re suddenly produced there or have had things hanging over you for months, allow me to come and support you. I know how the court operates and how to influence proceedings in your favour.",
    penalties: [
      {
        label: "I analyse your case papers",
        note: "To help you determine your plea",
        tone: "note",
      },
      {
        label: "First appearance, trial or sentence?",
        note: "I’ll represent you throughout",
        tone: "note",
      },
      {
        label: "Case conclusion",
        note: "I’ll do everything in my power to influence your acquittal or professionally mitigate on your behalf.",
        tone: "note",
      },
    ],
    issuesHeading: "What happens in the magistrates’ court",
    issuesIntro:
      "Most people have never seen the inside of a courtroom. Walking in with an accustomed professional can take away what makes it frightening.",
    defenceIssues: [
      {
        title: "Your first appearance",
        body: "I’ll assess whether it’s possible to adjourn your case for the CPS to consider an out of court disposal. If this isn’t an option, the charge is put and a plea is taken.",
      },
      {
        title: "Plea, and the credit for it",
        body: "If you’re pleading Not Guilty, I’ll complete your pre-trial preparation form, highlighting the reasons for your plea and the witnesses required for your trial. If you are pleading Guilty, you may want to do so on your basis (facts), which is a way of preserving full credit whilst avoiding incrimination to the full facts of the prosecution’s case.",
      },
      {
        title: "Bail and conditions",
        body: "The court may impose bail conditions on you when you’re released. I can help you challenge these conditions or to vary them so that they’re no longer excessive or unworkable.",
      },
      {
        title: "Staying here or going up",
        body: "If you’re charged with an ‘either-way’ offence, it means that your trial could be heard either at the Magistrates Court or the Crown Court. I can help you decide to elect the trial venue that suits your best interests.",
      },
      {
        title: "Representation at trial",
        body: "I will expertly represent you at trial and present your defence to an excellent standard.",
      },
      {
        title: "Sentence and mitigation",
        body: "Whether you need me to mitigate on your behalf following conviction, or to argue special reasons/exceptional hardship (not to be disqualified from driving), you can rest assured that I will fight your corner for the best possible outcome.",
      },
    ],
    process: [
      {
        title: "The first conversation",
        body: "Tell me what you are charged with and when you are due at court. There is no charge for that conversation.",
      },
      {
        title: "Before the hearing",
        body: "The prosecution papers are obtained and gone through with you, so you arrive knowing what is being said and what is likely to happen.",
      },
      {
        title: "On the day",
        body: "I meet you before you go in, and I am the person who stands up for you — not a duty solicitor introduced to you in the corridor.",
      },
      {
        title: "After the hearing",
        body: "Whatever the outcome, you leave understanding what it means and what the next step is, including any appeal.",
      },
    ],
    outcomes: [
      {
        label: "Discontinuance",
        note: "The CPS have dropped the case against you.",
      },
      {
        label: "Case dismissed",
        note: "The Court has decided to dismiss the case against you.",
      },
      {
        label: "Conditional Discharge",
        note: "The Court has decided not to punish you unless you commit a further offence within a specified time.",
      },
      {
        label: "Band A fine",
        note: "A fine of half a week’s wages.",
      },
      {
        label: "Band B fine",
        note: "A fine of one week’s wages.",
      },
      {
        label: "Band C fine",
        note: "A fine of one and a half week’s wages.",
      },
      {
        label: "Band D fine",
        note: "A fine of two weeks wages.",
      },
      {
        label: "Adjournment for a Pre-Sentence Report",
        note: "The court wants to know more about you before sentencing because they’re considering imposing a community order and/or a prison sentence.",
      },
      {
        label: "Low-level Community Order",
        note: "Examples being 40-100 hours unpaid work, 1 month curfew and/or 10 rehabilitation/activity days.",
      },
      {
        label: "Medium-Level Community Order",
        note: "Examples being 100-200 hours unpaid work, 2 months curfew and/or 20 rehabilitation/activity days.",
      },
      {
        label: "High-Level Community Order",
        note: "Examples being 200-300 hours unpaid work, 3 months curfew and/or 30 rehabilitation/activity days.",
      },
      {
        label: "Suspended Sentence",
        note: "A prison sentence for a specified length that you only have to serve if convicted of another offence within a specified time.",
      },
      {
        label: "Immediate Custody",
        note: "A prison sentence that’s immediate. The length being limited to a maximum of 12 months if sentenced at the Magistrates Court.",
      },
      {
        label: "Committal for Sentence",
        note: "Your case is too serious to be sentenced at the Magistrates Court and needs to be adjourned for sentence at the Crown Court.",
      },
    ],
    ancillaryOrders: [
      {
        label: "Victim Surcharge",
        note: "45% of the fine you receive. Payable in addition to the fine. Community orders and prison sentences also attract a victim surcharge.",
      },
      {
        label: "Interim Driving Disqualification",
        note: "A driving ban until your next hearing.",
      },
      {
        label: "Driving Disqualification",
        note: "A driving ban for a specified time.",
      },
      {
        label: "Restraining Order",
        note: "An order that protects someone from specified behaviour, making it a criminal offence to breach the terms of the order.",
      },
      {
        label: "Criminal Behaviour Order (CBO)",
        note: "Replacing the ASBO, an order that prohibits you from behaving in a specified way.",
      },
      {
        label: "Sexual Harm Prevention Order (SHPO)",
        note: "An order that is made following conviction for a sexual offence.",
      },
      {
        label: "Stalking Protection Order (SPO)",
        note: "An order that goes further than a restraining order following conviction for a stalking related offence.",
      },
      {
        label: "Domestic Violence Protection Order",
        note: "Usually imposed by the police when they can’t prosecute someone for a domestic violence offence.",
      },
    ],
  },

  "/services/criminal-defence": {
    headline: "All crime.",
    emphasis: "Twenty years of it.",
    intro:
      "There is no crime John has not dealt with before. Alongside the motoring work, he represents people facing criminal allegations of every kind — from first arrest through to trial. The approach does not change: understand the case fully, explain it plainly, and prepare properly.",
    penalties: [
      {
        label: "Free at the police station",
        note: "Legal aid in most cases",
        tone: "note",
      },
      {
        label: "Advice before interview",
        note: "The stage that shapes everything after",
        tone: "note",
      },
      {
        label: "Representation at court",
        note: "First hearing through to trial",
        tone: "note",
      },
    ],
    issuesHeading: "How John can assist",
    issuesIntro:
      "Most people meet the criminal process once. Knowing what happens next removes a great deal of the fear attached to it.",
    defenceIssues: [
      {
        title: "At the police station",
        body: "Advice before and during interview, including whether to answer questions, give a statement or remain silent.",
      },
      {
        title: "Reviewing the evidence",
        body: "The prosecution case is obtained and examined properly before any decision on plea is taken.",
      },
      {
        title: "Advising on plea",
        body: "A frank assessment of the strength of the case and of the credit available for an early plea.",
      },
      {
        title: "Preparing for trial",
        body: "Witnesses, disclosure and any expert evidence are dealt with in good time rather than at the door of the court.",
      },
      {
        title: "Sentence",
        body: "Where conviction follows, mitigation is prepared with the supporting material that gives it weight.",
      },
    ],
    process: [
      {
        title: "The first conversation",
        body: "Tell me what has happened and what stage things have reached. There is no charge for that conversation.",
      },
      {
        title: "Understanding the case",
        body: "I obtain the evidence and go through it with you, in plain terms, before anything is decided.",
      },
      {
        title: "The decision on plea",
        body: "The choice is yours. My job is to make sure it is an informed one.",
      },
      {
        title: "At court",
        body: "Personal representation at every hearing, by the solicitor you have been speaking to throughout.",
      },
    ],
  },

  "/services/all-crime": {
    headline: "Motoring is the specialism.",
    emphasis: "It is not the limit.",
    intro:
      "Most of this practice is motoring defence, and that is deliberate. But twenty years in the criminal courts does not stop at the Road Traffic Act. Assault, dishonesty, drugs, public order — if you are facing an allegation heard in the magistrates’ court or the Crown Court, John can act, and will tell you first whether legal aid should be paying for it.",
    penalties: [
      {
        label: "Fine to custody",
        note: "The range across these offences",
        tone: "risk",
      },
      {
        label: "A criminal record",
        note: "Disclosable depending on the check",
        tone: "risk",
      },
      {
        label: "Legal aid in most cases",
        note: "Checked before you are asked to pay",
        tone: "note",
      },
    ],
    issuesHeading: "What this covers",
    issuesIntro:
      "Non-motoring work is the smaller part of the practice, and it is offered on exactly the same terms as the rest of it. These are the points worth understanding before you instruct anybody privately.",
    defenceIssues: [
      {
        title: "The offences",
        body: "Assault and public order, theft and other dishonesty, drugs, criminal damage, harassment and communications offences, and most other matters that reach the magistrates’ court or the Crown Court.",
      },
      {
        title: "Legal aid, said plainly",
        body: "A large proportion of people charged with a non-motoring offence qualify for criminal legal aid. If you are one of them, you will be told so in the first conversation. Paying privately for work the Legal Aid Agency would fund is rarely the right decision, and you will not be encouraged into it.",
      },
      {
        title: "Why clients still instruct privately",
        body: "Legal aid funds the work; it does not promise you the same solicitor at every hearing. Private instruction does — one person who has read the papers, heard your account, and will be the one standing up in court.",
      },
      {
        title: "Before any charge",
        body: "Advice at the police station is free under the legal aid scheme whatever you earn, and it is not generally means tested. You are entitled to ask for a named solicitor rather than the duty solicitor.",
      },
      {
        title: "Where the case is serious",
        body: "An either-way or indictable matter may be sent to the Crown Court. John will explain how allocation works, what it means for the case, and how representation is arranged from that point, including where counsel is instructed.",
      },
      {
        title: "Where it meets the motoring work",
        body: "Some cases carry both — a dangerous driving allegation with other charges attached, or a motoring matter arising out of a wider investigation. Those sit squarely within what this practice does already.",
      },
    ],
    process: [
      {
        title: "The first conversation",
        body: "Tell me what the allegation is and what stage it has reached. There is no charge for that conversation, and it includes a straight answer on funding.",
      },
      {
        title: "Settling the funding",
        body: "If legal aid is likely to cover you, I will explain how to apply. If it is not, or you would rather instruct privately, you have the scope of work and the fee before anything begins.",
      },
      {
        title: "Understanding the case",
        body: "The prosecution evidence is obtained and gone through with you, in plain terms, before any decision on plea is taken.",
      },
      {
        title: "At court",
        body: "Personal representation at every hearing. Where a case is sent to the Crown Court, counsel is chosen with you rather than for you.",
      },
    ],
  },
};

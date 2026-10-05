/**
 * Per-offence content for the individual service pages, as the site shipped
 * with it.
 *
 * No longer what the site renders: the pages are edited under Service pages in
 * the CMS. This module is the seed that filled `service_pages` and the fallback
 * served when Supabase cannot be read — the same arrangement as `services.ts`.
 * An edit to the words belongs in the CMS; one made here reaches nothing.
 *
 * The headline, intro and the three "at a glance" penalty cards for ten of
 * these offences come straight from the `servicePages` object in
 * `johnviolaris-DEMO_3_1 (1).html`; drink driving comes from the one fully
 * built panel in that file. The remaining five (totting up, exceptional
 * hardship, drunk in charge, criminal defence, all crime) had no panel in the
 * demo and are written to match.
 *
 * IMPORTANT — the demo pointed each offence at a standalone `jv-*.html` file
 * ("delivered separately") that is not in this repository. Those files hold the
 * full sentencing-guideline tables and long-form defence sections. Until they
 * arrive, `defenceIssues` and `process` below are the summary-level treatment.
 *
 * Every statutory reference, penalty and defence statement on this page is a
 * standard citation and MUST be confirmed by John before launch — same rule as
 * the statute strings in `services.ts`.
 */

import type { FaqItem } from "@/lib/cms/faq";

export type PenaltyCard = {
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

export type ServiceDetail = {
  /** Optional, reviewed questions. Missing legacy data leaves the page unchanged. */
  faqItems?: FaqItem[];
  /** Hero heading; rendered before the italic `emphasis`. */
  headline: string;
  emphasis: string;
  /** Long-form standfirst beneath the heading. */
  intro: string;
  /** The three "at a glance" cards beside the heading. */
  penalties: PenaltyCard[];
  /** Section heading for the issues list — varies by offence type. */
  issuesHeading: string;
  issuesIntro: string;
  /** The points John examines. Rendered as a definition list. */
  defenceIssues: { title: string; body: string }[];
  /** What happens, in order, from the client's point of view. */
  process: { title: string; body: string }[];
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
  "/services/drink-driving": {
    headline: "Driving with excess alcohol.",
    emphasis: "Specialist defence.",
    intro:
      "Being accused of drink driving is stressful and potentially life-changing. A minimum 12-month disqualification can affect your career, your family, and your independence. Before you enter a plea, speak to me.",
    penalties: [
      {
        label: "12-month minimum ban",
        note: "Mandatory on conviction",
        tone: "risk",
      },
      {
        label: "Up to 6 months’ custody",
        note: "Most serious cases",
        tone: "risk",
      },
      {
        label: "3 years minimum",
        note: "Second offence within 10 years",
        tone: "note",
      },
    ],
    issuesHeading: "The issues I examine",
    issuesIntro:
      "A drink driving charge is rarely as straightforward as the paperwork suggests. These are the areas that most often decide the outcome.",
    defenceIssues: [
      {
        title: "Evidential sufficiency",
        body: "Whether the reading relied on is admissible, correctly recorded, and capable of proving the charge to the criminal standard.",
      },
      {
        title: "Identity of the driver",
        body: "The prosecution must prove you were the person driving or attempting to drive. That is not always as clear as the file assumes.",
      },
      {
        title: "Procedural irregularities",
        body: "The statutory procedure at the roadside and at the station is prescriptive. A material departure from it can undermine the evidence.",
      },
      {
        title: "Sampling compliance",
        body: "How the specimen was taken, the device used, its calibration and the options offered to you all bear on whether the reading stands.",
      },
      {
        title: "Post-drive consumption",
        body: "Where alcohol was consumed after driving, expert evidence may show the reading does not reflect your level at the time of driving.",
      },
      {
        title: "Special reasons",
        body: "Even where the offence is admitted, circumstances such as a laced drink, a genuine emergency or a very short distance may avoid disqualification.",
      },
      {
        title: "Mitigation",
        body: "Where conviction is unavoidable, careful mitigation shapes the length of the ban, the level of fine and whether custody is in issue.",
      },
    ],
    process: [
      {
        title: "The first conversation",
        body: "Tell me what happened and what you have been given. I will explain the charge, the likely timetable and where the case may be vulnerable.",
      },
      {
        title: "Reviewing the evidence",
        body: "I obtain and examine the station procedure record, the device data and the officers’ accounts before any plea is entered.",
      },
      {
        title: "Advising on plea",
        body: "You receive a clear view of the strength of the case, the realistic outcomes, and the credit available for an early plea.",
      },
      {
        title: "At court",
        body: "I represent you at the hearing, whether that is a contested trial, a special reasons argument or a sentencing hearing.",
      },
    ],
  },

  "/services/drug-driving": {
    headline: "Drug driving.",
    emphasis: "Specialist legal defence.",
    intro:
      "Drug driving cases are more technical than they first appear. The right answer depends on the reading, the drug involved, the police procedure, and whether the charge is right.",
    penalties: [
      {
        label: "12-month minimum ban",
        note: "Mandatory on conviction",
        tone: "risk",
      },
      {
        label: "Up to 6 months’ custody",
        note: "Most serious cases",
        tone: "risk",
      },
      {
        label: "Medical defence possible",
        note: "Where the drug was lawfully prescribed",
        tone: "note",
      },
    ],
    issuesHeading: "The issues I examine",
    issuesIntro:
      "Section 5A cases turn on laboratory evidence and on procedure. Both repay close attention.",
    defenceIssues: [
      {
        title: "The specified limit",
        body: "Each controlled drug has its own limit. Whether the reading exceeds it, and by how much, shapes both the charge and the sentence.",
      },
      {
        title: "Laboratory analysis",
        body: "Continuity of the sample, storage, delay before analysis and the methodology used can all be examined.",
      },
      {
        title: "The statutory medical defence",
        body: "Where the drug was lawfully prescribed or supplied and taken in accordance with directions, a defence may be available on the evidence.",
      },
      {
        title: "Roadside and station procedure",
        body: "The preliminary drug test, the grounds for requiring a specimen and the procedure that followed are all open to scrutiny.",
      },
      {
        title: "Identity and driving",
        body: "As with any road traffic charge, the prosecution must prove who was driving and that the vehicle was on a road or public place.",
      },
      {
        title: "Special reasons and mitigation",
        body: "Where the offence is made out, there may still be argument available on disqualification and on the sentence imposed.",
      },
    ],
    process: [
      {
        title: "The first conversation",
        body: "Bring the charge sheet and anything you were given at the station. I will explain what the reading means in your case.",
      },
      {
        title: "Obtaining the analysis",
        body: "The laboratory evidence is requested and reviewed, together with the station procedure record.",
      },
      {
        title: "Advising on plea",
        body: "Whether a medical defence or a procedural challenge is realistic, and what each route is likely to mean for you.",
      },
      {
        title: "At court",
        body: "Representation at trial, at a special reasons hearing, or in mitigation at sentence.",
      },
    ],
  },

  "/services/failing-to-provide": {
    headline: "Failing to provide a specimen.",
    emphasis: "Specialist defence.",
    intro:
      "Treated almost as seriously as drink driving itself. A mandatory 12-month ban follows conviction in most cases — and the technical issues that determine guilt are often missed.",
    penalties: [
      {
        label: "12-month minimum ban",
        note: "Where driving is alleged",
        tone: "risk",
      },
      {
        label: "Up to 6 months’ custody",
        note: "Most serious cases",
        tone: "risk",
      },
      {
        label: "DR31 endorsement",
        note: "Remains on the licence for 11 years",
        tone: "note",
      },
    ],
    issuesHeading: "The issues I examine",
    issuesIntro:
      "These cases are won and lost on what was said, what was offered and whether the requirement was lawfully made.",
    defenceIssues: [
      {
        title: "Reasonable excuse",
        body: "A genuine physical or mental condition preventing you from providing can amount to a defence, but it must be supported by evidence.",
      },
      {
        title: "The lawfulness of the requirement",
        body: "The officer must have been entitled to require a specimen, and must have made the requirement properly.",
      },
      {
        title: "The statutory warning",
        body: "You must have been warned that failure to provide may render you liable to prosecution. Whether that warning was given and understood is a live issue.",
      },
      {
        title: "Whether there was in fact a failure",
        body: "Genuine attempts to provide, or a device that did not register, are not the same as a refusal.",
      },
      {
        title: "Medical evidence",
        body: "Respiratory conditions, anxiety states and needle phobia have all featured in successful arguments where properly evidenced.",
      },
      {
        title: "Driving or in charge",
        body: "The penalty differs sharply between the two. Which applies is a matter the prosecution must prove.",
      },
    ],
    process: [
      {
        title: "The first conversation",
        body: "I will want to know exactly what you were asked, what you said, and what you were told about the consequences.",
      },
      {
        title: "Gathering evidence",
        body: "Where a medical excuse is advanced, the supporting records and any expert evidence are obtained early.",
      },
      {
        title: "Advising on plea",
        body: "A realistic view of whether reasonable excuse or a procedural argument is available to you.",
      },
      {
        title: "At court",
        body: "Representation at trial or, where appropriate, at a special reasons hearing.",
      },
    ],
  },

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

  "/services/special-reasons": {
    headline: "Special reasons.",
    emphasis: "Guilty of the offence, but not the ban.",
    intro:
      "A special reasons argument allows the court to step back from mandatory disqualification even where guilt is not in dispute. Properly argued, it can keep your licence.",
    penalties: [
      {
        label: "No ban if accepted",
        note: "Disqualification avoided entirely",
        tone: "note",
      },
      {
        label: "No points if accepted",
        note: "Endorsement can also be avoided",
        tone: "note",
      },
      {
        label: "Conviction still stands",
        note: "The offence itself is not undone",
        tone: "risk",
      },
    ],
    issuesHeading: "Recognised special reasons",
    issuesIntro:
      "A special reason must relate to the offence rather than to the offender, and it must be established by evidence.",
    defenceIssues: [
      {
        title: "Laced drinks",
        body: "Where your drink was tampered with and you would not otherwise have been over the limit. Expert evidence is usually essential.",
      },
      {
        title: "Emergency",
        body: "Where driving was a genuine response to an emergency and there was no reasonable alternative available to you.",
      },
      {
        title: "Shortness of distance driven",
        body: "A very short distance, in circumstances where little or no danger arose to other road users.",
      },
      {
        title: "Misled about insurance",
        body: "In no insurance cases, a genuine and reasonable belief that valid cover was in place, induced by someone else.",
      },
      {
        title: "Being unaware of the substance",
        body: "Where a prescribed or supplied drug was taken without knowledge of its effect on driving.",
      },
    ],
    process: [
      {
        title: "The first conversation",
        body: "I will tell you whether the circumstances you describe are capable of amounting to a special reason in law.",
      },
      {
        title: "Assembling the evidence",
        body: "These arguments almost always require supporting evidence, and often expert evidence. It is obtained before the hearing.",
      },
      {
        title: "The plea",
        body: "The offence is admitted; the argument is about the consequence. That distinction is explained to you fully first.",
      },
      {
        title: "The hearing",
        body: "Evidence is called and the argument is put. The court decides whether to exercise its discretion.",
      },
    ],
  },

  "/services/speeding": {
    headline: "Caught speeding.",
    emphasis: "Know your options first.",
    intro:
      "Most speeding cases begin with a fixed penalty. But if you already have points, the stakes change completely. The totting up provisions may be triggered.",
    penalties: [
      { label: "3–6 penalty points", note: "Depending on the speed", tone: "risk" },
      { label: "Up to £2,500 fine", note: "On a motorway", tone: "risk" },
      {
        label: "6-month totting ban",
        note: "Once you reach 12 points",
        tone: "note",
      },
    ],
    issuesHeading: "The issues I examine",
    issuesIntro:
      "Before you accept a fixed penalty, it is worth knowing what can be challenged and what it would cost you not to.",
    defenceIssues: [
      {
        title: "Notice of Intended Prosecution",
        body: "A NIP must generally reach the registered keeper within 14 days. Late or defective service can be fatal to the prosecution.",
      },
      {
        title: "The device and its operator",
        body: "Type approval, calibration records and the training of the operator are all matters the prosecution must be able to prove.",
      },
      {
        title: "The speed limit itself",
        body: "Signage must comply with the regulations. An unlawfully signed limit is not enforceable.",
      },
      {
        title: "Identity of the driver",
        body: "The keeper is not always the driver, and the prosecution must prove who was behind the wheel.",
      },
      {
        title: "Your existing points",
        body: "Accepting a fixed penalty can tip you into totting up. That decision should be made with the full picture.",
      },
      {
        title: "A speed awareness course",
        body: "Where offered and eligible, a course avoids points altogether. Whether it is available is worth establishing early.",
      },
    ],
    process: [
      {
        title: "Before you respond",
        body: "Speak to me before returning any notice. The time limits are strict and the answers you give are difficult to withdraw.",
      },
      {
        title: "Reviewing the notice",
        body: "I check the service of the NIP, the alleged speed and the evidence the prosecution says it holds.",
      },
      {
        title: "Advising on your options",
        body: "Fixed penalty, course, or contest — with a clear view of what each means for your licence.",
      },
      {
        title: "At court",
        body: "Representation at trial, or an exceptional hardship argument where totting up is in play.",
      },
    ],
  },

  "/services/careless-driving": {
    headline: "Careless driving.",
    emphasis: "More serious than it looks.",
    intro:
      "Revised sentencing guidelines have raised the stakes. Discretionary bans are more common, including in first-time cases where no one was injured.",
    penalties: [
      { label: "3–9 penalty points", note: "Depending on seriousness", tone: "risk" },
      { label: "Unlimited fine", note: "Band A to C of relevant income", tone: "risk" },
      {
        label: "Discretionary ban possible",
        note: "Increasingly common on the guidelines",
        tone: "note",
      },
    ],
    issuesHeading: "The issues I examine",
    issuesIntro:
      "The standard of driving is judged against the competent and careful driver. That is a question of fact, and it is arguable.",
    defenceIssues: [
      {
        title: "Whether the standard fell below",
        body: "Momentary inattention is not automatically careless driving. The circumstances have to be examined as a whole.",
      },
      {
        title: "The account of other drivers",
        body: "Accounts given at the roadside are often incomplete or inconsistent. They repay careful testing.",
      },
      {
        title: "Road and weather conditions",
        body: "What was reasonable depends on visibility, surface, traffic and the layout of the road at the time.",
      },
      {
        title: "Mechanical failure",
        body: "A sudden and unforeseeable defect may mean the driving was not careless at all.",
      },
      {
        title: "Careless or dangerous",
        body: "Where dangerous driving is charged, arguing that the standard reaches only careless can transform the outcome.",
      },
      {
        title: "Points instead of a ban",
        body: "Where the offence is made out, the argument turns to keeping the penalty to points.",
      },
    ],
    process: [
      {
        title: "The first conversation",
        body: "Your account of the incident, and anything you have been shown, is the starting point.",
      },
      {
        title: "Reviewing the evidence",
        body: "Witness accounts, any footage, collision reports and photographs are obtained and examined.",
      },
      {
        title: "Advising on plea",
        body: "A frank view of whether the standard of driving is defensible, and of what the guidelines mean for sentence.",
      },
      {
        title: "At court",
        body: "Representation at trial or in mitigation, with disqualification the central concern.",
      },
    ],
  },

  "/services/dangerous-driving": {
    headline: "Dangerous driving.",
    emphasis: "Specialist defence at every stage.",
    intro:
      "One of the most serious motoring offences. A mandatory ban, a compulsory extended re-test, and a real risk of custody. These cases can be heard in the Crown Court as well as the magistrates’ court.",
    penalties: [
      { label: "Mandatory 12-month ban", note: "Minimum on conviction", tone: "risk" },
      { label: "Up to 2 years’ custody", note: "On indictment", tone: "risk" },
      {
        label: "Compulsory extended re-test",
        note: "Before you can drive again",
        tone: "risk",
      },
    ],
    issuesHeading: "The issues I examine",
    issuesIntro:
      "The gap between dangerous and careless driving is a question of degree, and it is where much of the work is done.",
    defenceIssues: [
      {
        title: "Far below, and obvious",
        body: "The standard must fall far below that of a competent and careful driver, and the danger must have been obvious to such a driver.",
      },
      {
        title: "Dangerous or careless",
        body: "Reducing the charge to careless driving removes the mandatory ban and the extended re-test. It is often the key objective.",
      },
      {
        title: "The evidence of danger",
        body: "Speed calculations, footage, collision investigation reports and expert evidence are all examined closely.",
      },
      {
        title: "The condition of the vehicle",
        body: "Where the allegation is based on the state of the vehicle, what you knew or ought to have known is central.",
      },
      {
        title: "Venue",
        body: "Whether the case is heard in the magistrates’ court or the Crown Court has a significant effect. That decision is taken with advice.",
      },
      {
        title: "Avoiding custody",
        body: "Where conviction follows, thorough mitigation and the right supporting material shape whether the sentence is immediate.",
      },
    ],
    process: [
      {
        title: "Early advice",
        body: "The earlier I am involved the better, particularly if you have not yet been interviewed.",
      },
      {
        title: "Reviewing the evidence",
        body: "Expert evidence is frequently needed. Collision reports and footage are obtained and independently assessed.",
      },
      {
        title: "Venue and plea",
        body: "Careful advice on where the case should be heard and on what, if anything, should be admitted.",
      },
      {
        title: "At court",
        body: "Representation throughout, in either court, from first hearing to conclusion.",
      },
    ],
  },

  "/services/mobile-phone": {
    headline: "A mobile phone offence.",
    emphasis: "Six points is not minor.",
    intro:
      "A mobile phone charge carries six penalty points. For anyone close to 12 points, or within two years of passing their test, a single fixed penalty can end your licence entirely.",
    penalties: [
      { label: "6 penalty points", note: "Mandatory endorsement", tone: "risk" },
      { label: "Up to £1,000 fine", note: "Higher for goods vehicles", tone: "risk" },
      {
        label: "Licence revoked",
        note: "If within 2 years of passing",
        tone: "risk",
      },
    ],
    issuesHeading: "The issues I examine",
    issuesIntro:
      "The law was rewritten in 2022 and is now much broader — but it is not unlimited, and the exceptions are real.",
    defenceIssues: [
      {
        title: "Whether the device was held",
        body: "The offence requires holding the device. Hands-free use, and a phone in a cradle, are treated differently.",
      },
      {
        title: "Whether you were driving",
        body: "Being stationary in traffic is still driving. Being safely parked with the engine off generally is not.",
      },
      {
        title: "The contactless payment exception",
        body: "Using a phone to make a contactless payment while stationary, for goods or services received at the same time, is excepted.",
      },
      {
        title: "The emergency call exception",
        body: "Calling 999 or 112 in a genuine emergency, where it is unsafe or impracticable to stop, is a defence.",
      },
      {
        title: "The quality of the observation",
        body: "Where the case rests on what an officer saw in passing, that observation can be tested.",
      },
      {
        title: "Totting up consequences",
        body: "If six points would take you to 12, the fixed penalty should not be accepted without advice.",
      },
    ],
    process: [
      {
        title: "Before you accept the penalty",
        body: "Speak to me first if you have any existing points. The consequence may be larger than the notice suggests.",
      },
      {
        title: "Reviewing the allegation",
        body: "What was seen, from where, and for how long. Any footage is obtained.",
      },
      {
        title: "Advising on your options",
        body: "Whether an exception applies, and what contesting the matter is likely to involve.",
      },
      {
        title: "At court",
        body: "Representation at trial, or an exceptional hardship argument if totting up is engaged.",
      },
    ],
  },

  "/services/no-insurance": {
    headline: "Driving without insurance.",
    emphasis: "Strict liability, real options.",
    intro:
      "Strict liability does not mean no options. Special reasons, a genuine belief argument, and the employee exception are all available in the right cases.",
    penalties: [
      { label: "6–8 mandatory points", note: "Or discretionary disqualification", tone: "risk" },
      { label: "Unlimited fine", note: "Means-related", tone: "risk" },
      {
        label: "Vehicle seizure",
        note: "Often at the roadside",
        tone: "risk",
      },
    ],
    issuesHeading: "The issues I examine",
    issuesIntro:
      "The offence is one of strict liability, so the work is usually directed at avoiding the endorsement rather than the conviction.",
    defenceIssues: [
      {
        title: "Whether cover in fact existed",
        body: "Policies are frequently misread by all sides. Certificates, schedules and any extension of cover are checked directly with the insurer.",
      },
      {
        title: "Driving other cars",
        body: "Whether your own policy extended to the vehicle in question is a question of the policy wording, not of assumption.",
      },
      {
        title: "The employee exception",
        body: "An employee driving in the course of employment, who neither knew nor had reason to believe there was no cover, has a statutory defence.",
      },
      {
        title: "Special reasons — misled",
        body: "Where you were genuinely and reasonably led to believe cover was in place, the court may decline to endorse.",
      },
      {
        title: "Whether you were the driver",
        body: "As with any road traffic charge, the prosecution must prove you were driving on a road or public place.",
      },
      {
        title: "Recovering the vehicle",
        body: "Where the vehicle has been seized, prompt advice on release limits the cost.",
      },
    ],
    process: [
      {
        title: "The first conversation",
        body: "Bring the policy documents and any correspondence with the insurer. They usually decide the case.",
      },
      {
        title: "Checking the position",
        body: "The insurer is approached directly for confirmation of what was and was not covered on the day.",
      },
      {
        title: "Advising on your options",
        body: "Whether a defence exists, or whether the objective should be avoiding the points by special reasons.",
      },
      {
        title: "At court",
        body: "Representation at trial or at a special reasons hearing.",
      },
    ],
  },

  "/services/failing-to-stop": {
    headline: "Failing to stop or report.",
    emphasis: "Two separate charges.",
    intro:
      "Section 170 creates two distinct offences. A driver can satisfy one duty and breach the other. Each can be defended independently.",
    penalties: [
      { label: "5–10 penalty points", note: "Per offence", tone: "risk" },
      { label: "Unlimited fine", note: "Means-related", tone: "risk" },
      {
        label: "Up to 26 weeks’ custody",
        note: "Most serious cases",
        tone: "risk",
      },
    ],
    issuesHeading: "The issues I examine",
    issuesIntro:
      "Because the duties are separate, the right analysis often narrows the case considerably.",
    defenceIssues: [
      {
        title: "Knowledge of the accident",
        body: "You cannot fail to stop for something you did not know had happened. Minor contact is frequently not felt or heard.",
      },
      {
        title: "Whether you did stop",
        body: "The duty is to stop and, if required, give particulars. Whether that duty was met is a question of fact.",
      },
      {
        title: "The duty to report",
        body: "Where particulars were not exchanged, the accident must be reported as soon as reasonably practicable and within 24 hours.",
      },
      {
        title: "Whether it was an accident within the section",
        body: "The section applies to defined categories of damage and injury. Not every incident falls within it.",
      },
      {
        title: "Identity of the driver",
        body: "Where the allegation follows from a registration number, the prosecution must still prove who was driving.",
      },
      {
        title: "Totting up risk",
        body: "The points for these offences are high, and two charges can arise from one incident.",
      },
    ],
    process: [
      {
        title: "Early advice",
        body: "If you have been asked to attend an interview, speak to me before you do.",
      },
      {
        title: "Reviewing the allegation",
        body: "The damage said to have been caused, any footage, and what was reported and when.",
      },
      {
        title: "Advising on plea",
        body: "Each charge is considered separately, because the answer to one is often not the answer to the other.",
      },
      {
        title: "At court",
        body: "Representation at trial or in mitigation.",
      },
    ],
  },

  "/services/driver-details": {
    headline: "Failing to provide driver details.",
    emphasis: "Section 172.",
    intro:
      "The penalty is often harsher than the original offence: six points for not responding to a form. Reasonable diligence is a real defence — but it needs evidence.",
    penalties: [
      { label: "6 mandatory points", note: "More than most speeding offences", tone: "risk" },
      { label: "Up to £1,000 fine", note: "Means-related", tone: "risk" },
      {
        label: "21 days to act",
        note: "Statutory declaration if convicted in absence",
        tone: "note",
      },
    ],
    issuesHeading: "The issues I examine",
    issuesIntro:
      "Most of these cases turn on whether the notice arrived and on what you did when it did.",
    defenceIssues: [
      {
        title: "Whether the notice was received",
        body: "If the notice never reached you, you cannot have failed to respond to it. Service is for the prosecution to prove.",
      },
      {
        title: "Reasonable diligence",
        body: "Where you genuinely could not identify the driver despite reasonable diligence, a statutory defence is available.",
      },
      {
        title: "What you did to find out",
        body: "The defence succeeds on evidence: records kept, enquiries made, replies received. Contemporaneous material matters.",
      },
      {
        title: "Companies and fleet keepers",
        body: "Different obligations apply to a body corporate, and the systems in place for recording drivers become central.",
      },
      {
        title: "Whether a response was in fact sent",
        body: "Proof of posting, copies and email records can answer the allegation outright.",
      },
      {
        title: "Convicted without knowing",
        body: "Where you learn of a conviction only afterwards, a statutory declaration within 21 days can reopen the case.",
      },
    ],
    process: [
      {
        title: "Act quickly",
        body: "The time limits here are short and unforgiving, particularly where a statutory declaration is needed.",
      },
      {
        title: "Reviewing the correspondence",
        body: "Every notice, envelope, reply and proof of posting is gathered. The paper trail is the case.",
      },
      {
        title: "Advising on your options",
        body: "Whether service or reasonable diligence can be argued, and what the realistic outcome is.",
      },
      {
        title: "At court",
        body: "Representation at trial, or at the hearing that follows a statutory declaration.",
      },
    ],
  },

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

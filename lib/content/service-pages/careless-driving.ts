import type { ServiceDetail } from "@/lib/content/service-detail";

/**
 * Careless Driving: the page as John wrote it, from `jv-careless-driving.html`.
 *
 * Section bodies are written in the markup described in
 * `lib/content/service-markup.ts`.
 */
export const carelessDriving: ServiceDetail = {
  headline: "Careless Driving —",
  emphasis: "More Serious Than It Looks",
  intro:
    "A careless driving charge can feel like a minor matter — a brief lapse, a small collision, a momentary distraction. But revised sentencing guidelines have raised the stakes significantly. Points, fines, and even short bans are now more common, including in first-time cases with no injury. Before you respond, speak to me.",
  penalties: [
    { label: "3 – 9 points", note: "Penalty points range", tone: "risk" },
    { label: "Unlimited fine", note: "No statutory cap on fines", tone: "risk" },
    { label: "Discretionary ban", note: "More common post-2025 guidelines", tone: "note" },
    { label: "CD10 endorsement", note: "4 years on DVLA record", tone: "note" },
  ],
  lead:
    "The test is not whether your driving was perfect. It is **whether it fell below the standard a competent and careful driver would have met in the same circumstances.** That is a fact-specific question — and on the right facts, with the right preparation, it is one that can be answered in your favour.",
  sections: [
    {
      eyebrow: "The Offence",
      heading: "What Careless Driving Actually Means",
      body: `Careless driving is an offence under **section 3 of the Road Traffic Act 1988**. The statutory test, set out in s.3ZA, is straightforward: a person drives carelessly if the way they drive *falls below what would be expected of a competent and careful driver.*

What makes this offence more complex than it appears is that the standard is objective — the court compares your driving against an ideal, not against the average driver. And because it does not require a large departure from that standard (unlike dangerous driving, which requires a departure *far below*), careless driving catches a wide range of conduct, including genuine momentary lapses and brief errors of judgement.

There are in fact two distinct offences under s.3. Most people charged will face careless driving, but inconsiderate driving is also charged in some cases and requires the prosecution to prove additional facts.

::: cards

##### The Primary Offence

#### Driving Without Due Care and Attention

Your driving must have fallen below the standard expected of a competent and careful driver. The question is whether, in the specific circumstances — road conditions, weather, traffic, visibility — a careful driver would have driven differently.

Importantly, the court may take into account not only circumstances a competent driver would be expected to know, but also **circumstances shown to have been within your own knowledge** at the time. That distinction can matter.

---

##### The Second Offence

#### Driving Without Reasonable Consideration

This requires proof that other road users were actually inconvenienced by your driving. It tends to arise from conduct that is less about momentary error and more about conscious behaviour — such as misuse of lanes, flashing lights aggressively, or unnecessary slow driving holding up traffic.

The prosecution must show the inconvenience to other road users. This can in some cases be harder to establish than a careless driving charge.

:::

### Where the Line Falls — and Why It Matters

Careless driving sits between no offence and dangerous driving on the spectrum of driving standards. **Dangerous driving** requires the driving to fall *far below* the standard and to be obviously dangerous. Careless driving requires it to fall *below* — but not necessarily far below, and not necessarily obviously.

This means cases are sometimes charged as dangerous when they should be careless, and sometimes charged as careless when the facts point to no offence at all. The classification affects the sentencing powers, the court that deals with the case, and the available defences. I look at the charge itself — not just the facts — before advising on anything.

::: note

#### Notice of Intended Prosecution — a strict time limit

Careless driving requires a Notice of Intended Prosecution (NIP). This must be served on you — or on the registered keeper of the vehicle — within **14 days of the alleged offence**. If it was not served within that period, a complete defence may be available, regardless of what the driving was like.

There are exceptions — for instance, if you were warned at the scene — so the NIP point needs careful analysis. But it is one of the first procedural checks I carry out in every case.

:::`,
    },
    {
      eyebrow: "What Gets Charged",
      heading: "Common Examples — and Why the Facts Always Matter",
      body: `The CPS and the courts have considered many scenarios that have led to careless driving charges. The following are examples of conduct that has been prosecuted — but the outcome in each case depends on the specific circumstances, not just the type of incident. **A breach of the Highway Code is evidence, but not automatic proof, of careless driving.**

::: cards

#### Driving-related conduct

- Pulling out of a junction without checking properly
- Rear-ending a vehicle due to following too closely
- Changing lanes without adequate observation
- Crossing a central white line on a bend
- Running a red light (where not deliberate)
- Failing to give way at a roundabout
- Overtaking in a restricted section
- Veering onto the wrong side of the road

---

#### Distraction and condition

- Being distracted by a phone, passenger, or map
- Eating or drinking while driving
- Driving while fatigued or unwell
- Failing to account for poor weather or visibility
- Driving at an inappropriate speed for road conditions
- Misjudging the speed of approaching vehicles
- Driving with an unsecured or distracting load

:::

In every one of these scenarios, the question is the same: would a competent and careful driver have driven differently? That depends on the full picture — the road, the conditions, the time, the visibility, the traffic, and whether the conduct that led to the charge can be explained in a way that falls within the range of what a careful driver might do in the same situation.`,
    },
    {
      eyebrow: "Penalties & Sentencing",
      heading: "What the Court Can Impose",
      body: `Careless driving is a **summary-only offence**, heard only in the Magistrates' Court. There is no power to impose a custodial sentence. The court may impose a fine, penalty points, or — increasingly — a discretionary driving ban.

::: warning

#### Important — sentencing guidelines updated July 2025

The Sentencing Council revised the careless driving guidelines with effect from **1 July 2025**. The changes tighten the culpability and harm assessment framework and, critically, introduce **Band D fines** (up to 250% of weekly income) for the most serious cases. They also make explicit that **discretionary disqualification is now a realistic outcome** in mid-range cases, not just the most serious ones.

Previous comparisons to "minor cases getting 3 points and a £100 fine" are no longer reliable. If you have been charged or summoned for a careless driving offence committed after July 2025, the sentencing framework your case will be assessed under is meaningfully more serious than it was before.

:::

### How the Court Assesses Your Case — Culpability and Harm

The court works through a two-stage assessment before reaching a sentence. First it assesses **culpability** (how responsible you were for the driving), then **harm** (what damage, injury, or risk resulted). Each is split into categories, and the combination determines the starting point and range.

| Culpability | Factors | Harm 1 (injury / serious risk) | Harm 2 (no / minor injury) |
| --- | --- | --- | --- |
| **A — High** | Driving just below dangerous; deliberate distraction (e.g. mobile phone); driving impaired by known medical condition or medication; grossly excessive speed for conditions | Band D fine<br>7–9 pts or disq. | Band C fine<br>5–6 pts or disq. |
| **B — Medium** | Momentary inattention with some fault; avoidable distraction; failing to notice something obvious; moderate speed excess for conditions | Band C fine<br>5–6 pts | Band B fine<br>4–5 pts |
| **C — Lower** | Brief lapse of concentration with no aggravating features; genuine emergency; very minor departure from the standard | Band B fine<br>3–4 pts | Band A fine<br>3 pts |

###### Band A fine: 25–75% of relevant weekly income. Band B: 75–125%. Band C: 125–175%. Band D: 175–250%. Maximum fine: unlimited (magistrates' court maximum in practice is £5,000). Source: [Sentencing Council](https://www.sentencingcouncil.org.uk), revised guidelines effective 1 July 2025.

### Aggravating and Mitigating Factors

Once the starting point is established, the court adjusts for individual aggravating and mitigating features.

::: cards

#### Factors that increase severity

- Vulnerable road user involved (cyclist, pedestrian, motorcyclist)
- High volume of traffic or pedestrians at the time
- Bad weather or poor visibility that should have prompted greater care
- Carrying passengers — particularly children
- Driving a commercial or heavy vehicle
- Previous relevant convictions
- Location — near schools, hospitals, or in a residential area
- Offence committed whilst on bail or subject to court order

---

#### Factors that reduce severity

- Genuine emergency at the time
- Very short distance over which the careless driving occurred
- Good driving record and positive character
- No injury and no damage caused
- Genuine remorse, evidenced and credible
- Timely guilty plea (reduction of up to one third)
- Driving that is only just below the required standard
- Isolated incident with no pattern of poor driving

:::`,
    },
    {
      heading: "The Wider Consequences",
      body: `::: cards

#### Employment

Driving roles, client visits, site access, and delivery work are all affected by points or a ban. A CD10 endorsement stays on your DVLA record for 4 years and is visible to employers who check licences.

---

#### Professional Registration

Doctors, nurses, pilots, and other regulated professionals may have reporting obligations following a conviction, even for a minor driving matter. The obligation varies by profession.

---

#### Travel

A conviction may require disclosure on visa applications for the US, Canada, and Australia. Worth understanding before you decide how to plead.

---

#### Insurance

Premiums typically rise following a careless driving conviction and may remain elevated for years. The endorsement is visible to insurers for 4 years from the date of offence, with disclosure often required for 5.

---

#### Totting Up Risk

If you already have points, a careless driving conviction may take you to or beyond 12, triggering a mandatory totting-up ban. That changes the stakes of this case entirely.

---

#### New Drivers

Drivers within 2 years of passing their test are subject to the new drivers' provisions. Reaching 6 points results in licence revocation and a return to provisional status.

:::`,
    },
    {
      eyebrow: "Defences & Challenges",
      heading: "Where These Cases Can Be Challenged",
      body: `Not every careless driving charge should result in a conviction. The prosecution must prove the case to the criminal standard — beyond reasonable doubt. If the evidence does not reach that threshold, you are entitled to be acquitted.

Before advising on plea, I examine the evidence carefully. That means the dashcam or CCTV footage, any witness statements, the police's account, the road layout and conditions, and the legal sufficiency of the prosecution's case. I will tell you honestly what I think the realistic outcome is — including when the evidence is strong against you — so that you can make a genuinely informed decision.

::: cards

##### Challenge to the Standard

#### Did the driving actually fall below the standard?

The prosecution must prove a departure from the standard of the competent and careful driver. In the specific circumstances of the case — road conditions, visibility, traffic, the actions of other drivers — it may be that a careful driver in the same position would have done exactly what you did. Each case turns on its individual facts.

---

##### NIP Procedural Point

#### Was a valid Notice of Intended Prosecution served?

A NIP must be served within 14 days of the alleged offence. If it was not, and no warning was given at the scene, this can be a complete defence. I check service, timing, and address details in every case involving a camera or a delayed notice.

---

##### Necessity / Duress

#### Were you compelled to drive in that way?

Necessity is a recognised defence — you need only show a genuine belief in a threat of death or serious injury, and that the manner of driving was a proportionate response. Duress, where another person compelled you to drive as you did, is also available in limited circumstances.

---

##### Mechanical Defect

#### Was the vehicle at fault rather than the driver?

If the vehicle had an unknown mechanical defect that caused or contributed to the incident — and you could not reasonably have been expected to know about it — that can be a complete defence. The defect must have been genuinely unknown and unforeseeable.

---

##### Automatism

#### Did you suffer a total loss of control?

Where a driver suffered a sudden, unexpected medical event — a seizure, a blackout, a medical emergency — that caused a total loss of control of the vehicle, and they had no reason to anticipate it, automatism may be a defence. Medical evidence is required and the test is strict.

---

##### Wrong Charge

#### Has the offence been correctly categorised?

Some incidents charged as careless driving should, on a proper analysis of the evidence, lead to no finding of criminal liability at all. Others are charged as dangerous when the facts justify only a careless charge. Identifying the right framework is an important first step.

:::

::: warning

#### Highway Code breaches — what they do and don't prove

A departure from the Highway Code is frequently cited by the prosecution as evidence of careless driving. But it is not automatically proof of the offence. The court is required to assess all the circumstances — and the Highway Code itself recognises that compliance may not always be possible.

Equally, showing compliance with the Highway Code may support your case — but it does not guarantee acquittal. The court's focus is on the specific driving, in the specific conditions, at the specific moment.

:::`,
    },
    {
      eyebrow: "How the Case Progresses",
      heading: "What Happens at Each Stage",
      body: `Careless driving cases often begin by post, without any arrest. That can make it easy to underestimate what is involved. By the time most clients contact me, they have already received a NIP or a court summons — and they want to know what happens next.

::: steps

#### Initial Police Contact — Stop, NIP, or Interview Request

The case may begin with a roadside stop, a NIP arriving by post, a request to identify the driver of a vehicle, or — in more serious cases — an invitation to a voluntary interview at the police station.

If you are asked to attend a voluntary interview, that is not a formality. It is an opportunity for the police to gather evidence and for you to make avoidable admissions. I advise at the police station and can help you prepare before any interview, including in cases where no arrest has been made.

---

#### Fixed Penalty, Driver Education, or Charge

Lower-level cases may be resolved by a fixed penalty notice (typically £100 and 3 points) or an offer to attend a driver education course. Both require careful thought before acceptance — a fixed penalty is a conviction, and if you have points already, it may trigger a totting ban.

More serious cases, or cases involving injury, collision, or aggravating features, will be sent to court by way of a summons or single justice procedure notice. If you receive one of these, contact me before you respond.

---

#### First Hearing — Magistrates' Court

The case is heard only in the Magistrates' Court. At the first hearing, you will be asked to enter a plea. If you plead guilty, sentence may follow at the same hearing. If you plead not guilty, the court will list the matter for trial and give directions about evidence — dashcam footage, witness statements, police body-worn video.

The plea decision is important. It should only be made after the evidence has been reviewed and proper advice has been given. I attend the first hearing with you and I do not advise on plea until I have seen what the prosecution is relying on.

---

#### Trial or Sentencing

At trial, I challenge the prosecution's evidence, cross-examine witnesses where necessary, and make the strongest available case on the facts and the law. The magistrates decide whether the standard of driving has been proved to the criminal standard.

At sentencing, I present your personal circumstances, driving history, and the context of the offence — including any mitigation that can reduce the sentence, bring the case within a lower category, or persuade the court away from a discretionary ban.

:::`,
    },
    {
      heading: "Possible Outcomes",
      body: `::: cards

#### Acquittal at Trial

The court finds the driving did not fall below the required standard, or the prosecution fails to prove the case to the criminal standard. No conviction, no endorsement.

---

#### No Further Action / Discontinuance

In cases where the evidence is weak, the CPS may not pursue the matter to trial. This can sometimes be achieved at an early stage by engaging with the evidence proactively.

---

#### Fixed Penalty or Driver Education

Lower-level cases may be resolved without a court appearance. The implications for your points total still need to be assessed before any offer is accepted.

---

#### Guilty Plea & Sentence

Where conviction is likely, effective mitigation can influence the number of points, the level of fine, and whether a discretionary ban is imposed. The right preparation makes a real difference.

:::`,
    },
    {
      eyebrow: "My Service",
      heading: "How I Help — Careless Driving Cases",
      body: `Every careless driving case I take on is handled by me personally. I do not pass cases to colleagues or clerks. The solicitor you speak to in consultation is the one who attends court with you.

::: steps

#### Early Advice — Before You Respond to Anything

Whether you have received a NIP, a fixed penalty offer, a summons, or an invitation to interview, the decision you make first shapes everything that follows. I give you a clear picture of your options before you commit to any course of action — including whether a fixed penalty should be accepted or whether the matter should be contested.

---

#### Police Station Representation

Where the case involves a voluntary or compelled interview, I advise you before you speak. I have attended police station interviews over 10,000 times since 2003. What is said — and what is not said — in a police interview can determine the entire shape of a case.

---

#### Full Evidence Review

I review all the evidence the prosecution is relying on — dashcam footage, CCTV, witness accounts, police officer evidence, road layout, conditions at the time, the NIP and its service. I look for both technical challenges and substantive weaknesses in the allegation before advising on plea.

---

#### Court Representation — First Hearing and Trial

I attend every hearing personally and present the strongest available case on the facts and the law. In contested cases, I cross-examine witnesses, challenge video evidence, and advance the relevant legal arguments. In guilty plea cases, I ensure the court has the full picture before it decides on sentence.

---

#### Exceptional Hardship and Special Reasons

Where a careless driving conviction would take you to 12 or more points, the totting-up provisions apply and I can prepare an exceptional hardship argument. Where the circumstances of the driving are genuinely exceptional — a real emergency, for example — a special reasons application may be available to avoid endorsement entirely.

:::`,
    },
    {
      eyebrow: "Why Instruct Me",
      heading: "Technical Knowledge. Personal Service. Plain English.",
      body: `Careless driving cases require close attention to detail — the facts, the evidence, the legal standard, the sentencing framework, and how they all fit together. The updated 2025 guidelines have made sentencing more unpredictable than it was before, and the range of outcomes in these cases — from no further action to a short ban — is wider than most clients realise.

I qualified as a solicitor in 2005 and have worked in motoring and criminal defence ever since. I have seen these cases at every level of complexity, from minor collisions dealt with by post to serious injury cases going to trial. I know the evidence that matters, the arguments that work, and the ones that don't.

My fees are fixed and stated upfront. My initial consultation is free. If you have been charged with or summoned for a careless driving offence — or if you are wondering whether to accept a fixed penalty — call me before you decide anything.`,
    },
  ],
  alertTitle: "Already have points?",
  alertBody:
    "If this conviction would take you to 12 or more, you face a totting ban — not just points and a fine. The stakes are higher than they appear. Call me before you respond to anything.",
  quote:
    "The question is not whether your driving was perfect. It is whether, in the specific circumstances, it fell below what a competent and careful driver would have done. That is a factual question — and on the right facts, it can be answered in your favour.",
  quoteCite: "John Violaris",
  relatedLinks: [
    { label: "Dangerous Driving", href: "/services/dangerous-driving" },
    { label: "Speeding & Totting Up", href: "/services/speeding" },
    { label: "Exceptional Hardship", href: "/services/exceptional-hardship" },
    { label: "Special Reasons", href: "/services/special-reasons" },
    { label: "Police Station Representation", href: "/police-station" },
    { label: "All Services", href: "/services" },
  ],
  ctaHeading: "Charged with careless driving?",
  ctaEmphasis: "Call before you respond to anything.",
};

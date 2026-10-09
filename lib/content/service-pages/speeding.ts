import type { ServiceDetail } from "@/lib/content/service-detail";

/**
 * Caught speeding: the page as John wrote it, from `jv-speeding-totting.html`.
 *
 * Section bodies are written in the markup described in
 * `lib/content/service-markup.ts`.
 */
export const speeding: ServiceDetail = {
  headline: "Caught speeding —",
  emphasis: "know your options first.",
  intro:
    "Most speeding cases begin with a fixed penalty. But some carry a real risk of disqualification — and if you already have points, the stakes change completely. Before you respond to any notice or enter a plea, get advice.",
  penalties: [
    { label: "3–6 pts", note: "Typical endorsement", tone: "risk" },
    { label: "£100–£2,500", note: "Fine range", tone: "risk" },
    { label: "7–56 days", note: "Discretionary ban", tone: "risk" },
  ],
  lead:
    "A speeding case and a totting-up case are very different problems — but they often arrive together. **The question is no longer just what you were doing, but what it means for your licence.** I advise on both at the same time, so you have a complete picture before you make any decision.",
  sections: [
    {
      eyebrow: "Totting Up",
      heading: "12 points on your licence — don't face it unprepared.",
      body: `When a speeding conviction takes you to 12 or more points within three years, you face a mandatory minimum 6-month ban — unless exceptional hardship is proved. This is a high legal test. Early, specialist advice is not optional.

::: cards

#### 6 months

Minimum totting ban

---

#### 12 months

If banned before within 3 yrs

---

#### 2 years

If two prior bans within 3 yrs

:::`,
    },
    {
      eyebrow: "The Speeding Offence",
      heading: "How Speeding Cases Work",
      body: `Speeding is an offence under the **Road Traffic Regulation Act 1984, s.89**. The prosecution must prove that you were the driver, that you exceeded the applicable speed limit, and that the limit was properly signed. In the majority of cases this is straightforward — but in others, the evidence can be challenged.

Where the police believe a fixed penalty is appropriate, most drivers will receive a **Fixed Penalty Notice** of £100 and 3 points, or an offer to attend a speed awareness course. If you are prosecuted at court, the court is guided by the Sentencing Council's sentencing bands.

::: note

#### Notice of Intended Prosecution — act carefully and quickly

If you are caught on camera, you will usually receive a **Notice of Intended Prosecution (NIP)** by post within 14 days of the alleged offence. The NIP must be sent to the registered keeper within that period to be valid — though there are exceptions.

With the NIP comes a **Section 172 notice** requiring the registered keeper to identify the driver. You must respond within 28 days. Failing to do so is itself a criminal offence carrying 6 penalty points and a fine. Even if you intend to contest the speeding charge, you must respond to the s.172 notice correctly.

If you have any doubt about how to respond, or if there is a reason why the NIP may be defective, call me before you reply.

:::`,
    },
    {
      heading: "Sentencing — Fines, Points, and Bans",
      body: `The Magistrates' Court follows the [Sentencing Council's guidelines](https://www.sentencingcouncil.org.uk) for speeding offences. Penalties are structured in three bands based on how far above the limit you were driving. These are starting points — aggravating and mitigating factors can move the sentence up or down.

| Band | Example speed in 30mph zone | Example speed in 70mph zone | Starting fine | Points / disqualification |
| --- | --- | --- | --- | --- |
| **A** | 31–40 mph | 71–90 mph | 50% of weekly income | 3 points |
| **B** | 41–50 mph | 91–100 mph | 100% of weekly income | 4–6 points or 7–28 day ban |
| **C** | 51 mph and above | 101 mph and above | 150% of weekly income | 6 points or 7–56 day ban |

###### Fines are calculated on relevant weekly income. Standard road maximum: £1,000. Motorway maximum: £2,500. Where speed is considered "grossly excessive", the court may impose a disqualification beyond 56 days. Source: [Sentencing Council](https://www.sentencingcouncil.org.uk/offences/magistrates-court/item/road-traffic-speeding/)`,
    },
    {
      heading: "Available Defences and Challenges",
      body: `There is no single magic defence to a speeding charge — and you should be wary of anyone who suggests otherwise. But there are legitimate legal arguments in the right cases, and every case deserves proper scrutiny before a plea is entered.

::: cards

##### 01 — NIP Validity

#### Was the Notice of Intended Prosecution valid?

A NIP sent to the registered keeper more than 14 days after the alleged offence is generally invalid. There are nuances — including where the vehicle was not registered to the driver, or postal service delays were not the keeper's fault — but this can be a complete defence in some cases.

---

##### 02 — Speed Measurement

#### Was the speed accurately and lawfully recorded?

Speed detection devices must be properly calibrated and operated in accordance with manufacturer guidelines and police procedures. Fixed camera evidence must be properly handled and disclosed. Errors here can undermine the prosecution's case.

---

##### 03 — Signage

#### Was the speed limit properly indicated?

The prosecution must prove the applicable limit was properly signed at the relevant location. Where signage is absent, obscured, or non-compliant with regulations, this can be a valid challenge — particularly on roads where the limit is not the national default.

---

##### 04 — Identity

#### Can the prosecution prove you were driving?

Camera evidence captures the vehicle, not always the driver. Where identification relies on admission following a s.172 notice, the chain of evidence must be properly established. Identity is a legitimate issue in some cases, particularly older offences.

---

##### 05 — Special Reasons

#### Were there exceptional circumstances?

Even where guilt is admitted, a special reasons argument can persuade the court not to endorse points. A genuine emergency — for example, rushing a seriously ill person to hospital — may qualify, though the test is strict and the circumstances must be truly exceptional.

---

##### 06 — Mitigation

#### Where conviction is likely, mitigation matters

Good character, a clean record, remorse, the circumstances of the offence, and the personal impact of a ban can all reduce the penalty. Effective mitigation is not about excuses — it is about giving the court the fullest and fairest picture of your circumstances.

:::

::: note

#### When speeding becomes a totting-up case

If the penalty points for a new speeding offence take your total to 12 or more within three years of the date of your earliest relevant offence, **you will be summoned to court** — even if the speeding itself would ordinarily be dealt with by fixed penalty.

At that hearing, the court must impose a minimum 6-month driving ban unless you can prove exceptional hardship. The section below explains that process in full.

:::`,
    },
    {
      eyebrow: "Totting Up — 12 Points",
      heading: "What Happens When You Reach 12 Points",
      body: `Under **section 35 of the Road Traffic Offenders Act 1988**, a driver who accumulates 12 or more penalty points within a three-year period is liable to a mandatory disqualification. The three-year period runs from **offence date to offence date** — not from the date points were endorsed on your licence. This distinction matters: a conviction processed months after the offence may still count.

When your points total reaches or exceeds 12, the matter is automatically referred to the Magistrates' Court. This happens even where the underlying offence would normally be dealt with by fixed penalty.

| History | Minimum totting ban |
| --- | --- |
| No disqualification of 56+ days within the previous 3 years | 6 months |
| One disqualification of 56+ days within the previous 3 years | 12 months |
| More than one disqualification of 56+ days within the previous 3 years | 2 years |

###### A totting disqualification wipes all penalty points from your licence on reinstatement. However, the same exceptional hardship grounds cannot be reused within three years, and any further offence within that period will bring you back to court in a worse position.

::: warning

#### Important — you cannot delay your way out of totting

The three-year period runs from offence date to offence date. Attempting to delay a court date so that earlier points expire will not assist you if the offences themselves fall within the relevant period.

If there is any question about which points fall within the three-year window, or whether a conviction was correctly endorsed, I review the full picture before advising on the next step.

:::`,
    },
    {
      heading: "Exceptional Hardship — the Legal Test",
      body: `The only way to avoid a mandatory totting ban is to prove **exceptional hardship** on the balance of probabilities. This is a high threshold. Every driver banned suffers hardship of some kind — the court will consider only hardship that goes meaningfully beyond the ordinary inconvenience of losing a licence.

There is no closed list of what counts as exceptional hardship. The courts assess each case on its individual facts. What matters is the **real, documented impact** on you and those who depend on you — not a general assertion that a ban would be inconvenient.

### Grounds that courts have accepted

::: cards

#### Loss of employment

Where job loss is a direct and documented consequence — particularly where alternatives such as taxis or public transport are genuinely unworkable, or where the financial impact on dependants would be severe.

---

#### Effect on employees or business

Where a business owner or key member of staff being banned would result in redundancies, business failure, or serious disruption to others who depend on that business.

---

#### Caring responsibilities

Where a dependent family member — an elderly parent, disabled child, or relative requiring regular medical appointments — relies on the driver and no adequate alternative arrangement is available.

---

#### Risk of homelessness or serious financial crisis

Where loss of employment following a ban would directly threaten the ability to meet mortgage or rental payments, placing the family home at risk.

:::

### What courts look for — and what they push back on

Magistrates hear exceptional hardship arguments regularly and are adept at testing them. A bare assertion that you will lose your job is not sufficient. The prosecution will cross-examine you on whether alternatives — public transport, taxis, a colleague driving you — are genuinely unworkable. The court will probe whether the hardship is truly exceptional or merely significant.

Evidence matters enormously. Supporting letters from employers, financial records, evidence of caring responsibilities, travel diaries showing the frequency and locations of driving — all of these make the difference between an argument that is credible and one that falls at the first challenge. You will give evidence under oath and be cross-examined.

Critically, **if you have used the same grounds for a successful exceptional hardship argument within the previous three years, you cannot rely on them again.** Different grounds must be found.`,
    },
    {
      heading: "How the Totting Hearing Works",
      body: `::: steps

#### Admit liability and register as a "totter"

At the hearing you first admit the underlying offence (or are convicted of it). The court registers that your points total reaches 12 or more, making you liable to a mandatory ban.

---

#### Present the exceptional hardship argument

Your evidence — oral and documentary — is presented to the court. This includes your account of the hardship and any supporting documents. You will take an oath and your evidence must be credible and consistent.

---

#### Cross-examination by the prosecution

The prosecution has the opportunity to challenge your evidence — typically by probing whether the hardship is truly exceptional and whether alternatives are genuinely unworkable. This stage is often the most challenging and must be anticipated in advance.

---

#### Court questions and decision

The magistrates may also question you directly. They then decide whether exceptional hardship is made out. If it is, the ban is not imposed and the points remain. If it is not, the minimum mandatory ban is imposed.

:::`,
    },
    {
      eyebrow: "The Wider Picture",
      heading: "What a Speeding Conviction or Ban Really Means",
      body: `The court's sentence is only part of the picture. For many clients, the wider consequences — to employment, insurance, professional registration, and daily life — are equally significant and deserve careful thought at the outset.

::: cards

#### Employment

Any role involving driving is directly at risk. But so are roles requiring reliability, travel, client visits, or site attendance. A ban affects more jobs than drivers initially realise.

---

#### Professional Registration

Doctors, nurses, pilots, solicitors and other regulated professionals may have reporting obligations to employers or regulators following a conviction or ban. Timing matters.

---

#### International Travel

Some countries treat motoring convictions as a visa issue. The US, Canada, and Australia have specific rules for applicants with criminal records that include road traffic offences.

---

#### Insurance

Premiums typically increase following points or a ban and can remain elevated for years. Endorsements remain on your DVLA record for 4 years from the date of offence; insurers require disclosure for 5 years.

---

#### Criminal Record

Motoring convictions are not recorded as criminal offences in most cases, but a totting disqualification and the underlying offences are visible on your DVLA record and may require disclosure depending on the context.

---

#### Family and Daily Life

School runs, caring responsibilities, medical appointments, and daily routines are disrupted by a ban in ways that are difficult to fully anticipate until it is too late to make adequate plans.

:::`,
    },
    {
      eyebrow: "My Service",
      heading: "How I Help — Speeding and Totting Cases",
      body: `::: steps

#### Early Advice — Before You Respond to Anything

Whether you have received a NIP, a s.172 notice, a single justice procedure notice, or a summons to court, early advice determines your options. I explain your position clearly and tell you whether the matter is likely to stay as a fixed penalty or become a court case — and what each route means for your points and your licence.

---

#### Full Evidence Review

I review the speed measurement evidence, device calibration records, signage, location, prior convictions, procedural steps, and the s.172 response chain. In totting cases I map your exact point history to confirm the three-year period and the mandatory ban position. Technical arguments are raised only where they have genuine merit — I will tell you honestly where the evidence is strong against you.

---

#### Exceptional Hardship Preparation

In totting cases, the exceptional hardship argument is the main event. I work with you well in advance of the hearing to identify your strongest grounds, gather the supporting evidence, and prepare you for cross-examination. I stress-test the argument before it reaches the courtroom. The prosecution will probe for weaknesses — we need to find them first.

---

#### Court Representation

I represent you at the first hearing and at any subsequent hearing. You will have one solicitor throughout — me. I am personally present in court, and everything that happens at the hearing follows from the preparation we have done together. There is no hand-off at the court door.

:::`,
    },
    {
      eyebrow: "Why Instruct Me",
      heading: "What Clients Tell Me They Value",
      body: `Clients instruct me because they want a solicitor who is personally involved, technically thorough, and easy to reach. In speeding and totting cases, the technical side — knowing the evidence required, the sentencing guideline bands, the three-year calculation, the exceptional hardship test — matters. But so does understanding what is at stake for you personally.

I have been practising criminal and motoring defence since 2005. I have represented thousands of clients at the magistrates' court, many of them in totting-up cases where a licence was everything — a job, a business, a family's stability. I know what makes an exceptional hardship argument credible and what makes it fall apart under cross-examination.

I offer a fixed fee for each stage of your case, a free initial consultation, and a direct line to me throughout. If you have received a NIP, a court summons, or you are simply close to 12 points and wondering what happens next — call me before you do anything else.`,
    },
  ],
  alertTitle: "Already at 9 points?",
  alertBody:
    "Any further endorsable offence will take you to 12 and trigger a court summons. Take advice now — before the next offence, not after.",
  quote:
    "The exceptional hardship argument is not about inconvenience. It is about the real, documented impact on you and those who depend on you — presented in a way the court can properly act on.",
  quoteCite: "John Violaris",
  relatedLinks: [
    { label: "Special Reasons Hearings", href: "/services/special-reasons" },
    { label: "Drink & Drug Driving", href: "/services/drink-driving" },
    { label: "Dangerous Driving", href: "/services/dangerous-driving" },
    { label: "Careless Driving", href: "/services/careless-driving" },
    { label: "No Insurance", href: "/services/no-insurance" },
    { label: "All Services", href: "/services" },
    { label: "Fees & Pricing", href: "/fees" },
  ],
  ctaHeading: "Close to 12 points or already summoned?",
  ctaEmphasis: "Call me before you enter a plea.",
};

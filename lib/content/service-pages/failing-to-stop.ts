import type { ServiceDetail } from "@/lib/content/service-detail";

/**
 * Failing to Stop or Report an Accident: the page as John wrote it, from `jv-failing-to-stop.html`.
 *
 * Section bodies are written in the markup described in
 * `lib/content/service-markup.ts`.
 */
export const failingToStop: ServiceDetail = {
  headline: "Failing to Stop or Report an Accident —",
  emphasis: "Two Separate Charges",
  intro:
    "Most people charged under section 170 of the Road Traffic Act 1988 do not realise they are actually facing two separate offences — failing to stop, and failing to report. Each has different elements. Each can be defended independently. Before you enter a plea, understand exactly what is being alleged against you and what your options are.",
  penalties: [
    { label: "5–10 penalty points", note: "Mandatory endorsement (AC10)", tone: "risk" },
    { label: "Unlimited fine", note: "Court discretion", tone: "risk" },
    { label: "Discretionary ban", note: "Possible in all cases", tone: "note" },
    { label: "Up to 26 weeks' custody", note: "Most serious cases", tone: "note" },
  ],
  lead:
    "Most people charged with this offence did not set out to evade the law. A split-second decision, a failure to realise damage had been caused, or a genuine belief that reporting was not needed — **the prosecution must still prove each element of each charge to the criminal standard.** That is where defence begins.",
  sections: [
    {
      eyebrow: "The Offences",
      heading: "Two Charges Under One Section — and Why the Distinction Matters",
      body: `Section 170 of the Road Traffic Act 1988 imposes a series of legal duties on drivers involved in accidents. A failure to comply can give rise to two separate criminal charges, each with distinct elements and each capable of being charged independently. Many clients do not realise they can be charged with both simultaneously — or that they may have a defence to one but not the other.

::: cards

##### s.170(2) RTA 1988 — More Serious

#### Failing to Stop

The duty to stop at the scene, remain there as necessary, and provide your name, address, vehicle registration, and insurance details to any person with reasonable grounds to ask. Failure to do so is the primary offence.

This charge carries the highest endorsement — up to 10 points — and the courts treat it more seriously because it reflects a conscious decision to leave the scene.

**Charge code: AC10**

---

##### s.170(3) RTA 1988 — Secondary Duty

#### Failing to Report

Where you stopped but could not exchange details — because no one was present, or the other party declined — you must report the accident to the police as soon as reasonably practicable and no later than **24 hours** from the time of the accident.

This is a secondary obligation triggered when the primary details-exchange requirement cannot be met. It applies even where you did stop — failure to report is a separate offence.

**Charge code: AC10**

:::

::: note

#### You can comply with one duty and fail the other

A driver who stops, tries to exchange details, but cannot find the owner of a parked vehicle has satisfied the duty to stop — but then has 24 hours to report to the police. If they fail to report, they commit only the s.170(3) offence, not s.170(2). The distinction affects the seriousness of the charge and the available sentences.

Equally, a driver who leaves the scene entirely is likely charged with both — failing to stop and failing to report — as two counts. The court can sentence on each, though will apply the totality principle when considering the overall penalty.

:::

### When the Duty Arises — What Triggers It

The duty under s.170 is triggered by an "accident" arising out of the presence of a motor vehicle on a road or public place. The definition of "accident" is broader than many clients expect, and the duty to stop applies even where the accident was not your fault.

| Situation | Duty arises? | Notes |
| --- | --- | --- |
| Collision with another vehicle causing damage | ✓ Yes | Even a minor scrape. Damage does not need to be significant. |
| Collision with a parked vehicle where no owner is present | ✓ Yes | Cannot stop exchange — must report to police within 24 hours. |
| Damage to a fence, gate, sign, or other roadside property | ✓ Yes | Property fixed to or forming part of the land adjacent to the road. |
| Injury to another person — driver, passenger, pedestrian, cyclist | ✓ Yes | Also triggers separate insurance certificate production requirement under s.170(5)–(7). |
| Injury to a horse, cattle, donkey, mule, sheep, pig, goat, or dog | ✓ Yes | Defined in s.170(8). Note: cats are not included in the statutory list. |
| No contact made, no damage caused | ✗ No | If no injury or damage occurred, no duty arises — and this can be a complete defence. |
| Accident was entirely the other party's fault | ✓ Yes | Fault is irrelevant to the duty to stop. It is triggered by involvement, not responsibility. |
| Damage only to your own vehicle | ✗ No | The duty only arises where there is damage to another's property, injury to another person, or injury to a specified animal. |

::: warning

#### The duty applies even when you didn't realise there was an accident

The courts have addressed cases where a driver claimed they were unaware of the accident. In *DPP v Pidjaheckyi*, the High Court distinguished between **awareness** and **recollection**. A driver may have been aware of a serious accident at the time without being able to recall it later — and the duty still applied. However, where an accident was genuinely so minor that no reasonable driver would have known it occurred, unawareness can be a defence.

The test is whether the accident was of a kind that would alert a careful driver to its occurrence. A very minor car park touch in busy conditions may not be; a significant impact that would clearly be felt by any driver almost certainly will be.

:::`,
    },
    {
      eyebrow: "Penalties & Sentencing",
      heading: "What the Court Can Impose",
      body: `Failing to stop or report is a **summary-only offence**, heard only in the Magistrates' Court. The Sentencing Council's guidelines assess culpability and harm across three categories. The range is wide — from a fine and 5 points at the lower end, to 26 weeks' custody and disqualification for the most serious cases.

| Category | Culpability / Harm indicators | Starting point | Range | Points / ban |
| --- | --- | --- | --- | --- |
| **Cat 1** | Deliberate leaving to avoid detection; driving involved a serious collision; injured or deceased persons involved; evidence of alcohol or drugs; previous conviction for same offence | 18 weeks' custody | High community order – 26 weeks' custody | Disqualification (consider range) *or* 7–10 points |
| **Cat 2** | Moderate culpability; some evidence of awareness of accident but chose to leave; injury occurred; significant damage to property | Medium community order | Low community order – 12 weeks' custody | Disqualification or 6–9 points |
| **Cat 3** | Low culpability; genuine belief accident was too minor to trigger the duty; panic or fear at scene; minor property damage only; no injury | Band A fine | Band A fine – Band C fine | 5–6 points; disqualification unlikely |

###### Endorsement is **mandatory** in all cases unless special reasons apply. Disqualification is **discretionary** — not mandatory. The AC10 endorsement remains on the licence for 4 years from the offence date. The fine is calculated on weekly income. Source: [Sentencing Council](https://www.sentencingcouncil.org.uk) guideline, Fail to Stop/Report Road Accident (Revised 2017).

::: warning

#### 5–10 points — the totting threshold is close

A mandatory endorsement of 5–10 points means this offence alone can bring a driver with an existing points total very close to, or over, the 12-point totting threshold. For new drivers within 2 years of passing their test, even 6 points triggers automatic licence revocation. The points range here is one of the widest in motoring law — making category assessment, and the quality of mitigation presented, genuinely consequential.

:::`,
    },
    {
      heading: "The Wider Consequences",
      body: `::: cards

#### Totting Up Risk

5–10 points may take you to 12 or beyond, triggering a mandatory totting ban. The wide range makes it vital to argue the lowest possible points category at sentencing.

---

#### New Drivers

6+ points within 2 years of passing triggers automatic licence revocation. A single s.170 conviction at the lower end of the range (6 points) can end a new driver's licence entirely.

---

#### Employment

This is a criminal conviction. DBS checks at standard and enhanced level will show it. Driving roles, public-facing roles, and roles requiring security clearance are all potentially affected.

---

#### Professional Registration

Regulated professionals — doctors, nurses, solicitors, pilots, HGV drivers — may have obligations to report this conviction to their employer or regulator. Timing and the detail of the charge matter.

---

#### Insurance

Premiums will rise on renewal, sometimes significantly. Some insurers will decline cover. The endorsement remains on the licence for 4 years; insurers typically require disclosure for 5.

---

#### International Travel

A conviction — particularly one involving custody — can affect visa applications and entry requirements for the US, Canada, Australia, and other countries.

:::`,
    },
    {
      eyebrow: "Your Legal Obligations",
      heading: "What the Law Required You to Do — in Order",
      body: `Section 170 imposes a sequence of obligations following an accident. These are not alternatives — each step is conditional on the previous one. Understanding the sequence matters for both defence and mitigation.

::: steps

#### Stop — immediately and safely

As soon as it is safe to do so after the accident, you must stop your vehicle. You must remain at the scene for as long as is necessary to comply with your information duties. Stopping momentarily and then driving away before exchanging details does not satisfy this obligation.

---

#### Provide details — to any person with reasonable grounds to request them

You must give your name, address, vehicle registration number, and — if you are not the owner — the owner's name and address. If personal injury has occurred, you must also produce your certificate of insurance or, if you cannot produce it there and then, provide your insurance details and produce the certificate at a police station within 7 days.

---

#### Report to the police — if you could not exchange details

If you stopped but could not give your details to any person — because no one was present, the other party declined, or no one was available with reasonable grounds to ask — you must report the accident to a police constable or police station as soon as reasonably practicable, and in any case within 24 hours. The 24 hours runs from the time of the accident, not from when you became aware of it.

---

#### Produce your insurance certificate — if injury occurred

Where personal injury has occurred, you must also produce your certificate of insurance. If it is not with you, produce it at a police station within 7 days. This is an additional obligation under s.170(5)–(7) and a failure to comply is a separate offence under s.170(7).

:::`,
    },
    {
      eyebrow: "Defences & Challenges",
      heading: "Where These Cases Can Be Challenged",
      body: `Despite the serious penalties, there are real defences available to charges under s.170 — and the prosecution bears the burden of proving each element to the criminal standard. Before advising on plea, I examine every element of what is alleged.

::: cards

##### Unawareness — No Knowledge of Accident

#### Did you know an accident had occurred?

For the duty to arise, the driver must have been aware (or ought to have been aware) that an accident occurred. Where the alleged incident was so minor — a very light touch, a slow-speed car park manoeuvre — that no reasonable driver would have known about it, unawareness can be a complete defence. The prosecution must prove awareness or that a careful driver would have been aware. The quality of the evidence about the nature of the impact is critical.

---

##### No Injury or Damage

#### Did any injury or damage actually occur?

The duty under s.170 is only triggered where injury or damage actually resulted from the accident. If no damage was caused to any vehicle or property, and no person or specified animal was injured, there is no legal duty to stop. The prosecution must prove that injury or damage occurred — and in low-speed or disputed cases, this is a genuine challenge. Expert evidence on vehicle damage can sometimes be relevant.

---

##### You Did Stop

#### You stopped but no one was there to receive your details

Where a driver stopped at the scene and made genuine efforts to find anyone to exchange details with, but no person with reasonable grounds was present, the s.170(2) duty may have been satisfied. The residual obligation under s.170(3) — to report within 24 hours — then applies. A driver who both stopped and reported within 24 hours has fully complied with the law.

---

##### You Reported Within 24 Hours

#### Was the report made in time?

Where a driver could not stop or could not exchange details, reporting to the police within 24 hours satisfies the s.170(3) obligation. Documentary evidence — a call log, a police report reference, or a copy of the report — can establish this. If the prosecution alleges a failure to report, but a report was in fact made within the required period, this is a complete defence to that charge.

---

##### Safety Prevented Stopping

#### Was it unsafe to stop at that location?

On a motorway or dual carriageway where stopping would create a danger, a driver may be justified in driving to the next safe stopping point. The obligation is to stop as soon as it is *safe* to do so. Where stopping at the exact point of the accident would have created genuine danger, this can address the immediate duty — though the reporting obligation then arises.

---

##### Identity — Were You Driving?

#### Can the prosecution prove you were the driver?

In cases relying on CCTV, ANPR, or dashcam footage, the prosecution must establish that the defendant was the driver of the vehicle at the relevant time. Where a vehicle is used by multiple drivers, or where identification from footage is ambiguous, this is a real challenge. I examine the identification evidence in every case before advising on plea.

:::

::: note

#### Threatening behaviour — a partial but important argument

Where a driver stopped at the scene but left because the other party became aggressive, threatening, or violent, this does not excuse the failure to stop entirely — but it is a significant mitigating factor. The obligation to report within 24 hours remains fully in place. However, where it can be shown that remaining at the scene posed a genuine safety risk, this can reduce the culpability category and influence the sentence substantially.

:::`,
    },
    {
      eyebrow: "How the Case Progresses",
      heading: "What Happens, and When",
      body: `These cases often begin with a NIP arriving days or weeks after the incident — sometimes when the driver has no recollection of the alleged accident at all. The process can feel confusing and the stakes are not always obvious at first. Here is how each stage works.

::: steps

#### Notice of Intended Prosecution

In most cases, the first you will know of the allegation is a Notice of Intended Prosecution arriving by post. The NIP must be served within 14 days of the alleged offence — if it was not, a complete defence may be available. The NIP will typically be accompanied by a s.172 notice requiring you to identify the driver.

If you believe you were insured and driving on the relevant date, respond to the s.172 notice honestly. If you cannot recall the incident, take legal advice before you respond — it may be relevant to what follows.

---

#### Charge

The charge will identify which obligation is alleged to have been breached — failing to stop (s.170(2)), failing to report (s.170(3)), or both. The specific charge matters for the defence strategy. I examine the charge carefully alongside any evidence disclosed at this stage — including CCTV, dashcam footage, witness accounts, or collision investigation notes.

---

#### First Hearing — Magistrates' Court

The case will be listed in the Magistrates' Court. You will be asked to enter a plea. The plea decision should only be made after the evidence has been disclosed and reviewed — the prosecution must serve its case, including any footage, witness statements, and police accounts, before you commit to any position.

If you are contesting the charge, the court will list the case for trial. If the evidence is strong and conviction is likely, I advise on the best plea and mitigation approach to keep the sentence at the lower end of the guidelines.

---

#### Trial or Sentencing

At trial, I challenge each element of the charge — the existence of an accident, whether damage or injury occurred, awareness, identity, and whether the relevant duty was actually breached. At sentencing, I place the offending firmly in the lowest appropriate category, present your personal circumstances in full, and make the strongest available argument on the points range and any exceptional hardship position.

:::`,
    },
    {
      heading: "Possible Outcomes",
      body: `::: cards

#### Acquittal

The charge is dismissed because the prosecution cannot prove all elements — no damage, no awareness of the accident, identity not proved, or the duty was in fact complied with. No conviction, no endorsement.

---

#### Charge Reduced — One Count Only

Where both charges are brought, it may be possible to resolve on the less serious count alone — particularly where there is evidence that the driver stopped but did not report, rather than a deliberate departure from the scene.

---

#### Guilty — Minimum Points

Where conviction is likely, securing the lowest point in the 5–10 range and arguing against any discretionary disqualification can make the difference between keeping a licence and triggering a totting ban.

---

#### Guilty — Mitigation Minimises Custody Risk

In higher-category cases where custody is a real risk, effective mitigation and the presentation of personal circumstances can secure a community order or a suspended sentence rather than immediate custody.

:::`,
    },
    {
      eyebrow: "My Service",
      heading: "How I Help — Failing to Stop and Failing to Report Cases",
      body: `These cases are rarely as simple as they first appear — on either side. The prosecution needs to prove each element, and the range of available penalties (5 points to 26 weeks' custody) means that the quality of the case presented at sentencing is genuinely consequential.

::: steps

#### Evidence Review — Footage, Witness Accounts, and Collision Evidence

I review all the prosecution evidence before advising on plea. That includes CCTV footage, dashcam footage, police body-worn video, witness statements, and any collision investigation material. In cases where unawareness or the absence of damage is argued, the quality and content of the footage can be decisive. I look at all of it.

---

#### Assessing the Specific Charges

I identify which of the two charges has been brought and assess the evidence for each separately. A defence that works for s.170(2) (failing to stop) may not apply to s.170(3) (failing to report), and vice versa. In some cases, resolving on a single charge rather than both produces a significantly better outcome — and that requires early, tactical engagement with the prosecution.

---

#### Court Representation

I attend every hearing personally. In contested cases, I cross-examine witnesses, challenge footage, and make the legal arguments that arise from the specific facts. In plea cases, I place the case firmly in the lowest appropriate sentencing category and present the strongest available personal mitigation.

---

#### Totting Up and Exceptional Hardship

Where a conviction would take you to 12 or more points, the totting provisions are engaged alongside the s.170 case. I prepare and present an exceptional hardship argument at the same hearing — so both questions are addressed properly, with full preparation for each.

:::`,
    },
    {
      eyebrow: "Why Instruct Me",
      heading: "Detail, Strategy, and Personal Service.",
      body: `Failing to stop and failing to report cases reward careful technical analysis — of the evidence, the specific charges, the sentencing framework, and the available defences. The prosecution is not always right about what happened. The footage is not always what it appears. The duty does not always arise in the way the police believe it does.

I qualified as a solicitor in 2005 and have worked in motoring and criminal defence throughout my career. I know how these cases are built and how they can be challenged. I offer fixed fees, a free initial consultation, and personal representation throughout. Call me before you enter a plea.`,
    },
  ],
  alertTitle: "Already have points?",
  alertBody:
    "5–10 points from this offence could push you to 12. The range here is wide and contested — call before you enter any plea.",
  quote:
    "Two separate charges, each with separate elements. The prosecution needs to prove all of them. That is where defence begins — not with whether you left the scene, but with what they can actually prove about what happened.",
  quoteCite: "John Violaris",
  relatedLinks: [
    { label: "Careless Driving", href: "/services/careless-driving" },
    { label: "Dangerous Driving", href: "/services/dangerous-driving" },
    { label: "Speeding & Totting Up", href: "/services/speeding" },
    { label: "Exceptional Hardship", href: "/services/exceptional-hardship" },
    { label: "All Services", href: "/services" },
    { label: "Fees", href: "/fees" },
  ],
  ctaHeading: "Charged with failing to stop or report?",
  ctaEmphasis: "Call me before you enter a plea.",
};

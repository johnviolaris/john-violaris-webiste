import type { ServiceDetail } from "@/lib/content/service-detail";

/**
 * Dangerous Driving: the page as John wrote it, from `jv-dangerous-driving.html`.
 *
 * Section bodies are written in the markup described in
 * `lib/content/service-markup.ts`.
 */
export const dangerousDriving: ServiceDetail = {
  headline: "Dangerous Driving —",
  emphasis: "Specialist Defence at Every Stage",
  intro:
    "Dangerous driving is one of the most serious motoring offences on the statute book. It carries a mandatory ban, a compulsory extended re-test, and a real risk of custody. The case can be heard in the Crown Court as well as the magistrates' court. Before you make any decision — including whether to speak to the police — speak to me.",
  penalties: [
    { label: "Mandatory 12-month ban", note: "Minimum on conviction", tone: "risk" },
    { label: "Compulsory extended re-test", note: "Before licence is returned", tone: "risk" },
    { label: "Up to 2 years' custody", note: "Standard dangerous driving", tone: "risk" },
    { label: "Up to 5 years' custody", note: "Causing serious injury by dangerous driving", tone: "risk" },
    { label: "Life imprisonment", note: "Causing death by dangerous driving", tone: "note" },
  ],
  lead:
    "The test is not whether you were reckless or intended to cause harm. It is whether your driving **fell far below the standard of a competent and careful driver, and it would have been obvious that driving that way was dangerous.** Both elements must be proved. There is real room for challenge — but only if the case is properly examined from the start.",
  sections: [
    {
      eyebrow: "The Offence",
      heading: "What Dangerous Driving Actually Means — and Where It Sits",
      body: `Dangerous driving is an offence under **section 2 of the Road Traffic Act 1988**. The statutory definition, set out in s.2A, requires two things: first, that the driving fell **far below** what would be expected of a competent and careful driver; and second, that it would have been obvious to such a driver that driving in that way would be dangerous. Both limbs must be established.

The test is objective — what matters is not your intention or what you thought at the time, but how a hypothetical competent driver would have assessed your conduct. And critically, the definition includes not just manner of driving but also the state of the vehicle: driving a vehicle you know has a dangerous defect can also constitute dangerous driving.

::: cards

#### No Offence

Driving meets or exceeds the standard expected of a competent and careful driver in the circumstances

###### Standard met

---

#### Careless Driving

Driving falls *below* the standard — but not far below. Section 3 RTA 1988. Summary only.

###### s.3 RTA 1988

---

#### Dangerous Driving

Driving falls *far below* the standard and it would obviously be dangerous. Either-way offence.

###### s.2 RTA 1988

:::

The distinction between careless and dangerous is a question of degree. It is not always obvious, and the line is frequently disputed. Identifying which standard genuinely applies to the facts is one of the most important analytical steps in any case — because the sentencing consequences are dramatically different.

### Either-Way — Magistrates' Court or Crown Court

Dangerous driving is triable either way. That means it can be dealt with in the Magistrates' Court or sent to the Crown Court. The decision on which court hears the case is not always made at the first hearing, and it has significant implications for the sentencing powers available.

In the Magistrates' Court, the maximum custodial sentence is 6 months. If the case is sent to the Crown Court, the maximum increases to **2 years' imprisonment**. The more serious the alleged driving, the more likely the case is to be sent upward.

::: warning

#### Related offences — if someone is injured or killed

Where the dangerous driving causes injury or death, separate, more serious charges may be brought. These are different offences with significantly higher maximum sentences and are dealt with exclusively in the Crown Court in the most serious cases. You should understand from the outset which charge you face.

:::

::: cards

##### s.1A RTA 1988 · Either way

#### Causing Serious Injury by Dangerous Driving

Applies where the dangerous driving caused physical harm amounting to grievous bodily harm. A new sentencing guideline came into force on 1 July 2023.

###### Maximum 5 years' custody · Minimum 2-year disqualification · Extended re-test compulsory

---

##### s.1 RTA 1988 · Crown Court only

#### Causing Death by Dangerous Driving

The most serious road traffic offence. Triable on indictment only. The maximum sentence was increased to **life imprisonment** by the Police, Crime, Sentencing and Courts Act 2022. New guidelines in force from 1 July 2023.

###### Maximum: life imprisonment · Minimum 5-year disqualification · Extended re-test compulsory

:::`,
    },
    {
      eyebrow: "What Gets Charged",
      heading: "Conduct That May Constitute Dangerous Driving",
      body: `The following are examples of conduct the courts and the CPS have treated as potentially meeting the dangerous driving threshold. Whether any specific driving is dangerous depends on the full circumstances — speed, conditions, traffic, visibility, the road layout, and the driver's state. The CPS guidance sets out factors that courts have considered, but no single list is exhaustive.

::: cards

#### Speed and manner of driving

- Racing or competitive driving with other vehicles
- Sustained excessive speed — significantly above the limit and in context
- Aggressive, prolonged overtaking in dangerous circumstances
- Evading police by driving at speed through residential areas
- Ignoring road signs, traffic signals, or warning lines deliberately
- Driving the wrong way on a one-way road or dual carriageway

---

#### Impairment and distraction

- Driving whilst severely impaired by alcohol, drugs, or medication
- Driving when unfit — through injury, exhaustion, or illness
- Prolonged use of a handheld mobile phone while driving at speed
- Driving with a known, dangerous vehicle defect
- Failing to have adequate regard for vulnerable road users — cyclists, pedestrians, children
- Deliberately targeting or using the vehicle as a weapon

:::

::: note

#### The mobile phone point — higher culpability since 2023

The updated sentencing guidelines (in force 1 July 2023) specifically identify **prolonged use of a mobile phone** as a high culpability factor. A driver who was using a handheld device for a sustained period may be categorised at the highest level of culpability even where the driving incident itself was brief. This can push the case firmly into custody territory.

:::`,
    },
    {
      eyebrow: "Penalties & Sentencing",
      heading: "What the Court Can Impose",
      body: `Dangerous driving carries a wide sentencing range — from a community order at the lower end to 2 years' custody in the most serious cases dealt with at the Crown Court. The Sentencing Council's guidelines, substantially updated on **1 July 2023**, require the court to assess culpability and harm separately and work through a structured two-stage process.

| Culpability | Culpability A factors | Harm 1 (injury/damage caused) | Harm 2 (risk only) |
| --- | --- | --- | --- |
| **A — High** | Racing; evading police; driving whilst impaired by alcohol/drugs; prolonged mobile phone use; deliberate course of dangerous driving; aggravated by a specific vulnerable road user | 18 months' custody<br>Range: 1–2 years | 12 months' custody<br>Range: 26 weeks–18 months |
| **B — Medium** | Excessive speed for conditions; single dangerous overtake; significant distraction; driving impaired by fatigue with awareness of risk | 36 weeks' custody<br>Range: 26 weeks–18 months | Medium community order<br>Range: Low CO–26 weeks |
| **C — Lower** | Brief, one-off dangerous manoeuvre; no aggravating features; driving that falls just at the threshold | Medium community order<br>Range: Low CO–26 weeks | Low community order<br>Range: Band C fine–Low CO |

###### Sentencing Council guideline effective 1 July 2023. The offence range is community order to 2 years' custody. All convictions: **mandatory minimum 12-month disqualification** and **compulsory extended re-test**. Minimum 2-year disqualification where offender has had two or more disqualifications of 56+ days within the previous 3 years. Where a custodial sentence is also imposed, the disqualification period must be extended by one half of the custodial term under s.35A RTOA 1988. Source: [Sentencing Council](https://www.sentencingcouncil.org.uk)

::: note

#### The extended re-test — what it means in practice

Unlike a standard disqualification for most other offences, a dangerous driving ban comes with a compulsory extended re-test before the licence can be returned. The extended re-test is a full driving assessment conducted by the DVSA. It is significantly longer and more demanding than the standard test. Failing it means the disqualification period effectively continues until the test is passed.

This is a consequence most clients do not anticipate — and it applies regardless of how long they have been driving, how experienced they are, or how many years they held their licence before the disqualification.

:::`,
    },
    {
      heading: "The Wider Consequences",
      body: `::: cards

#### Employment

Any role requiring driving is directly at risk, but so is employment that depends on trust, character, or security clearance. A criminal conviction for dangerous driving is a serious matter on any disclosure form.

---

#### Professional Registration

Doctors, nurses, pilots, solicitors, HGV licence holders, and others regulated by professional bodies may face separate disciplinary proceedings. The obligation to report varies by profession.

---

#### International Travel

A criminal conviction — particularly one involving custody — can bar or complicate entry to the US, Canada, Australia, and other countries. The DR10 endorsement stays on the licence for 4 years from the offence date.

---

#### Insurance

Premiums will rise substantially, and some insurers may decline cover. The endorsement is visible to insurers for 4 years from offence; disclosure may be required for longer depending on the insurer's terms.

---

#### Criminal Record

This is a criminal conviction, not just a traffic matter. It appears on standard and enhanced DBS checks and may need to be disclosed in job applications, visa forms, and professional registration declarations.

---

#### Civil Liability

If anyone was injured, property was damaged, or a collision occurred, civil claims may follow regardless of the criminal outcome. The criminal conviction can be relied upon in civil proceedings.

:::`,
    },
    {
      eyebrow: "Lines of Defence",
      heading: "Where Dangerous Driving Cases Can Be Challenged",
      body: `The prosecution must prove the case to the criminal standard — beyond reasonable doubt. That means proving not just that the driving fell far below the required standard, but also that it would have been **obvious** to a competent driver that it was dangerous. If either element cannot be proved, you are entitled to be acquitted.

Dangerous driving cases are often defended at the level of the legal standard — whether the driving genuinely crossed the threshold from careless to dangerous — but also through specific factual and procedural arguments. I look carefully at the evidence before advising on anything.

::: cards

##### Wrong Charge — Careless Not Dangerous

#### Does the driving actually meet the legal threshold?

The gap between careless and dangerous is meaningful in law. Where the driving was poor but not significantly worse than careless, the prosecution may have overcharged. In some cases it is possible to negotiate a plea to the lesser offence or run a trial on the basis that the dangerous threshold was not met. The difference in outcome is substantial.

---

##### Sudden Emergency

#### Was the driving a response to an emergency?

Where a driver was forced into dangerous-looking conduct by a sudden emergency — swerving to avoid a child, a tyre blow-out, or an unexpected hazard — the reaction may not constitute dangerous driving if it was a reasonable response in the circumstances. The key is what the driver knew and what options were available.

---

##### Medical Episode

#### Did the driver suffer a sudden, unanticipated medical event?

Where a driver suffered an unexpected medical episode — a seizure, blackout, or sudden serious illness — without any prior warning or reason to anticipate it, automatism may be a defence. Medical evidence is required and the condition must have been genuinely unforeseeable. Prior medical history is closely scrutinised.

---

##### Unknown Vehicle Defect

#### Was the vehicle at fault rather than the driver?

Where the vehicle had a mechanical defect that caused or contributed to the dangerous driving, and the driver was not aware of and could not reasonably have known about the defect, this can be a complete defence. Expert evidence on the vehicle's condition may be required.

---

##### Identity

#### Can the prosecution prove you were the driver?

Where the alleged dangerous driving was captured on camera or observed by witnesses, but there is genuine doubt about the identity of the driver, this is a legitimate challenge. The prosecution bears the burden of proving identity to the criminal standard.

---

##### Duress or Necessity

#### Were you compelled or forced to drive in that way?

Duress — where another person compelled you to drive dangerously under immediate threat — and necessity — where the driving was the only way to prevent death or serious injury — are recognised defences in limited circumstances. The facts must be specific and the threat genuinely immediate.

:::

::: note

#### The charge can be reduced — or discontinued

In some cases, particularly where the evidence on the standard of driving is marginal, it may be possible to negotiate a plea to careless driving under s.3 rather than dangerous driving under s.2. Section 24 of the Road Traffic Offenders Act 1988 also allows a magistrate or jury to return an alternative verdict of careless driving if they are not satisfied the dangerous threshold is met.

Whether that avenue is worth pursuing — and how — depends entirely on the evidence and the specific facts. It is one of the first strategic questions I consider in every case.

:::`,
    },
    {
      eyebrow: "How the Case Progresses",
      heading: "What Happens at Each Stage",
      body: `Dangerous driving cases move through the courts differently from most other motoring offences. Because it is an either-way offence, the question of which court deals with the case is itself a live issue. And because the stakes are higher — custody, an extended ban, and a re-test — getting proper legal advice at the earliest stage is not optional.

::: steps

#### Police Station — the critical starting point

You may be arrested at the scene, interviewed under caution later, or invited to attend a voluntary interview. In all of these situations, legal advice before you speak to the police is essential. What you say — and what you choose not to say — will be used in any subsequent proceedings.

I advise at the police station. I can attend in person or be available by phone. If you have been involved in a serious collision, the police may want to interview you before you have had time to think through the implications. That is precisely when having a solicitor with you matters most.

With over 10,000 police station attendances since 2003, I know this environment. I know how these interviews are conducted, what the police are looking for, and how to protect your position from the outset.

---

#### Charge and Bail

If the police decide to charge, you will be given a charge sheet identifying the specific offence — dangerous driving, causing serious injury by dangerous driving, or causing death by dangerous driving. Read it carefully and let me know immediately which offence is alleged.

You may be bailed from the station, released under investigation, or appear before a court at short notice. Bail conditions may include not driving. If conditions are imposed that are unworkable or disproportionate, I can make an application to vary them.

---

#### First Hearing — Magistrates' Court and Allocation

Your first hearing will be in the Magistrates' Court. You will be asked to indicate a plea. For dangerous driving, the court will then consider whether to keep the case or send it to the Crown Court. Where the case involves a fatality or serious injury, or where the alleged driving is at the most serious end of the spectrum, the Magistrates' Court will almost always send it to the Crown Court.

The allocation decision is important. I advise you on whether to indicate a plea at the first hearing — including the effect of an early guilty plea indication on the eventual sentence — before you say anything.

---

#### Evidence Review and Case Preparation

After the first hearing, the prosecution must disclose its evidence. I examine all of it: dashcam footage, police body-worn video, witness statements, collision investigation reports, mobile data records, vehicle inspection reports, and any medical or forensic evidence. In serious cases this can be substantial and requires careful, methodical review.

I also assess whether expert evidence — a collision investigator, a vehicle examiner, or a medical expert — is needed for the defence. Expert evidence can be decisive in dangerous driving trials where the standard of driving is in dispute.

---

#### Trial or Sentencing

In a contested case, trial takes place before magistrates or a Crown Court judge and jury. I present the defence case, challenge the prosecution's evidence, and cross-examine witnesses. Where appropriate, I call expert evidence.

At sentencing — whether following a guilty plea or conviction — I present a full picture of your personal circumstances, the context of the driving, and every mitigating factor available. In dangerous driving cases, the difference between a community order and a custodial sentence, or between a 12-month and a 3-year ban, often comes down to the quality of the mitigation presented.

:::`,
    },
    {
      heading: "Possible Outcomes",
      body: `::: cards

#### Acquittal

The prosecution fails to prove the driving met the dangerous threshold — or both the "far below" standard and the "obvious danger" elements are not established to the criminal standard. No conviction, no ban, no re-test.

---

#### Charge Reduced to Careless

Where the evidence does not support the dangerous threshold, a negotiated plea to careless driving under s.3 avoids a mandatory ban and the extended re-test, and carries significantly lighter sentencing consequences.

---

#### Discontinuance

Where the evidence is insufficient, the CPS may discontinue proceedings. This can sometimes be achieved by proactive engagement with the evidence at an early stage.

---

#### Guilty Plea and Sentencing

Where conviction is likely, a timely guilty plea reduces the sentence and careful mitigation can make a real difference to custody, the length of the ban, and the court's overall approach to the case.

:::`,
    },
    {
      eyebrow: "My Service",
      heading: "How I Help — Dangerous Driving Cases",
      body: `Dangerous driving cases are different in kind from most other motoring offences. The stakes are higher, the evidence is more complex, and the process — including the possibility of Crown Court proceedings — requires sustained, skilled preparation. I handle every case personally, from the first call to the final hearing.

::: steps

#### Police Station Representation

I advise at the police station — whether you have been arrested, are attending voluntarily, or are being interviewed after a serious collision. The police station is where the case often starts to be built against you, and it is where a well-prepared response can make the most difference. I have attended over 10,000 police station interviews since 2003.

---

#### Full Evidence Review and Strategy

I examine all the prosecution's evidence — footage, statements, reports, data — before advising on plea or strategy. I assess whether the driving genuinely meets the legal threshold for dangerous, whether there is a viable reduction to careless, and whether any specific defences are available on the facts.

---

#### Expert Evidence Coordination

In complex cases — particularly those involving serious collisions, disputed vehicle defects, or forensic questions about speed or impact — expert evidence can be the difference between conviction and acquittal. I work with experienced collision investigators, vehicle examiners, and medical experts where the case requires it.

---

#### Magistrates' and Crown Court Representation

I represent clients at both magistrates' court and Crown Court level. In magistrates' court cases I handle representation personally throughout. In Crown Court cases involving s.1 or s.1A charges, I work with experienced counsel and remain personally involved in the preparation and management of the case. You deal with me throughout.

---

#### Sentencing — Mitigation and Exceptional Hardship

In dangerous driving cases, effective mitigation is not an afterthought — it is a core part of the work. I prepare detailed written and oral mitigation covering your driving record, personal circumstances, remorse, and the consequences of custody or an extended ban. In cases where totting-up points are also in issue, I prepare and present exceptional hardship arguments in parallel.

:::`,
    },
    {
      eyebrow: "Why Instruct Me",
      heading: "Technical Knowledge. Personal Service. Present Throughout.",
      body: `Dangerous driving cases require sustained expertise — in the law, in the evidence, and in the courts. The July 2023 sentencing guidelines brought meaningful changes, including new culpability factors, updated starting points, and a sharper focus on mobile phone use and vulnerable road users. I know these guidelines and I apply them in the advice I give.

I qualified as a solicitor in 2005 and have worked in criminal defence throughout my career. I understand the Crown Court as well as the magistrates' court, and I know how to manage a case that starts at one level and escalates. More importantly, I know how to present a case — and a client — in the best possible light at every stage.

If you have been charged with dangerous driving — or if you are being investigated and have not yet been charged — call me as early as possible. The earlier I am involved, the more options are available.`,
    },
  ],
  alertTitle: "Arrested or at the Police Station?",
  alertBody:
    "Call me immediately. Do not speak to the police without legal advice. I can advise you in person or by phone before any interview begins.",
  quote:
    "The line between careless and dangerous is a question of degree — and on the right facts, it is a question that can be answered in your favour. But only if the evidence is properly examined before any decisions are made.",
  quoteCite: "John Violaris",
  relatedLinks: [
    { label: "Careless Driving", href: "/services/careless-driving" },
    { label: "Police Station Representation", href: "/police-station" },
    { label: "Drink & Drug Driving", href: "/services/drink-driving" },
    { label: "Exceptional Hardship", href: "/services/exceptional-hardship" },
    { label: "All Services", href: "/services" },
    { label: "Fees & Pricing", href: "/fees" },
  ],
  ctaHeading: "Charged with dangerous driving?",
  ctaEmphasis: "Call me before you speak to the police or enter a plea.",
};

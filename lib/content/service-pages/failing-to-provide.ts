import type { ServiceDetail } from "@/lib/content/service-detail";

/**
 * Failing to Provide a Specimen: the page as John wrote it, from `jv-failing-to-provide.html`.
 *
 * Section bodies are written in the markup described in
 * `lib/content/service-markup.ts`.
 */
export const failingToProvide: ServiceDetail = {
  headline: "Failing to Provide a Specimen —",
  emphasis: "Specialist Defence",
  intro:
    "Failing to provide a specimen is treated by the courts almost as seriously as drink driving itself. A mandatory 12-month ban follows conviction in most cases — and the technical issues that determine guilt or innocence are often missed without specialist advice.",
  penalties: [
    { label: "12-month minimum ban", note: "Driving / attempting to drive", tone: "risk" },
    { label: "Up to 6 months' custody", note: "Most serious cases", tone: "risk" },
    { label: "3 years minimum", note: "Previous conviction within 10 years", tone: "note" },
    { label: "DR31 endorsement", note: "Remains on licence 11 years", tone: "note" },
  ],
  lead:
    "These cases turn on the **warning given, the exact request made, your medical position, and the procedure the police followed.** A case that looks straightforward at first sight can have real defences — and a case that looks hopeless may have options. The only way to know is to examine the evidence properly.",
  sections: [
    {
      eyebrow: "The Offence",
      heading: "What Failing to Provide a Specimen Actually Means",
      body: `Under sections 6 and 7 of the **Road Traffic Act 1988**, it is a criminal offence to fail — or refuse — to provide a specimen of breath, blood, or urine when lawfully required to do so, without a reasonable excuse. The offence arises at two distinct stages of a police investigation, and they are not the same charge.

::: cards

#### Stage One — Roadside (s.6 RTA 1988)

###### Preliminary test · Lower penalties

A police officer can require a preliminary breath test at the roadside if they reasonably suspect you have been driving with alcohol or drugs in your system, or following an accident or moving traffic offence.

Failing to cooperate at this stage is an offence, but it carries different — and generally lower — penalties than a stage two failure: up to £1,000 fine, 4 penalty points, and a discretionary ban.

However, a roadside failure will typically lead to arrest and a further requirement at the police station — the more serious stage.

---

#### Stage Two — Police Station or Hospital (s.7 RTA 1988)

###### Evidential specimen · Mandatory ban in most cases

This is the specimen the police need to prove a drink or drug driving offence. The requirement is normally made at the police station using an approved intoximeter. If that device is unavailable or inappropriate, the officer may require blood or urine instead.

A failure at this stage — without reasonable excuse — carries the same sentencing framework as excess alcohol. If you were **driving or attempting to drive**, the court must impose a minimum 12-month ban.

The specimen can also be required at hospital after an accident, under **s.7A RTA 1988**, subject to the treating medical practitioner having no objection.

:::

::: note

#### The charge sheet matters — driving or in charge?

Whether you are alleged to have been **driving** or merely **in charge** of a vehicle makes a substantial difference to the penalties you face. In-charge cases carry lower maximum penalties, a discretionary rather than mandatory ban, and do not trigger the 3-year minimum if you have a relevant prior conviction.

The charge sheet you received from the police will state which allegation has been made. If there is any ambiguity about your status — for example, if you were stationary in the vehicle rather than driving it — this is one of the first things I examine.

:::

### The Statutory Warning — and Why It Matters

Before requiring a specimen under s.7, **a police officer must warn you that failure to provide may render you liable to prosecution.** This is a legal requirement under s.7(7) RTA 1988. If that warning was not given, or was given in inadequate terms, the requirement itself may be unlawful — and an unlawful requirement cannot give rise to a valid charge.

This is one of the procedural issues I check in every case. It is the kind of detail that is easy to overlook and straightforward to miss if you are not specifically looking for it.`,
    },
    {
      eyebrow: "Penalties & Consequences",
      heading: "What the Courts Can Impose",
      body: `The Sentencing Council's guidelines for failing to provide a specimen (drive / attempt to drive) assess culpability and harm separately. The starting point and range depend on the nature of the failure and any aggravating factors present.

| Culpability / Harm | Starting point | Sentencing range | Disqualification |
| --- | --- | --- | --- |
| **Higher** deliberate refusal with evidence of high impairment / prior relevant conviction | 12 weeks' custody | High community order – 26 weeks' custody | 29–36 months |
| **Medium** deliberate refusal but no aggravating features | Medium community order | Low community order – high community order | 17–28 months |
| **Lower** genuine inability to understand or comply; other lower culpability factors | Band B fine | Band B fine – low community order | 12–16 months |

###### All drive/attempt-to-drive cases: minimum 12-month ban. A Drink Drive Rehabilitation Course may reduce the ban by up to 25% if offered by the court. DR31 endorsement remains on the licence for **11 years** from the date of conviction. Source: [Sentencing Council](https://www.sentencingcouncil.org.uk)

::: warning

#### Previous conviction within 10 years

If you have a previous conviction for drink driving, drug driving, failing to provide, or a related alcohol or drug offence within the **10 years preceding the current offence**, the minimum disqualification increases to **3 years**. The range at the most serious level rises to up to 60 months (5 years).

This is one of the first things I check when taking instructions, because it fundamentally changes the sentencing framework that applies to your case.

:::

### In-Charge Cases — Different Rules

Where you are alleged to have been **in charge** of a vehicle rather than driving it, the sentencing range is different: a minimum of 10 penalty points (rather than a ban), a maximum fine of £2,500, up to 3 months' custody, and a **discretionary** disqualification. A 3-year minimum does not apply even with a relevant prior conviction.

The statutory defence available in drink-in-charge cases — that there was no likelihood you would have driven while over the limit — applies equally here. Where this can be argued, it can avoid any disqualification entirely.`,
    },
    {
      heading: "The Wider Consequences",
      body: `::: cards

#### Employment

Driving jobs, shift work, site access, and roles requiring reliability or security clearance are all at risk. A conviction and ban can take immediate effect on your ability to earn.

---

#### Professional Registration

Doctors, nurses, pilots, solicitors, and other regulated professionals may have reporting obligations to their employer or regulator. Timing and disclosure must be handled carefully.

---

#### International Travel

A criminal conviction can create visa complications for travel to the US, Canada, Australia, and other countries. The conviction remains on your criminal record.

---

#### Insurance

Premiums typically rise sharply and some insurers may decline cover altogether. The DR31 endorsement remains visible on your DVLA record for 11 years.

---

#### Criminal Record

This is a criminal conviction — it appears on standard and enhanced DBS checks and may require disclosure in job applications, licensing applications, and visa forms.

---

#### Future Offences

A conviction for FTP counts as a relevant prior for 10 years. Any further drink, drug, or FTP offence within that period triggers a 3-year minimum ban as a starting point.

:::`,
    },
    {
      eyebrow: "Lines of Defence",
      heading: "Where These Cases Can Be Won",
      body: `The prosecution must prove two things: that you failed to provide the specimen, and that you did so **without reasonable excuse**. If either element is not proved to the criminal standard, you are entitled to be acquitted. There are also procedural routes that can undermine the prosecution case entirely.

I do not raise arguments that have no merit. But I look carefully at every case before advising on a plea — because the defences available here are genuinely misunderstood, and clients are sometimes advised to plead guilty when they have a real argument.

::: cards

##### Reasonable Excuse — Medical

#### Physical or mental inability to provide

A reasonable excuse must arise from a physical or mental inability to provide the specimen. Medical conditions that have been accepted include asthma, other respiratory conditions, chest injuries, panic attacks, severe anxiety disorders, and needle phobia (for blood samples). The medical condition must be genuine, documented, and causally linked to the failure to provide.

---

##### Statutory Warning

#### Was the warning properly given?

The officer must warn you, before requiring the specimen, that failure to provide may render you liable to prosecution. If this warning was omitted or given inadequately, the requirement is unlawful and cannot ground a conviction. This is a point that requires careful review of the custody record and any body-worn footage.

---

##### Lawfulness of the Requirement

#### Was the officer entitled to make the request?

The officer must have a lawful basis for requiring the specimen — typically, a positive or refused roadside test, or a reasonable suspicion of driving with alcohol or drugs. If the initial stop or the basis for suspicion was unlawful, the requirement built on it may be challenged.

---

##### Device Availability / Procedure

#### Was blood or urine requested correctly?

The police can only require blood or urine at a police station if the intoximeter was unavailable, unreliable, or there was medical reason to avoid breath testing. If blood or urine was sought without meeting these preconditions, the requirement may be unlawful. The procedure for taking blood or urine must also have been properly followed.

---

##### Identity — Driving or In Charge

#### Can the prosecution prove you were driving?

For the more serious charge, the prosecution must establish that you were driving or attempting to drive — not merely in charge of the vehicle. Where you were stationary, or there is genuine doubt about whether the vehicle was being driven, this can reduce the charge to an in-charge offence with significantly lighter penalties.

---

##### Special Reasons

#### Avoiding the ban even where guilt is admitted

Where there is no full defence to the charge, a special reasons argument may still persuade the court not to impose the mandatory disqualification. The circumstances must be truly exceptional — but where they exist, this can be the difference between keeping and losing your licence.

:::

### What Counts as a Reasonable Excuse — and What Doesn't

The courts set a high threshold for reasonable excuse. Nervousness, stress, or a general dislike of needles are not sufficient. The defence requires evidence of a genuine physical or mental condition that prevented you from providing the specimen — and a causal link between that condition and the failure.

Importantly, **it is not enough simply to raise a medical issue and then refuse to try.** The courts expect that you made a genuine attempt to provide the specimen. An expert medical report is usually required to support this defence, and the prosecution may challenge it at trial.

That said, when a medical reason is raised at the time, the officer is not entitled to simply dismiss it. Where an officer failed to take a raised medical concern seriously, that itself may support the defence.

::: cards

#### Breath — may be accepted

- Asthma (diagnosed, evidenced)
- Respiratory infection or illness
- Chest injury following accident
- Severe panic or anxiety disorder
- Other documented breathing condition

---

#### Blood — may be accepted

- Needle phobia (clinical diagnosis)
- Blood clotting disorder
- Immune system condition
- Religious or cultural objection (limited circumstances)
- Medical practitioner's objection

---

#### Urine — may be accepted

- Urinary tract infection
- Prostate conditions
- Physical inability within the required hour
- Medical condition affecting urine production

:::

###### Every case is different. The above are examples only. Whether a particular condition amounts to a reasonable excuse depends on the specific facts, the supporting evidence, and how the defence is presented. A medical report from an appropriate specialist is almost always required.`,
    },
    {
      eyebrow: "How the Case Progresses",
      heading: "What Happens, and When",
      body: `One of the things clients find hardest is not knowing what comes next. I make the process feel as predictable as possible — so that at each stage, you know what is happening, what decision you face, and what it means for the stage that follows.

::: steps

#### Police Station — the starting point

The case almost always begins with a roadside stop, an accident, or a suspicion of drink or drug driving. You may be breathalysed at the roadside and then taken to the police station for an evidential specimen.

This is the stage where legal advice matters most. I can attend the police station and advise you before interview. If there is a medical condition or procedural concern, it needs to be raised at this point — not later. A well-handled police station stage can shape the entire case that follows.

I have attended police station interviews more than 10,000 times since 2003. I know this environment, and I know what can be done at this stage to protect your position.

---

#### Charge

If the police decide to charge, they will give you a charge sheet and a court date. The charge sheet identifies whether you are alleged to have been driving or in charge, and whether the failure relates to a roadside or evidential requirement. Both of these details matter — and I check them carefully.

You may be bailed from the station, or released under investigation with a charge arriving later by post. Either way, you should seek legal advice before the hearing, not on the day.

---

#### First Hearing — Magistrates' Court

Your first hearing will be at the Magistrates' Court. You will be asked to enter a plea. The decision you make here — guilty or not guilty — is one of the most consequential in the case, and it should only be made after proper advice on the evidence.

If you plead guilty, the court may sentence you at the same hearing unless it needs further information. If you plead not guilty, the court will list the case for trial and give directions for the exchange of evidence.

I attend the first hearing with you. You are not facing it alone.

---

#### Trial or Sentencing

Where the case is contested, trial takes place in the Magistrates' Court. The prosecution presents its evidence; I challenge it. Where appropriate, I call medical or expert evidence to support a reasonable excuse defence. The magistrates decide the outcome.

If the case is resolved by guilty plea, sentencing follows. I present your personal circumstances and mitigation in full — including the impact on your employment, family, and daily life — to give the court the best basis for the fairest outcome.

:::`,
    },
    {
      heading: "Possible Outcomes",
      body: `::: cards

#### Acquittal

The case is dismissed where the prosecution cannot prove the failure, where reasonable excuse is established, or where the requirement itself was unlawful. This is the best outcome and it happens more often than clients expect when the case is properly examined.

---

#### Charge Reduced to In-Charge

Where the evidence does not establish that you were driving, the charge may be reduced to being in charge of the vehicle — carrying different and less severe penalties, with no mandatory ban and no 3-year minimum on a second offence.

---

#### Special Reasons — Ban Avoided

Even where guilt is admitted, special reasons can persuade the court not to disqualify. The test is demanding, but where exceptional circumstances exist, this is a real option worth preparing carefully.

---

#### Guilty Plea with Mitigation

Where conviction is likely, a timely guilty plea reduces the sentence, and effective mitigation can influence the length of the ban and the nature of any other penalty. Sentencing in these cases is not inevitable — it is something to be managed with care.

:::`,
    },
    {
      eyebrow: "My Service",
      heading: "How I Help — From Arrest to Outcome",
      body: `Every FTP case I take on is handled personally by me. There is no paralegal, no case handler, no one else. You have one solicitor, and that solicitor knows your case from the first conversation.

::: steps

#### Police Station Representation

I can advise you before interview, at the police station, or at any point after arrest. Early advice is often decisive in these cases — particularly where a medical condition is relevant, where the procedure was irregular, or where there is genuine doubt about whether you were driving. I have been attending police station interviews since 2003, over 10,000 times.

---

#### Full Evidence Review

I examine the custody record, the wording of the requirement and the warning, body-worn footage, the intoximeter printout or laboratory paperwork, any medical records raised at the time, and the charging document. I look for procedural errors, evidential weaknesses, and the grounds for any reasonable excuse defence — before advising on plea.

---

#### Expert Evidence Coordination

Where a medical defence is arguable, expert evidence is usually required. I have working relationships with medical practitioners who can provide the precise, causally-linked opinions the court requires. A report that simply confirms a diagnosis is rarely enough — it needs to address the specific circumstances of the failure directly.

---

#### Court Representation

I represent you at the first hearing and at trial. I present the legal and factual arguments clearly and directly — without jargon — so the court understands the real position quickly. I attend every hearing personally. You deal with me throughout.

---

#### Special Reasons and Mitigation

Where the circumstances support a special reasons application — for example, where you were not aware of the significance of what was being asked, or where there was a genuine emergency — I prepare and present the argument with the care it requires. Where the focus is on sentencing, I ensure the court has the fullest picture of your personal circumstances and the impact of a ban on your life and those around you.

:::`,
    },
    {
      eyebrow: "Why Instruct Me",
      heading: "Personal Advice. Technical Depth. Plain English.",
      body: `Failing to provide cases look deceptively simple — the prosecution says you refused, you either did or you didn't. The reality is more complex. The warning, the request, the device, the procedure, the medical position, the charge itself — each one is a potential point of challenge. I look at all of them.

I qualified as a solicitor in 2005 and have worked in criminal defence ever since. I have represented thousands of clients across England and Wales at the police station and in the magistrates' court, across the full range of driving offences. I keep my fees fixed and transparent so you know what you are committing to before you instruct me.

If you have been charged with failing to provide a specimen — or if you are still at the police station stage and have not yet been charged — call me. The earlier I am involved, the more options are likely to be available.`,
    },
  ],
  alertTitle: "Still at the Police Station?",
  alertBody:
    "If you are being held and required to provide a specimen, call me immediately. Advice at this stage can determine what happens at every stage that follows.",
  quote:
    "The warning given, the wording of the request, and the procedure followed — these are the details that determine whether a charge can be defended. I examine all of them before advising on anything.",
  quoteCite: "John Violaris",
  relatedLinks: [
    { label: "Drink Driving", href: "/services/drink-driving" },
    { label: "Drug Driving", href: "/services/drug-driving" },
    { label: "Special Reasons Hearings", href: "/services/special-reasons" },
    { label: "Police Station Representation", href: "/police-station" },
    { label: "All Services", href: "/services" },
    { label: "Fees & Pricing", href: "/fees" },
  ],
  ctaHeading: "Charged with failing to provide?",
  ctaEmphasis: "Call me before you enter a plea.",
};

import type { ServiceDetail } from "@/lib/content/service-detail";

/**
 * Failing to Provide a Specimen: the page as John wrote it, from `jv-failing-to-provide.html`.
 *
 * Section bodies are written in the markup described in
 * `lib/content/service-markup.ts`.
 */
export const failingToProvide: ServiceDetail = {
  headline: "Failing to Provide a Specimen —",
  emphasis: "Even if you weren't driving",
  intro:
    "Failing to provide a specimen is treated by the courts almost as seriously as drink driving itself. A mandatory 12-month ban follows conviction in most cases — and the technical issues that determine the outcome are often missed without specialist advice.",
  penalties: [
    { label: "12-month minimum ban", note: "Driving / attempting to drive", tone: "note" },
    { label: "Up to 6 months' custody", note: "Most serious cases", tone: "note" },
    { label: "3 years minimum", note: "Previous conviction within 10 years", tone: "note" },
  ],
  lead:
    "These cases turn on the **warning given, the exact request made, your medical position, and the procedure the police followed.** A case that looks straightforward at first sight can have real deficiencies — and a case that looks hopeless may have options. The only way to know is by instructing your solicitor to examine the evidence properly.",
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

The statutory defence available in 'in-charge' cases — that there was no likelihood you would have driven while over the limit — applies equally here. Where this can be argued, you can avoid a disqualification entirely.`,
    },
    {
      eyebrow: "Lines of Defence",
      heading: "Where these cases can be won",
      body: `The prosecution must prove two things: that you failed to provide the specimen and that you did so **without a reasonable excuse**. If either element isn't proven to the criminal standard, you should be found not guilty. There are also procedural routes that can undermine the prosecution case entirely.

I look carefully at every case before advising client's on their plea. I do not raise arguments that have no merit, but the defences available here are genuinely misunderstood and frequently overlooked.

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

### Relevant Medical Conditions

::: cards

#### Breath

- Asthma (diagnosed, evidenced)
- Respiratory infection or illness
- Chest injury following accident
- Severe panic or anxiety disorder
- Other documented breathing condition

---

#### Blood

- Needle phobia (clinical diagnosis)
- Blood clotting disorder
- Immune system condition
- Religious or cultural objection (limited circumstances)
- Medical practitioner's objection

---

#### Urine

- Urinary tract infection
- Prostate conditions
- Physical inability within the required hour
- Medical condition affecting urine production

:::

###### Every case is different. The above are examples only. Whether a particular condition amounts to a reasonable excuse depends on the specific facts, the supporting evidence, and how the defence is presented. A medical report from an appropriate specialist is almost always required.`,
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

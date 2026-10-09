import type { ServiceDetail } from "@/lib/content/service-detail";

/**
 * Driving with Excess Alcohol: the page as John wrote it, from `johnviolaris-drink driving - click on drink driving tab.html (the Drink Driving tab)`.
 *
 * Section bodies are written in the markup described in
 * `lib/content/service-markup.ts`.
 */
export const drinkDriving: ServiceDetail = {
  headline: "Driving with Excess Alcohol —",
  emphasis: "Specialist Defence",
  intro:
    "Being accused of driving with excess alcohol is stressful, intimidating, and potentially life-changing. A minimum 12-month disqualification can affect your career, your family, and your independence. Before you enter a plea, speak to me.",
  penalties: [
    { kicker: "Mandatory on conviction", label: "12-month minimum ban", note: "Plus possible fine, community order or custody & criminal record", tone: "risk" },
  ],
  sections: [
    {
      body: `If your breath reading is above **35µg/100ml** (or blood above **80mg/100ml**, or urine above **108mg/100ml**), you will face a prosecution and an appearance before the Magistrates' Court. I act for motorists across England and Wales facing drink driving allegations — from first-time offenders to professionals worried about their career and licence.

Whether you want to **challenge the case**, or whether you are planning to plead guilty and need expert mitigation for your upcoming court appearance, I can help at every stage.`,
    },
    {
      heading: "How I Defend Driving With Excess Alcohol Allegations",
      body: `I provide clear, strategic advice and professional representation from the earliest stage of the investigation through to your trial or sentencing hearing. Key defence issues include:

### Evidential Sufficiency

Does the prosecution actually have the evidence required to prove the offence? There are sometimes significant holes in the police investigation that can be used to your advantage. I review every piece of evidence before advising you on how to proceed.

### Identity of the Driver

Is there admissible proof that you were *driving* or *attempting to drive*? When identity cannot be proved, the police must interview you. If they cannot establish that you drove, charges are frequently reduced to *being drunk in charge* of a vehicle — an offence where disqualification can be avoided.

### Procedural Irregularities

Errors in police procedure can render evidence unreliable or wholly inadmissible. Even errors in the way the police caution or statutory warning were administered can lead to a not guilty outcome. I know what to look for.

### Sampling Procedure Compliance

Were the legal requirements followed when taking breath, blood, or urine samples? Were you given a part of the blood sample to retain and have independently tested? Failures here can undermine the entire prosecution case.

### Reliability of the Analytical Testing

Was the evidential breath testing machine functioning correctly at the time of your test? Was the calibration certificate in order? Has the laboratory complied with accepted analytical standards? These are technical questions that can be decisive.

### Post-Drive Consumption

Did you consume alcohol *after* you stopped driving? If so, it may be possible to show that your reading at the roadside — or at the police station — would have been below the limit but for the alcohol consumed after driving. A successful post-drive consumption argument leads to an acquittal.

### Special Reasons Arguments

Even where conviction is not contested, you can avoid disqualification entirely if special reasons are established. Recognised grounds include the shortness of distance driven, an emergency situation, or consuming alcohol unknowingly — including spiked drinks. These arguments require careful preparation and, where appropriate, expert evidence.

### Considering Alternative Offences

In certain cases, a plea to *being in charge of a motor vehicle whilst over the prescribed limit* (rather than driving) may avoid a mandatory disqualification entirely. Whether this is available depends on the facts and the evidence.

### Mitigation

If conviction is unavoidable, effective mitigation can make a real difference to the length of your disqualification and the severity of any other penalty. I am experienced in communicating a client's personal circumstances to the court — including the impact on employment, dependants, and daily life — in a way that achieves the best possible outcome.`,
    },
    {
      heading: "Penalties for Driving With Excess Alcohol",
      body: `The Magistrates' Court can impose an unlimited fine, a community order, or up to 6 months' imprisonment, in addition to a mandatory driving disqualification:

- Minimum **12 months** disqualification (first offence)
- Minimum **36 months** disqualification (second offence within 10 years)
- Reduction of **up to 25%** if you complete the Drink Drive Rehabilitation Course, where offered by the court

You do not need to feel drunk to be over the limit. Factors including your build, what you have eaten, and the speed at which you consumed alcohol all affect your reading.`,
    },
    {
      heading: "Sentencing Guidelines",
      body: `The Sentencing Council publishes guidelines for magistrates. The starting point and range for your case will depend on your breath, blood, or urine reading:

| Breath (µg/100ml) | Blood (mg/100ml) | Urine (mg/100ml) | Starting Point | Range | Disqualification |
| --- | --- | --- | --- | --- | --- |
| 36–59 | 81–137 | 108–183 | Band C fine | Band B–C fine | 12–16 months |
| 60–89 | 138–206 | 184–274 | Band C fine | Band C fine – Low CO | 17–22 months |
| 90–119 | 207–275 | 275–366 | Medium Community Order | Low CO – High CO | 23–28 months |
| 120–150+ | 276–345+ | 367–459+ | 12 weeks custody | High CO – 26 weeks custody | 29–36 months |

###### Band B fine = approximately 1 week's net income. Band C fine = approximately 1.5 weeks' net income. CO = Community Order. Source: [sentencingcouncil.org.uk](https://www.sentencingcouncil.org.uk)`,
    },
    {
      heading: "Where Will the Case Be Heard?",
      body: `All drink driving cases are heard in the Magistrates' Court, unless you appeal. Appeals against conviction or sentence are heard in the Crown Court. I represent clients at both.`,
    },
  ],
  relatedLinks: [
    { label: "Drunk in Charge of a Vehicle", href: "/services/drunk-in-charge" },
    { label: "Failing to Provide a Specimen", href: "/services/failing-to-provide" },
    { label: "Drug Driving (s.5A RTA 1988)", href: "/services/drug-driving" },
    { label: "Special Reasons Hearings", href: "/services/special-reasons" },
    { label: "Police Station Representation", href: "/police-station" },
    { label: "Fees", href: "/fees" },
  ],
};

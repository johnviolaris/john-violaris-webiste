import type { ServiceDetail } from "@/lib/content/service-detail";

/**
 * Drunk in Charge: the page as John wrote it, from `drunk-in-charge.html`.
 *
 * Section bodies are written in the markup described in
 * `lib/content/service-markup.ts`.
 */
export const drunkInCharge: ServiceDetail = {
  headline: "Drunk in charge.",
  emphasis: "A different offence, and a different answer.",
  intro:
    "Being \"in charge\" is not the same as driving. You may have been asleep in the car, waiting for a taxi, or just sitting in the driver's seat. The law treats this differently from drink driving. A ban is not automatic, and there is a specific statutory defence. The key question is usually whether you were ever likely to drive while over the limit.",
  penalties: [
    {
      kicker: "The offence",
      label: "s.5(1)(b) RTA 1988",
      note: "In charge of a motor vehicle on a road or other public place with alcohol over the prescribed limit. A separate offence (s.4(2)) covers being in charge while unfit through drink or drugs.",
      tone: "note",
    },
    {
      kicker: "Points or ban",
      label: "10 points",
      note: "Or a discretionary ban. Unlike drink driving, disqualification is not compulsory.",
      tone: "note",
    },
    {
      kicker: "Maximum sentence",
      label: "3 months",
      note: "Custody and/or a fine of up to £2,500, reserved for the most serious cases.",
      tone: "note",
    },
    {
      kicker: "The defence",
      label: "No likelihood of driving",
      note: "You are not guilty if you prove you were not likely to drive while still over the limit or unfit.",
      tone: "note",
    },
  ],
  sections: [
    {
      eyebrow: "Legal framework",
      heading: "The legal framework",
      body: `"Drunk in charge" is the everyday name for two offences under the Road Traffic Act 1988:

::: cards

#### Section 5(1)(b): in charge with excess alcohol

Your breath, blood or urine reading was over the legal limit. The prosecution does not need to prove that your driving ability was affected.

---

#### Section 4(2): in charge while unfit through drink or drugs

There may be no reliable reading. Instead, the prosecution must prove that your ability to drive properly was impaired. Officers' observations and any medical evidence become central.

:::

### What does "in charge" mean?

The Act does not define it. The courts have given guidance instead, starting with *DPP v Watkins* [1989]. If you own the vehicle or recently drove it, you are likely to be treated as in charge unless you had handed control to someone else or there was no realistic possibility of you taking control. If you are not the owner or recent driver, the question is whether you had actually taken control. Relevant facts include:

- where you were: in the driver's seat, a passenger seat, or outside the car;
- whether you had the keys, and where they were;
- whether the engine, lights or heater were on;
- what you were doing and what you intended to do; and
- whether anyone else was responsible for the vehicle.

Where the car was also matters. The offence only applies on a road or other public place, so a private driveway or some private car parks can raise a genuine issue.

### The statutory defence

Both offences have a built-in defence. You must prove that, at the time, there was no likelihood of you driving the vehicle while you remained over the limit (s.5(2)) or unfit (s.4(3)). This is one of the rare situations where the burden is on you. The House of Lords confirmed in *Sheldrake v DPP* [2004] that you must prove it on the balance of probabilities. That is a lower standard than the prosecution's, but it still requires evidence.

Saying "I wasn't going to drive" is rarely enough on its own. The courts have held that magistrates must look at the circumstances as a whole, not just your stated intention. The court may also ignore any injury to you or damage to the vehicle when deciding whether you were likely to drive. So the argument "I couldn't have driven, the car was damaged" does not automatically succeed.`,
    },
    {
      eyebrow: "Clarity first",
      heading: "Clarity first. Then light at the end of the tunnel.",
      body: `Drunk in charge cases are won or lost on facts and evidence, often gathered in the first few weeks. These are the issues I examine in every case:

::: cards

#### Were you in charge?

Seat position, keys, engine, ownership, who else was there. Some clients were never in charge in law.

---

#### Was there a likelihood of driving?

Your plans that night: a booked taxi, a lift arranged, a hotel or home within walking distance, messages sent at the time.

---

#### When would you have been under the limit?

A forensic toxicologist can back-calculate your alcohol level to show when you would have fallen below it, compared with when you planned to drive.

---

#### Was the reading reliable?

The same procedural safeguards apply as in drink driving: approved device, correct procedure and proper warnings.

---

#### Road or public place?

Where exactly was the vehicle? Private land is not automatically a "public place".

---

#### Avoiding a ban

Where there is no defence, the reading band and the likelihood of driving shape whether the court imposes 10 points or a ban.

:::

### Evidence that supports the defence

The strongest cases are built on independent evidence, not just your word. Examples include taxi or ride-hailing app bookings, text and WhatsApp messages, phone call logs, witnesses such as the friend or partner who was collecting you, receipts, and hotel bookings. An expert's back-calculation is often needed to link this evidence to your alcohol level. Experts must be instructed in good time before trial.

### Your options

**Contest the charge** where you were not in charge in law, or you can prove there was no likelihood of driving. I prepare the evidence, instruct any expert, and present your defence at trial.

**Plead guilty with focused mitigation** where the evidence is against you. With a lower reading and a low likelihood of driving, the guideline points to 10 penalty points, not a ban. I put forward the facts that keep your case in that range.

::: note

#### Watch out for totting up

10 points added to points already on your licence can reach 12 within three years. That triggers a minimum six-month ban, unless the court accepts that a ban would cause exceptional hardship. If that's your situation, I'll plan for an exceptional hardship argument from the start.

:::`,
    },
    {
      eyebrow: "Sentencing and outcomes",
      heading: "Sentencing and possible outcomes",
      body: `Magistrates follow the Sentencing Council guidelines. For excess alcohol, the starting point depends on your reading. For being unfit, it depends on the likelihood of driving and the level of impairment.

#### In charge with excess alcohol, s.5(1)(b) (maximum: £2,500 fine and/or 3 months' custody)

| Breath (µg/100ml) | Blood (mg/100ml) | Urine (mg/100ml) | Starting point | Points or ban |
| --- | --- | --- | --- | --- |
| 36–59 | 81–137 | 108–183 | Band B fine | 10 points |
| 60–89 | 138–206 | 184–274 | Band B fine | 10 points or consider a ban |
| 90–119 | 207–275 | 275–366 | Band C fine | 10 points or consider a ban of up to 6 months |
| 120–150+ | 276–345+ | 367–459+ | High level community order | Ban of 6–12 months |

#### In charge while unfit through drink or drugs, s.4(2) (maximum: £2,500 fine and/or 3 months' custody)

| Category | Typical facts | Starting point | Points or ban |
| --- | --- | --- | --- |
| 3 | Low likelihood of driving; lower impairment | Band B fine | 10 points |
| 2 | High likelihood of driving, *or* high impairment | Band C fine | 10 points or consider a ban |
| 1 | High likelihood of driving *and* high impairment | High level community order | 10 points or consider a ban |

### Factors that move the sentence

A **high likelihood of driving**, being in charge of a goods vehicle or bus, offering to drive for money, and relevant previous convictions push the sentence up. A **low likelihood of driving**, spiked drinks, no relevant previous convictions, good character and genuine remorse bring it down. So do personal circumstances such as caring responsibilities.

### Consequences beyond the courtroom

- **No mandatory ban**, but a ban is likely at the highest readings. A ban can also follow if the 10 points tip you into totting up.
- **High Risk Offender status** applies if you are disqualified with a reading of at least 87.5µg in breath (or the blood or urine equivalent). Your licence will only be returned after you pass a DVLA medical, at your own cost.
- **Insurance and employment.** An in-charge endorsement still has to be declared and is likely to affect premiums. Some employers and professional regulators will also need to know.
- **A criminal record**, which can affect some travel visas.`,
    },
    {
      eyebrow: "What to share with me",
      heading: "What to share with me",
      body: `You don't need all the answers before we speak. These help me assess your case quickly:

- **Your charge paperwork**: the charge sheet or postal requisition, any bail or release documents, and the breath test printout if you were given one.
- **Key dates**: your first court hearing, or any police interview you have been invited to.
- **Your account of the evening**: what and when you drank, why you were in or near the car, and where the keys were.
- **Evidence of your plans**: screenshots of taxi or app bookings, messages and call logs, and the names of anyone who can confirm your arrangements. Keep these safe and don't delete anything.
- **Your driving record**: any points currently on your licence. This tells me whether totting up is a risk.
- **What a ban would mean** for your work, family and any people who depend on you.

###### Phone records and app data are easiest to recover early. CCTV, for example from a car park, may be overwritten quickly. The sooner we speak, the more evidence is likely to be available.`,
    },
    {
      eyebrow: "Personal representation",
      heading: "Personal representation",
      body: `When you instruct me, you deal with me directly from the first call to the final hearing. I have over 20 years' criminal defence experience and represent clients in magistrates' courts across England and Wales. I will tell you honestly whether the statutory defence is realistic in your case, what evidence it needs, and what the alternatives are.

If you have been asked to attend a police interview, speak to me first. What you say about your intentions can make or break the "no likelihood of driving" defence later.

You will know the cost before you commit. My fees are fixed for each stage, agreed in writing, and your first 30-minute conversation is free.

Speak to me for free and I'll honestly assess your situation.

###### This page is general information about the law in England and Wales as at November 2026. It is not advice on your specific circumstances, and no outcome can be guaranteed.`,
    },
  ],
  relatedLinks: [
    { label: "Drink Driving", href: "/services/drink-driving" },
    { label: "Drug Driving", href: "/services/drug-driving" },
    { label: "Failing to Provide a Specimen", href: "/services/failing-to-provide" },
  ],
};

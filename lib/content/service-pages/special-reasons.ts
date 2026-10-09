import type { ServiceDetail } from "@/lib/content/service-detail";

/**
 * Special Reasons: the page as John wrote it, from `jv-special-reasons.html`.
 *
 * Section bodies are written in the markup described in
 * `lib/content/service-markup.ts`.
 */
export const specialReasons: ServiceDetail = {
  headline: "Special Reasons —",
  emphasis: "Guilty of the Offence, But Not the Ban",
  intro:
    "A special reasons argument allows the court to step back from a mandatory disqualification or endorsement — even where guilt is not in dispute. It is not a defence. It is a legal mechanism that recognises genuine mitigating circumstances directly connected to the offence. Properly prepared and argued, it can keep your licence even after a guilty plea to drink driving, no insurance, or another endorsable offence.",
  penalties: [
    { label: "No disqualification", note: "If special reasons accepted", tone: "note" },
    { label: "No endorsement", note: "Points — all or nothing", tone: "note" },
    { label: "Conviction stands", note: "This is not an acquittal", tone: "risk" },
    { label: "High threshold", note: "Must pass 4-part Wickens test", tone: "risk" },
    { label: "Proven in court", note: "On balance of probabilities", tone: "note" },
  ],
  lead:
    "Special reasons are not a loophole and not a formality. **They are a principled legal argument, grounded in case law, that requires evidence, preparation, and persuasion.** When they succeed, they can be the difference between keeping your licence and losing it — even for drink driving.",
  sections: [
    {
      eyebrow: "Understanding Special Reasons",
      heading: "What Special Reasons Are — and What They Are Not",
      body: `The power to find special reasons is contained in **section 34(1) of the Road Traffic Offenders Act 1988**. It gives the court discretion to decline to impose a mandatory disqualification, or to impose a shorter one, where special reasons are established. The same principle extends to endorsement — if special reasons are found for an endorsable offence, the court *must not* impose any penalty points at all.

The concept was defined by the Court of Appeal in the landmark case of ***R v Wickens* (1958)**, which remains the governing authority. To constitute a special reason, a matter must satisfy all four limbs of that test. The legal framework is deliberately narrow — and that is exactly why proper preparation is essential.

::: cards

#### What special reasons can do

- Avoid a mandatory disqualification entirely — even for drink driving
- Reduce the length of a mandatory disqualification
- Avoid endorsement entirely — no penalty points imposed
- Apply to any endorsable offence where the circumstances meet the test
- Be argued even where a guilty plea has been entered
- Be heard after conviction if not raised at the time

---

#### What special reasons cannot do

- Overturn a conviction — the guilty plea or finding still stands
- Reduce penalty points (it is all or nothing — the court cannot halve the points)
- Be based on personal hardship — losing a job, caring responsibilities, etc.
- Rely on good character or a clean driving record
- Succeed without evidence — assertion alone is not enough
- Be reused on the same grounds within a three-year period without resistance

:::

::: note

#### Special reasons vs exceptional hardship — not the same thing

These two legal tools are frequently confused. **Special reasons** relate to the circumstances of the offence itself — they must be directly connected to how and why the offence was committed. They are available at any level of points or ban.

**Exceptional hardship** is available when a driver is facing a totting-up ban (12 or more points) and relates to the consequences of disqualification — not the offence. It can rely on personal circumstances, including employment and caring responsibilities. The two arguments are distinct, may sometimes apply to the same case, and are presented at different stages of the proceedings.

:::`,
    },
    {
      eyebrow: "The Legal Test",
      heading: "The Four-Part Wickens Test — All Must Be Met",
      body: `Every special reasons argument must satisfy all four limbs established in *R v Wickens* (1958). The court will apply this test to the facts before exercising any discretion. A compelling argument on three of the four criteria is not sufficient — all four must be present. This is why the nature of the circumstances matters as much as their quality.

::: steps

#### A mitigating or extenuating circumstance

The matter must genuinely explain why the driver came to commit the offence in a way that reduces their moral culpability. It is not simply a reason the driver prefers to the alternative — it must be a circumstance that a fair-minded court would recognise as reducing the gravity of what happened.

---

#### Not amounting in law to a defence

If the circumstances provided a legal defence that would result in an acquittal, the defendant would not be guilty of the offence and no penalty would be imposed anyway. Special reasons occupy the space between "innocent" and "guilty without mitigation" — they exist precisely for cases where guilt is clear but justice demands a lighter response.

---

#### Directly connected to the commission of the offence

This is the limb that distinguishes special reasons from general mitigation. The circumstances must be linked to the *act of driving* in the way the offence was committed — not to the defendant's general character, life circumstances, or the consequences of conviction. Personal hardship arising from a ban fails this test precisely because it is connected to the sentence, not the offence.

---

#### Something the court ought properly to take into account

Even where all three other criteria are met, the court must consider whether the matter is of sufficient weight to warrant its attention at sentencing. Trivial or self-created circumstances, even if technically connected to the offence, may not satisfy this requirement. The court's discretion, even if special reasons are found, means the outcome is never guaranteed.

:::

::: warning

#### The court's discretion continues even if special reasons are found

Finding that special reasons exist does not automatically mean the court will exercise discretion in your favour. Under s.34(1) RTOA 1988, the court *may* decline to disqualify, not must. The quality and credibility of the evidence, the specific circumstances, and the magistrates' view of the case as a whole all matter. This is why special reasons hearings require careful preparation — not just establishing that the grounds exist, but presenting them persuasively.

:::`,
    },
    {
      eyebrow: "Recognised Grounds",
      heading: "The Main Grounds — and What They Require in Practice",
      body: `The case law on special reasons is extensive. The following are the most frequently argued grounds, with what each requires and the evidence that strengthens each argument. The list is not exhaustive — the four-part test from Wickens can be applied to any set of facts, and creative arguments on unusual facts are sometimes accepted.

::: cards

##### Drink Driving · Drug Driving

#### Laced Drinks — Spiked Without Knowledge

Where a driver's drink was spiked with alcohol (or a drug) without their knowledge, and their intentional consumption alone would not have taken them over the prescribed limit, a special reasons argument can succeed in avoiding the mandatory ban.

The court will require proof of three things: first, that the drink was spiked; second, that the driver did not know this was happening; and third — critically — that but for the spiking, the defendant's voluntary consumption would have kept them within the legal limit. Without expert evidence on the latter point, the argument will almost always fail.

The spiker does not need to attend court, but their involvement needs to be evidenced — either through their own statement (which can be admitted as hearsay), witness evidence of what they saw, or other supporting material.

##### Evidence required

- Expert forensic toxicology evidence — calculating what the reading would have been without the spiking
- Statement from the person who spiked the drink, or witness evidence of the spiking
- Evidence of the defendant's intentional drinks — what they ordered, timing, quantity
- Circumstantial evidence — what the defendant knew and when
- Credible account from the defendant in the witness box

---

##### Drink Driving · Drug Driving · Most Endorsable Offences

#### Shortness of Distance Driven

Where the distance driven was so short that there was realistically no danger to other road users, the court may find special reasons and decline to ban. There is no statutory definition of "short" — the courts assess it on the totality of the circumstances.

The leading case of *Chatters v Burke* (1986) sets out seven factors for the court to consider, including: the manner of driving; the state of the driver; whether pedestrians or other road users were endangered; the level of traffic and footfall; the reason for driving; any actual danger or accident; and the likelihood of other road users being present.

Courts typically expect distances measured in metres rather than miles, and will look critically at whether the environment was genuinely isolated. Moving a car ten metres in a private car park at 3am is a very different case from driving 300 metres through a busy high street.

##### Evidence required

- Accurate measurement and photographs of the route and distance driven
- Evidence of road conditions, time, lighting, and pedestrian/traffic presence
- Plan or map showing the location and any surrounding properties
- Dashcam footage if available
- Witness evidence corroborating the account
- Defendant's credible account of why they drove

---

##### Drink Driving · Speeding · No Insurance · Most Offences

#### Genuine Emergency

Where a driver committed an offence in response to a genuine emergency — escaping from a physical attack, rushing someone to hospital in a life-threatening situation, or responding to an immediate threat — a special reasons argument may succeed. This is one of the more difficult grounds to establish, and courts scrutinise it carefully.

The courts will examine: whether the emergency was genuine and immediate; whether alternatives to driving existed and were genuinely unavailable; whether the driver drove no further than was necessary; and whether the driving was appropriate to the emergency rather than an overreaction.

A woman who drove away from an attacker after being assaulted outside a bar — driving only as far as was necessary to escape and not further — succeeded in a case I have seen litigated. A driver who claimed a general concern about a relative's welfare without immediate crisis did not.

##### Evidence required

- Contemporaneous evidence of the emergency — 999 call records, medical records, police reports
- Witness evidence corroborating the threat or emergency
- Evidence that alternative options were explored and unavailable
- Evidence that the distance driven was only what was necessary
- Medical evidence where injury or illness is the basis

---

##### No Insurance

#### Genuinely Misled Into Believing Insurance Was in Place

Where a driver was expressly told by a third party — an employer, a family member, a broker, or a car owner — that the vehicle was insured to cover their use, and that belief was reasonable and honest, a special reasons argument can avoid endorsement entirely.

The courts draw a clear distinction between an honest and reasonable belief that was actively created by another person's assurance, and a mere assumption or failure to check. The assurance must have been made; the reliance upon it must have been reasonable; and the driver must have had no reason to doubt it.

An honest but groundless belief — "I just assumed I was covered" — does not meet the test. But where someone in authority said "yes, the insurance covers you" and the driver had no reason to question this, the argument can succeed.

##### Evidence required

- Statement from the person who gave the assurance of cover
- Any written communication — emails, texts, letters — confirming cover
- Evidence of the circumstances in which the assurance was given
- Policy documents showing the cover that was believed to be in place
- Evidence that the driver had no reason to check independently

---

##### Drug Driving — Cannabis · An Unusual and Emerging Ground

#### Medical Cannabis — Prescription Obtained After the Offence

This is one of the more unusual grounds, and one that your draft correctly identifies as worth addressing. A statutory medical defence to a drug driving charge under s.5A RTA 1988 requires that the drug was taken for legitimate medical purposes *in accordance with a prescription that was in force at the time of driving*. If the prescription was obtained after the offence date, there is no statutory defence.

However, in appropriate cases, the post-offence prescription can support a special reasons argument. The argument is that: the driver was using cannabis to manage a genuine diagnosed medical condition; they did not know at the time that it would impair their driving or take them above the limit; they have since obtained medical authorisation for its use; and treating them identically to a recreational drug user would be disproportionate in all the circumstances.

This is a novel and developing area of law. Success is not guaranteed and the argument must be carefully constructed. It requires the four Wickens criteria to be satisfied — particularly the requirement that the matter be directly connected to the commission of the offence. Medical evidence of the condition and its treatment history is essential.

##### Evidence required

- Medical prescription (obtained after the offence but showing pre-existing condition)
- Medical records evidencing the diagnosed condition and treatment history
- Expert evidence on the dose, the effect on driving, and lack of awareness of impairment
- Evidence that the use was therapeutic not recreational
- Credible account from the defendant about their state of knowledge at the time

---

##### Drink Driving · A Technical but Real Ground

#### Mouth Alcohol — Regurgitation Affecting the Reading

Where a defendant suffers from a medical condition causing regurgitation — for example, acid reflux, GERD, or similar — alcohol from the stomach can reach the mouth during a breath test and artificially inflate the reading above what the blood alcohol level would actually produce.

This is a technical argument requiring expert forensic evidence. The leading case of *Woolfe v DPP* (2006) confirms that if such regurgitation occurred and affected the breath test reading, a special reasons argument is available. The challenge is proving that regurgitation occurred at the relevant time and establishing what the reading would have been without it.

This ground is most valuable in cases where the reading is relatively low and the defendant has a documented medical condition. It requires a specialist expert witness, and the expert's evidence will be challenged by the prosecution.

##### Evidence required

- Medical records documenting the regurgitation condition
- Expert forensic toxicology evidence on the effect on the reading
- Evidence of symptoms on or around the date of the test
- Medical evidence on the condition and its effects
- Credible and consistent account from the defendant

:::

### What Cannot Amount to Special Reasons

The courts have been clear about what falls outside the test. The following circumstances have been held — or are likely to be held — not to constitute special reasons. Presenting these arguments wastes the court's time and damages the defendant's credibility.

::: cards

#### Personal hardship

Losing employment, the impact on a career, or the effect on the family — however serious — does not amount to a special reason because it relates to the driver's personal circumstances, not the offence. This is the basis for exceptional hardship, not special reasons.

---

#### Good character or clean record

The fact that a driver has not previously offended, has driven for many years, or is of exemplary character may be mitigation on sentence — but it is not a special reason. It says nothing about the circumstances of the offence itself.

---

#### Being just over the limit

In *Delaroy-Hall v Tadman* (1969), Lord Parker refused to find special reasons where the driver was marginally above the prescribed limit. The closeness of the reading to the legal limit is not, of itself, a special reason.

---

#### Forgetting to renew insurance or underestimating alcohol

Negligence — even genuine — is not a special reason. Forgetting to renew a policy, misjudging how much one has drunk, or failing to check whether a vehicle was covered cannot ground the argument because these are failures of care rather than extenuating circumstances.

:::`,
    },
    {
      eyebrow: "How the Process Works",
      heading: "Two Hearings — Why Preparation Must Start Early",
      body: `A special reasons argument almost always requires two court appearances. The first is to enter a plea and notify the court that special reasons will be argued. The second is the special reasons hearing itself — which operates like a mini-trial. Courts need advance notice to list the case correctly, allocate sufficient time, and ensure the prosecution is prepared to respond. Presenting a special reasons argument without notice at the first hearing will almost always result in an adjournment.

::: steps

#### First Hearing — Guilty Plea and Notice of Special Reasons

At the first hearing, you enter a guilty plea. You (or your solicitor) inform the court that you intend to advance a special reasons argument. The court will adjourn the case to a second listing, allocating sufficient time for the hearing — typically at least two hours. At this stage, directions are often given for the exchange of evidence.

If you have attended the first hearing without legal representation and entered a guilty plea without raising special reasons, it may still be possible to return and argue special reasons — but this adds complexity and potential cost. The earlier I am involved, the cleaner the process.

---

#### Preparation Between Hearings

The work between hearings is where a special reasons case is built or lost. I identify the strongest ground available on the facts, gather the documentary and expert evidence needed, prepare witness statements, instruct expert witnesses where necessary, draft written submissions, and prepare you for giving evidence.

You will give evidence under oath at the special reasons hearing and will be cross-examined by the prosecution. This is not a formality. The prosecution will probe the credibility of your account, challenge the evidence, and test the weaknesses. I prepare you specifically for cross-examination — identifying the questions most likely to be asked and making sure your account is consistent and credible.

---

#### The Special Reasons Hearing

The hearing is conducted like a trial. You give evidence first, followed by any witnesses. The prosecution cross-examines. I then make legal submissions on why the evidence satisfies the four Wickens criteria. The prosecution may make submissions in response. The magistrates then decide — on the balance of probabilities — whether special reasons exist, and if so, whether to exercise their discretion.

The balance of probabilities is a lower standard than the criminal standard. You do not need to prove your case beyond reasonable doubt — you need to satisfy the court that it is more likely than not that the circumstances exist.

---

#### Decision and Sentence

If special reasons are found, the court exercises its discretion. For disqualification offences: the ban may be reduced or not imposed at all. For endorsable offences: no points are imposed (it must be all points or none — there is no power to reduce the number). The conviction still stands. If special reasons are not found, full sentencing follows.

:::`,
    },
    {
      heading: "Possible Outcomes",
      body: `::: cards

#### Special Reasons Accepted — No Ban

The court finds special reasons and declines to impose a mandatory disqualification. No ban. Conviction stands. This is the best outcome for most clients facing a mandatory driving ban.

---

#### Special Reasons Accepted — No Points

For an endorsable offence, the court finds special reasons and imposes no penalty points at all. The conviction stands but the licence is not endorsed. A particularly important outcome where the driver already has existing points.

---

#### Special Reasons Accepted — Reduced Ban

The court finds special reasons but exercises discretion to reduce rather than eliminate the ban. A shortened disqualification period, though less than a complete success, may still be a dramatically better outcome than the mandatory minimum.

---

#### Special Reasons Not Found — Full Sentence

The court does not find that the four Wickens criteria are met, or declines to exercise discretion. The full statutory sentence applies. A guilty plea has already been entered, so the case moves directly to sentencing with the benefit of any guilty plea reduction.

:::`,
    },
    {
      eyebrow: "My Service",
      heading: "How I Help — Special Reasons Cases",
      body: `Special reasons hearings reward thorough preparation, the right evidence, and a clear legal argument. The cases that succeed are not the ones with the most sympathetic facts — they are the ones where the facts are properly tested against the legal criteria and then presented to the court in the most compelling way available.

::: steps

#### Assessing Whether Your Circumstances Qualify

The first question is whether the four Wickens criteria can be satisfied on your specific facts. I do this assessment honestly — including telling you when I think the argument is unlikely to succeed. A failed special reasons argument adds time and cost without changing the outcome; a meritless argument also damages credibility with the court. I will give you a realistic view of the prospects before any decision is made.

---

#### Gathering and Preparing the Evidence

Evidence is everything in a special reasons case. I identify what is needed for your specific ground — expert witnesses, medical records, forensic analysis, witness statements, photographs, measurements, phone records — and take responsibility for obtaining it. Expert evidence in particular requires careful briefing and a well-instructed expert who understands what the court requires.

---

#### Managing Both Hearings

I handle the first hearing, enter the guilty plea, give the court proper notice of the special reasons argument, and ensure the adjournment is managed correctly. Between hearings I build the case. At the special reasons hearing I present the evidence, examine and re-examine witnesses, and make the legal submissions. You are represented throughout, and the hearing is prepared for — not improvised.

---

#### Preparing You for Cross-Examination

You will give evidence under oath and the prosecution will cross-examine you. The questions will probe every part of your account — the circumstances, what you knew, what you did, what alternatives were available. I prepare you for this in detail: the questions you are likely to face, the areas the prosecution will probe, and how to give evidence clearly and consistently without compromising your credibility.

:::`,
    },
    {
      eyebrow: "Why Instruct Me",
      heading: "Technical Precision. Evidence-Led. Personal Throughout.",
      body: `Special reasons arguments are among the most technically interesting in motoring law — they sit at the intersection of legal principle, case law, and the specific facts of an individual case. The case law extends across six decades and covers an enormous range of circumstances. Knowing which cases support your argument, and which ones the prosecution will rely on, matters.

I qualified in 2005 and have worked in motoring defence throughout my career. I have argued special reasons in cases of drink driving, drug driving, no insurance, and a range of other endorsable offences. I know what makes these arguments work and what makes them fail. I offer a fixed fee, a free initial assessment of whether the argument is viable, and personal representation through both hearings.

If you are facing a mandatory disqualification or endorsement and believe the circumstances of your case were unusual, call me for a free initial conversation. The assessment is always honest — and the fee for the hearing is only confirmed once we have agreed the argument is worth making.`,
    },
  ],
  quote:
    "Finding that special reasons exist isn't the end — it's the beginning. The court still has discretion. That is why the quality of the evidence, and the credibility of the defendant in the witness box, determines the outcome.",
  quoteCite: "John Violaris",
  relatedLinks: [
    { label: "Drink Driving", href: "/services/drink-driving" },
    { label: "Drug Driving", href: "/services/drug-driving" },
    { label: "No Insurance", href: "/services/no-insurance" },
    { label: "Exceptional Hardship", href: "/services/exceptional-hardship" },
    { label: "All Services", href: "/services" },
    { label: "Fees", href: "/fees" },
  ],
  ctaHeading: "Think your case may have special reasons?",
  ctaEmphasis: "Call me — I'll tell you honestly.",
};

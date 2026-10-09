import type { ServiceDetail } from "@/lib/content/service-detail";

/**
 * Failing to Provide Driver Details: the page as John wrote it, from `jv-s172-driver-details.html`.
 *
 * Section bodies are written in the markup described in
 * `lib/content/service-markup.ts`.
 */
export const driverDetails: ServiceDetail = {
  headline: "Failing to Provide Driver Details —",
  emphasis: "Six Points for Not Responding",
  intro:
    "A section 172 conviction can carry the same points as a serious speeding offence — even though the underlying offence may have been trivial. Many clients are charged without realising they had a defence, or convicted in their absence without ever knowing a court date had been set. Both situations can be addressed — but time matters.",
  penalties: [
    { label: "6 penalty points", note: "Mandatory endorsement", tone: "risk" },
    { label: "Up to £1,000 fine", note: "Based on weekly income", tone: "risk" },
    { label: "Discretionary ban", note: "Serious cases", tone: "note" },
    { label: "21-day limit", note: "Statutory declaration after conviction", tone: "note" },
  ],
  lead:
    "The penalty for failing to respond to a s.172 notice is often **harsher than the penalty for the original offence that triggered it.** Six points and a fine of up to £1,000 for not filling in a form is a disproportionate outcome — and it is one that can frequently be avoided with the right advice, taken at the right time.",
  sections: [
    {
      eyebrow: "The Offence",
      heading: "What Section 172 Requires — and Who It Applies To",
      body: `Under **section 172 of the Road Traffic Act 1988**, where the driver of a vehicle is alleged to have committed a qualifying offence, the police can require anyone to give information about the identity of that driver. The obligation falls on two different people in different ways.

::: cards

##### s.172(2)(a) — Registered Keeper

#### The Registered Keeper's Obligation

If you are the registered keeper of the vehicle, you **must** provide the identity of the driver when required to do so by the police. This obligation is absolute — with one statutory exception.

The only defence available to the registered keeper is to show they *did not know* and *could not with reasonable diligence have ascertained* who the driver was. Simply saying "I can't remember" is not enough. Both elements must be proved on the balance of probabilities.

This is the more serious obligation — and the more frequently charged.

---

##### s.172(2)(b) — Any Other Person

#### Anyone Else's Obligation

Any other person — including a nominated driver, a family member, or an employer — must give any information in their power to give that may lead to identification of the driver.

The standard here is lower. The requirement is only to give information that *is in your power to give*. If you genuinely do not have, and could not reasonably obtain, any information about the driver, you are not required to invent it.

This is why companies and fleet operators receive their own s.172 notices, separate from any notice sent to the keeper.

:::

### What Triggers a Section 172 Notice

A s.172 notice is sent when the police believe a vehicle was used in connection with a qualifying offence and cannot immediately identify the driver — typically because the driver was not stopped at the time. Common triggers include:

::: cards

#### Common camera-detected offences

- Speeding (fixed camera or mobile speed van)
- Traffic light offences (red light camera)
- Bus lane, box junction, or congestion charge contraventions
- ANPR-detected offences (no insurance, no MOT)

---

#### Other situations

- Hit and run — failing to stop after an accident
- Careless or dangerous driving witnessed but driver not stopped
- Dashcam footage submitted by another driver
- Witness report of an alleged offence

:::

::: warning

#### Responding is not the same as admitting guilt for the original offence

This is one of the most common misunderstandings. Providing the identity of the driver in response to a s.172 notice does not constitute an admission that any offence was committed. The original offence and the s.172 obligation are separate. You must respond to the s.172 notice even if you intend to dispute the original allegation entirely.

Refusing to respond on the basis that "I wasn't speeding" — or any similar reasoning — will result in a prosecution for failing to provide information, which often carries a heavier penalty than the original offence. Do not withhold information for tactical reasons without taking legal advice first.

:::`,
    },
    {
      eyebrow: "Time Limits & The NIP",
      heading: "The Notice — Time Limits That Matter",
      body: `The s.172 notice usually arrives with a Notice of Intended Prosecution for the original offence. Both documents have strict time requirements, and errors in the paperwork can provide a complete defence.

::: steps

##### Day 0 · Offence

#### The alleged offence occurs

A camera, ANPR system, or witness records the vehicle registration. The police cannot identify the driver from the registration alone — the s.172 process begins.

---

##### By Day 14 · NIP

#### Notice of Intended Prosecution sent to keeper

The NIP must be sent to the registered keeper within 14 days of the alleged offence. If it was not sent within that period — and no warning was given at the scene — the NIP may be out of time, and the original offence cannot be prosecuted. Check the date on the envelope and the date on the notice.

---

##### Within 28 days · Respond

#### You must respond to the s.172 notice

From the date of the requirement, you have 28 days to respond with the driver's details. Respond in writing, keep a copy, and send by recorded delivery. A response that is lost in the post — and never received — may still provide a defence if you can show you did in fact reply.

---

##### If no response · Charge

#### Prosecution for failing to provide details

If no response — or an incomplete response — is received, the police will typically charge both the s.172 offence and the original offence. Both may be pursued up to and including the day of trial. The s.172 charge is frequently treated as more serious.

:::

::: note

#### The NIP time limit — a complete defence if missed

The 14-day requirement for the NIP to be sent to the registered keeper is strict. If the police sent the NIP to the wrong address, sent it outside 14 days, or failed to comply with the statutory requirements as to its contents, the NIP may be invalid — and the original offence cannot be charged. This is one of the first checks I carry out in every s.172 case.

Note: the 14-day rule does not apply to the s.172 notice itself — only to the NIP. The s.172 notice can be sent later. But if the NIP is invalid, the entire prosecution may be undermined.

:::`,
    },
    {
      eyebrow: "Defences",
      heading: "Available Defences — Two Statutory Routes and Others",
      body: `Section 172 provides two specific statutory defences for the registered keeper. In addition, there are procedural and evidential arguments that can apply regardless of keeper status. I examine all of them before advising on plea.

### Statutory Defence 1 — Reasonable Diligence

Under **s.172(4) RTA 1988**, the registered keeper is not guilty of the offence if they show that they *did not know* and *could not with reasonable diligence have ascertained* who the driver was. Both limbs must be proved on the balance of probabilities — the burden shifts to the defendant.

"Reasonable diligence" is not defined in the statute. It is a question of fact for the magistrates, decided on the specific circumstances of each case. The leading case of *DPP v Atkinson* established that a keeper who allowed a potential buyer to test-drive a vehicle — who then disappeared without leaving contact details — had exercised reasonable diligence and could not with reasonable diligence have ascertained the driver. The conviction was quashed.

What is not enough: simply saying "I don't know" or "I can't remember." The court expects evidence of active steps taken to identify the driver. What those steps should look like depends on the circumstances — but here is a guide to what courts typically expect to see.

::: note

#### Evidence of reasonable diligence — what to show the court

- Checked personal diary or calendar for the date and time
- Reviewed work schedules, timesheets, or rota records
- Consulted family members with access to the vehicle
- Contacted all colleagues, employees, or regular passengers
- Reviewed bank statements or receipts to establish whereabouts
- Checked dashcam footage from the vehicle (if fitted)
- Reviewed any shared calendar, booking system, or fleet log
- Kept a written record of all enquiries made and responses received
- Contacted the person who borrowed the vehicle (even if they deny it)
- Reported the difficulty to the police in writing before the deadline

:::

### Statutory Defence 2 — Not Reasonably Practicable Within 28 Days

Under **s.172(7)(b) RTA 1988**, a person is not guilty of an offence if it was not reasonably practicable to provide the information within the 28-day period, provided that the information was furnished as soon as reasonably practicable afterwards. This is most relevant where the notice was received at an old address, the keeper was hospitalised or abroad, or there was a genuine postal failure — and the keeper responded as soon as they became aware.

::: cards

##### Notice Not Received

#### Postal failure or wrong address

Where the s.172 notice was sent to an old address (perhaps because the DVLA records were not up to date) or was genuinely lost in the post, and you had no knowledge of it, this can found a defence either under the "not reasonably practicable" provision or on the basis that the notice was not validly served on you. Evidence of address change, mail redirection, or postal records is important.

---

##### Response Sent But Not Received

#### You replied — the prosecution says otherwise

Where you completed and returned the form within 28 days but the response was not received by the police or central ticket office, you may have a defence. Evidence of posting — a recorded delivery receipt, a photograph of the completed form, a witness who saw you send it — can establish this. Keep copies of all responses at the time of sending.

---

##### Vehicle Already Sold

#### You were no longer the keeper at the time

If the vehicle had been sold before the date of the alleged offence, and the DVLA records had not been updated, the s.172 notice should not have been sent to you. You were not the registered keeper at the time of the offence and cannot be required to identify a driver of a vehicle you no longer owned. Evidence of sale — a receipt, transfer of registration, or V5C transfer — is required.

---

##### NIP Out of Time or Defective

#### Procedural challenge to the NIP itself

Where the NIP was not sent within 14 days of the alleged offence, the original offence may be statute-barred entirely. If both the s.172 notice and the NIP are contained within the same document — as they frequently are — a defective NIP can undermine the entire prosecution. I check the dates and the form of the documents in every case.

:::

::: warning

#### Never guess — perverting the course of justice

If you do not know who was driving and cannot establish it through reasonable diligence, the correct response is to say so — and to document your efforts. **Do not guess, do not name someone you are not sure about, and do not name someone falsely to protect another person.** Providing incorrect details — even out of helpfulness — can lead to a charge of perverting the course of justice, which carries a potential prison sentence and is far more serious than the original s.172 offence.

:::`,
    },
    {
      eyebrow: "Convicted Without Knowing?",
      heading: "If You Were Convicted in Your Absence — Two Routes Back",
      body: `One of the most common situations I deal with in s.172 cases is a client who received no court summons — or whose summons went to the wrong address — and who was convicted in their absence without ever knowing a court date had been set. They discover the conviction when points appear on their licence, when bailiffs contact them, or when insurance renewal is rejected.

There are two procedural routes to address this, depending on the timing.

::: cards

##### Within 21 days of discovering the conviction

#### Statutory Declaration — An Absolute Right

A statutory declaration under s.14 of the Magistrates' Courts Act 1980 is a formal sworn statement that you had no knowledge of the court proceedings. Made within 21 days of discovering the conviction, it **sets aside the conviction as of right** — the magistrates cannot refuse it within that period.

1. Obtain the declaration form from the convicting court (or through a solicitor)
1. Swear the declaration before a magistrate, solicitor, or other authorised person — stating under oath that you had no knowledge of the proceedings
1. The conviction is immediately set aside. All points and fines imposed flow from it are void
1. The prosecution restarts from the beginning — you will be required to enter a plea. The case is not automatically dismissed; it is reset

###### Act within 21 days. Do not delay. The clock runs from the date you discovered the conviction — not the date of the conviction itself.

---

##### After 21 days — or where the 21-day limit has expired

#### Section 142 Application — Interests of Justice

Where more than 21 days have passed since discovering the conviction, you can apply under section 142 of the Magistrates' Courts Act 1980 to re-open the case in the interests of justice. This is at the court's discretion, not a right — and it requires a persuasive argument.

1. Apply in writing to the convicting court, explaining the circumstances, the delay, and why reopening is in the interests of justice
1. The court lists a hearing. The application is made orally and is considered by the magistrates, who may grant or refuse it
1. If granted, the conviction may be set aside and the case reheard. If refused, an appeal to the Crown Court is possible (out of time, with permission)

###### A s.142 application is more likely to succeed the sooner it is made after discovering the conviction, and where the reason for non-attendance was genuinely beyond the defendant's control.

:::

::: note

#### Stat dec does not end the prosecution — it restarts it

A statutory declaration sets aside the conviction but does not dismiss the proceedings. The prosecution can — and usually will — lay fresh information and proceed again. You will need to attend a new hearing and enter a plea. The advantage is that you now have the opportunity to defend the case properly, with legal representation, rather than having been convicted in your absence.

Whether making a statutory declaration is advisable in your specific case depends on whether you have a genuine defence to the original charge. If you were, on balance, going to be convicted anyway, restarting the proceedings may not produce a better outcome — and could result in the same or worse sentence. I advise on this specifically after reviewing the facts.

:::`,
    },
    {
      eyebrow: "Penalties & Consequences",
      heading: "The Penalty — and Why It Often Feels Disproportionate",
      body: `Failing to provide driver details under s.172 is a summary-only offence, heard only in the Magistrates' Court. The penalty — 6 mandatory points and a fine of up to £1,000 — is deliberately set higher than many of the original offences that trigger it. The purpose is deterrence: the legislature wanted there to be a strong incentive to respond.

The result is that a driver who received a notice about a minor speeding offence — perhaps worth 3 points and a £100 fine — can end up with 6 points and a £1,000 fine simply for not responding in time. In totting-up terms, this is often the more consequential charge.

::: cards

#### Totting Up

6 points from a s.172 conviction may take you to 12 — triggering a court summons and probable 6-month totting ban. Add the points from the original offence and the position becomes serious very quickly.

---

#### New Drivers

6 or more points within 2 years of passing triggers automatic licence revocation. A single s.172 conviction is enough to lose the licence entirely for a new driver.

---

#### Employment

This is a criminal conviction. It appears on standard and enhanced DBS checks and on DVLA records. Driving roles, roles requiring a clean licence, and roles involving security clearance are all affected.

---

#### Professional Registration

Doctors, nurses, pilots, and other regulated professionals may have obligations to report criminal convictions to their employer or regulator.

---

#### Insurance

The endorsement affects insurance premiums on renewal. The code remains on the licence for 4 years from the offence date; disclosure to insurers is typically required for 5 years.

---

#### International Travel

A criminal conviction can affect visa applications and border entry for the US, Canada, Australia, and other countries that require disclosure of criminal records.

:::`,
    },
    {
      eyebrow: "How the Case Progresses",
      heading: "What Happens at Each Stage",
      body: `::: steps

#### Receiving the NIP and Section 172 Notice

The two notices often arrive in the same envelope. The NIP informs you of the alleged original offence. The s.172 notice requires you to identify the driver within 28 days. You are not required to admit the original offence — only to identify who was driving.

Check the date the envelope was postmarked and the date shown on the NIP. If the NIP was sent more than 14 days after the alleged offence, this needs investigating before you respond to anything.

---

#### Responding — or Deciding to Raise Reasonable Diligence

If you know who was driving, provide their details promptly and accurately. Send by recorded delivery and keep a copy of what you sent.

If you do not know who was driving, take legal advice before the 28-day deadline. You may have a reasonable diligence defence — but it needs to be properly documented and the evidence gathered now, while it is still available. Waiting until you are charged is too late to build an effective defence.

---

#### Charge and First Hearing

If no satisfactory response is received, you will be charged with failing to provide driver details under s.172 — often alongside the original offence. The first hearing will be listed in the Magistrates' Court. You will enter a plea.

At this stage, I advise on whether to contest the charge (reasonable diligence, non-receipt, or a procedural defence) or to enter a guilty plea with mitigation — and whether there is any basis to challenge the original offence simultaneously.

---

#### Trial or Sentencing

At trial, I challenge the prosecution's case — examining whether the notice was validly served, whether the response was sent and lost, or whether the reasonable diligence defence is established. The evidential burden on the reasonable diligence argument is on you, and preparation matters.

At sentencing, I present the circumstances of the failure and any mitigating factors. In cases where totting-up is also live, I prepare and present exceptional hardship arguments at the same hearing.

:::`,
    },
    {
      heading: "Possible Outcomes",
      body: `::: cards

#### Acquittal — Reasonable Diligence Proved

The court finds that you did not know and could not with reasonable diligence have ascertained who the driver was. No conviction, no endorsement on the licence.

---

#### Case Dismissed — Procedural Challenge

The NIP was out of time, the notice was not validly served, or you can show you responded within 28 days. The case is dismissed. No conviction, no points.

---

#### Conviction Set Aside — Statutory Declaration

You were convicted in absence, make a statutory declaration within 21 days, and the conviction is set aside. The case restarts with the opportunity to enter a proper plea and defend the charge.

---

#### Guilty — Mitigation Minimises Sentence

Where conviction is unavoidable, effective mitigation can influence the fine level and — where totting is live — an exceptional hardship argument may prevent a ban despite the points being imposed.

:::`,
    },
    {
      eyebrow: "My Service",
      heading: "How I Help — Section 172 Cases",
      body: `Section 172 cases reward early action, thorough documentation, and an understanding of where the defences are. Many clients come to me having already been charged — or, worse, having already been convicted in their absence. In most of those cases, there is still something to be done. But the options narrow the longer the situation is left.

::: steps

#### Before the Deadline — Best Outcome Available

If you have received a s.172 notice and are within the 28-day period, this is the best moment to take advice. I assess the NIP for validity, advise on whether a reasonable diligence defence is potentially available, and — if it is — help you begin gathering and documenting the evidence that defence will require.

---

#### Evidence Review and Procedural Challenges

I examine the NIP, the s.172 notice, the date of the alleged offence, the date of posting, and any response you sent. I check whether the notice was validly served, whether the 14-day NIP rule was met, and whether there are any deficiencies in the prosecution's paperwork. These are often decisive — and frequently missed without specialist advice.

---

#### Reasonable Diligence — Building the Defence

If the reasonable diligence defence is available, I work with you to document every step you took to identify the driver. Courts require more than a statement that you tried — they want evidence of the steps taken, the people contacted, the records reviewed, and why, despite those steps, it was genuinely not possible to identify the driver. I prepare this case carefully, including preparation for cross-examination.

---

#### Statutory Declaration — Urgent Action for Convictions in Absence

If you have been convicted in your absence and discover this within 21 days, I can arrange for a statutory declaration to be made quickly — often within days. This is time-critical and cannot be delayed. I assess whether making the declaration is strategically advisable in your case, and prepare you for the subsequent hearing.

---

#### Exceptional Hardship — Where Points Push You to 12

Where a s.172 conviction — combined with any other existing points — takes you to or above 12, the totting provisions are triggered. I prepare and present exceptional hardship arguments alongside the s.172 case. The two hearings can often be dealt with together.

:::`,
    },
    {
      eyebrow: "Why Instruct Me",
      heading: "Technical Knowledge. Early Action. Personal Service.",
      body: `Section 172 cases are easy to mishandle and difficult to recover once the wrong steps have been taken. Clients who guess, name the wrong person, miss the 28-day deadline without documenting their diligence, or ignore a summons until conviction often end up in a worse position than necessary. The cases that are handled well are the ones where advice was taken at the right moment.

I qualified in 2005 and have worked in criminal and motoring defence throughout my career. I have dealt with s.172 cases at every stage — from notices received on day one to statutory declarations made three weeks after an unexpected conviction. I know where the defences are and how to present them.

My fees are fixed and stated upfront. My initial consultation is free. If you have received a s.172 notice — whether you know who was driving or not — call me before you respond.`,
    },
  ],
  alertTitle: "Convicted Without Knowing?",
  alertBody:
    "You have 21 days from discovering the conviction to make a statutory declaration and set it aside. Call immediately — this is time-critical.",
  quote:
    "The s.172 penalty is often heavier than the original offence. Reasonable diligence is a real defence — but it needs evidence, not just a statement. The time to build that evidence is now, not after the deadline.",
  quoteCite: "John Violaris",
  relatedLinks: [
    { label: "Speeding & Totting Up", href: "/services/speeding" },
    { label: "Exceptional Hardship", href: "/services/exceptional-hardship" },
    { label: "Mobile Phone Offences", href: "/services/mobile-phone" },
    { label: "All Services", href: "/services" },
    { label: "Fees", href: "/fees" },
  ],
  ctaHeading: "Received a section 172 notice?",
  ctaEmphasis: "Call me before the 28-day deadline.",
};

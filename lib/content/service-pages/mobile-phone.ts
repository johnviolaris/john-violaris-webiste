import type { ServiceDetail } from "@/lib/content/service-detail";

/**
 * Mobile Phone Driving Offence: the page as John wrote it, from `jv-mobile-phone.html`.
 *
 * Section bodies are written in the markup described in
 * `lib/content/service-markup.ts`.
 */
export const mobilePhone: ServiceDetail = {
  headline: "Mobile Phone Driving Offence —",
  emphasis: "Six Points Is Not a Minor Matter",
  intro:
    "A mobile phone charge carries 6 penalty points — the same as a serious speeding offence. For anyone close to 12 points, or who has held their licence for less than two years, a single fixed penalty can end your driving licence entirely. Before you accept anything, understand your position.",
  penalties: [
    { label: "6 penalty points", note: "Standard endorsement", tone: "risk" },
    { label: "£200 minimum fine", note: "Fixed penalty", tone: "risk" },
    { label: "Up to £1,000", note: "If case goes to court (£2,500 for HGV/bus/coach)", tone: "risk" },
    { label: "Licence revocation", note: "New drivers — 6 pts within 2 years of passing", tone: "note" },
    { label: "3 points possible", note: "Alternative charge (Reg. 104) in some cases", tone: "note" },
  ],
  lead:
    "The law changed fundamentally in March 2022. **The old \"interactive communication\" loophole is closed.** Any use of a handheld device while driving is now an offence — scrolling, taking photos, changing music, or simply holding the phone. But the prosecution still has to prove the elements of the charge. That is where challenge is possible.",
  sections: [
    {
      eyebrow: "The Offence",
      heading: "What the Law Now Prohibits — and What Changed in 2022",
      body: `Using a handheld mobile phone while driving has been an offence since December 2003, under **Regulation 110 of the Road Vehicles (Construction and Use) Regulations 1986**. But the original law was written for a narrower world — one where mobile phones were primarily used for calls and texts. As smartphones became capable of camera, music, maps, games, and hundreds of other standalone functions, a legal gap opened.

In 2019, the High Court held in *DPP v Barreto* that a driver who had filmed a road accident on his phone was not guilty, because the camera function was not "interactive communication." That case accelerated legislative change.

::: note

#### March 2022 — The law was completely rewritten

On **25 March 2022**, the Road Vehicles (Construction and Use) (Amendment) (No.2) Regulations 2022 came into force. The amended Regulation 110 now covers **any use of a handheld device** — regardless of what the driver was doing with it. The old loophole exploited in Barreto no longer exists.

The offence now applies to any device "capable of interactive communication" — even if that functionality was not enabled at the time. A driver can no longer argue they were "just taking a photo" or "changing a playlist." Any use while holding the device is caught.

:::

::: cards

#### Prohibited — an offence under Reg. 110

- Making or receiving calls
- Sending or reading texts, messages, emails
- Scrolling through social media or apps
- Taking photos or videos
- Changing music or adjusting playlists
- Playing games or using apps
- Using maps or GPS on the device
- Holding the phone to check notifications
- Unlocking the screen

---

#### Permitted — exemptions under current law

- Hands-free use — Bluetooth, voice command, or cradle — provided you do not touch or interact with the device
- Emergency calls to 999 or 112 only, where it is unsafe or impractical to stop
- Contactless payment at a drive-through terminal — while stationary at the point of sale
- Use of a two-way radio (not covered by Reg. 110)
- Safely and legally parked, engine switched off

:::

::: warning

#### Hands-free is not automatically safe

Using a phone in a cradle, via Bluetooth, or through voice commands is not prohibited by Regulation 110 — but it can still lead to prosecution. If the police consider your hands-free use caused you to lose proper control of the vehicle, or that it constituted careless or dangerous driving, a separate charge can follow. The absence of a Reg. 110 offence does not mean you are beyond the reach of the law.

:::

### What the Prosecution Must Prove

Despite the breadth of the 2022 changes, the prosecution still has to prove all elements of the offence to the criminal standard. That gives the defence genuine scope to challenge cases — particularly those relying on officer observation or poor-quality footage.

| Element | What it requires | Challenge points |
| --- | --- | --- |
| **The person was driving** | The vehicle must have been in motion, or the driver must have been in a position to set it in motion. Being stationary at lights or in traffic normally counts. Being parked in genuine gridlock for an extended period may not. | Gridlock / truly stationary argument in some cases |
| **On a road or public place** | The offence applies on roads and in public places, including some private car parks where the public has access. It does not apply on entirely private land. | Private land cases; access disputes |
| **The device was held** | The device must have been held by the driver at some point during the use. A device in a cradle not touched by the driver does not satisfy this element. | Cradle cases; passenger holding phone; misidentification of object |
| **The device was used** | Post-2022, any use of a device capable of interactive communication is sufficient. Even holding the phone while looking at it may be use in some circumstances. | Evidence of what use was being made; quality of police observation |
| **The driver was the defendant** | In many cases, particularly roadside stops, identity is straightforward. In camera cases, the prosecution must establish that the defendant was the person driving. | Camera image quality; identity challenges |`,
    },
    {
      eyebrow: "The Alternative Charge",
      heading: "3 Points Instead of 6 — When Regulation 104 Applies",
      body: `One of the most important — and least well-known — aspects of mobile phone cases is the availability of an alternative, lesser charge. In some cases it is possible to negotiate a resolution under **Regulation 104 of the Road Vehicles (Construction and Use) Regulations 1986** — "driving not in proper control of a vehicle" — rather than the Regulation 110 phone offence.

::: cards

##### 6 Penalty Points

#### Regulation 110

Using a handheld device while driving. The standard mobile phone charge. Fixed penalty of £200 (minimum). Fine up to £1,000 at court. CW10 endorsement on licence for 4 years.

###### CW10 endorsement

---

##### 3 Penalty Points

#### Regulation 104

Driving not in proper control of a vehicle. An alternative charge that carries half the points. Fixed penalty available. This difference can mean the difference between keeping and losing your licence.

###### CW30 endorsement

:::

The Regulation 104 charge is available where the issue is one of control rather than communication — for example, where a driver was distracted by a device but the specific use is disputed, or where the evidence on whether the phone was genuinely being used is unclear. It can also arise where the prosecution is persuaded that the evidence does not firmly establish all elements of the Reg. 110 charge but does establish a loss of proper control.

Whether this reduction is available depends on the evidence, the attitude of the prosecution, and how the case is presented. It is most likely to be achievable at an early stage, before the case reaches trial. I assess this route in every mobile phone case I take on.

::: note

#### Why 3 points can be the difference between everything and nothing

Six points takes most drivers halfway to a mandatory totting ban. If you already have 6 points — for any offence — a Reg. 110 conviction takes you straight to 12 and triggers a court summons and a probable 6-month ban. Three points instead keeps you under that threshold. The Regulation 104 alternative can therefore be decisive, and it is worth examining in every case before any plea is entered.

For new drivers — those within 2 years of passing their test — even 6 points triggers automatic licence revocation. Three points allows them to keep their licence entirely. The calculation is stark.

:::`,
    },
    {
      eyebrow: "Defences & Challenges",
      heading: "Where These Cases Can Be Challenged",
      body: `The 2022 law changes made it harder to argue the phone was being used for a non-prohibited purpose. But the prosecution still needs evidence — and that evidence, in most cases, comes from a police officer's observation, dashcam footage, or CCTV. Each of those can be challenged.

I look carefully at the evidence in every case before advising on plea. The following are the main areas of challenge.

::: cards

##### The Object

#### Was it definitely a phone?

The prosecution must prove the object held was a device capable of interactive communication. In cases relying on police observation rather than seized evidence, the officer must be able to confirm what was held. An MP3 player, a wallet, a card reader, or another object is not a handheld device for the purposes of Reg. 110. The prosecution has the burden of proof — if it cannot discharge it, you cannot be convicted.

---

##### The Holding

#### Was it actually held by the driver?

The device must have been held by the driver — not by a passenger, not in a cradle, not resting on the seat. Where observation evidence is from a distance or a moving vehicle, the identification of who was holding what requires scrutiny. Poor quality footage or a brief sighting at speed may not establish this to the required standard.

---

##### Evidence Quality

#### Does the footage actually prove what it appears to show?

Dashcam footage, body-worn video, and CCTV can all be challenged on quality, continuity, and admissibility. If footage is unclear, has been edited, lacks a supporting section 9 statement from the owner, or cannot be properly authenticated, it may not be admissible or may not establish the offence. I examine all footage before advising on whether it creates a viable challenge.

---

##### Emergency Exception

#### Were you calling 999 in a genuine emergency?

A statutory exemption permits the use of a handheld device to call 999 or 112 where it is genuinely unsafe or impractical to stop. The emergency must be real and immediate. This defence requires careful preparation — the court will scrutinise whether stopping was truly impractical and whether the call was genuinely to the emergency services.

---

##### Identity

#### Was the driver correctly identified?

In cases based on camera evidence rather than a roadside stop, the prosecution must establish that you were the driver. Where the image quality is poor, the vehicle obscures the driver's features, or there is genuine doubt about identification, this is a real challenge. In roadside cases, misidentification is rarer but not impossible — particularly where a passenger may have been holding the device.

---

##### Driving Status

#### Were you actually driving?

The offence requires the person to be driving. In genuine gridlock where the vehicle has been stationary for an extended period with no realistic prospect of moving, there is an argument — though a limited one — that the driver was not at that moment driving. This is highly fact-specific and rarely succeeds, but it merits consideration where the circumstances support it.

:::

### Evidence the Police Rely On — and How It Can Be Challenged

::: cards

#### Police Observation

Most roadside cases rely on an officer's testimony. I examine the officer's position, the distance, the duration of observation, speed of both vehicles, and the quality of the view. A brief sighting from a moving vehicle at distance may not be sufficient to prove the charge.

---

#### Dashcam / CCTV Footage

Footage must be authenticated, clearly show the driver holding and using a device, and be accompanied by a proper s.9 statement from whoever submitted it. Footage that is blurry, incomplete, or cannot be properly attributed may be inadmissible or insufficient.

---

#### Phone Records

The prosecution can obtain phone billing records to show activity at the relevant time. Call logs, message timestamps, and app activity can corroborate the allegation. Where records show no activity, this can support a not guilty plea — or prompt a prosecution to reconsider.

:::`,
    },
    {
      eyebrow: "Penalties & Consequences",
      heading: "The Full Picture — Beyond the Fixed Penalty",
      body: `Most drivers offered a fixed penalty accept it without fully understanding the cumulative effect on their licence. Six points is not an abstract number — it has real implications that vary depending on how many points you already have, how long you have held your licence, and what you do for a living.

::: cards

#### Totting Up Risk

Six points takes you to or beyond 12 if you already have six from any previous offence. That triggers a court summons and a probable minimum 6-month ban. Before you accept any penalty, check your points total — it changes the entire calculation.

---

#### New Drivers

Any driver within 2 years of passing their test who reaches 6 points has their licence automatically revoked. They must re-apply for a provisional licence and retake both theory and practical tests. A single fixed penalty is enough to trigger this.

---

#### Employment

Professional drivers — HGV licence holders, taxi drivers, delivery drivers — face employer disclosure obligations and potential loss of occupational licences. Non-driving roles may also be affected where driving is a requirement of the job.

---

#### Professional Registration

Doctors, nurses, pilots, and other regulated professionals may have obligations to report convictions to their employer or professional body. The obligation varies by profession and the severity of any penalty imposed.

---

#### Insurance

The CW10 endorsement stays on your DVLA record for 4 years from the offence date. Insurers require disclosure, typically for 5 years, and premiums will rise. For young drivers especially, the cost over time can be significant.

---

#### International Travel

If the case goes to court and results in a conviction, it creates a criminal record that may require disclosure on visa applications for the US, Canada, Australia, and other countries. A fixed penalty, by contrast, does not normally create a criminal record entry.

:::

::: warning

#### Fixed penalty ≠ no consequences

Accepting a fixed penalty notice is not like accepting a parking ticket. It is an acceptance of a conviction. The 6 points are endorsed on your licence, your insurer may need to be told, and the endorsement stays for 4 years. If you already have points, it could tip you into a totting ban. For new drivers it can revoke the licence entirely. **Before accepting any fixed penalty for a mobile phone offence, check your current points total and consider your options.**

:::`,
    },
    {
      eyebrow: "How the Case Progresses",
      heading: "What Happens at Each Stage",
      body: `Many mobile phone cases never reach court — they are resolved by fixed penalty or negotiation. But some do, particularly where the driver contests the evidence, has too many points to accept a fixed penalty, or where the case arises alongside other charges. Here is what each stage involves.

::: steps

#### Roadside Stop or Notice of Intended Prosecution

The case may begin with a roadside stop — where the police observe the phone use directly — or with a Notice of Intended Prosecution arriving by post, based on dashcam footage submitted by another driver or police camera evidence.

If you receive a NIP, it must have been sent to the registered keeper of the vehicle within **14 days of the alleged offence**. If it was not, a complete defence may be available. I check NIP validity in every case.

---

#### Conditional Offer of Fixed Penalty

In most cases, you will be offered a Conditional Fixed Penalty Notice — £200 and 6 points. You can accept it (pay the fine and accept the endorsement) or reject it and go to court.

You cannot accept a fixed penalty if doing so would take you to 12 or more points — the matter will automatically proceed to court. At that stage, the magistrates will deal with both the offence and the totting-up question.

Before accepting, I recommend checking your current points total and assessing whether the Reg. 104 reduction or any other challenge is worth pursuing. This is the moment when advice has the most effect.

---

#### First Hearing — Magistrates' Court

If the matter goes to court — because you reject the fixed penalty or because your points total means you cannot accept it — the case will be listed in the Magistrates' Court. You will be asked to enter a plea.

Before that hearing, I will have reviewed all the evidence, assessed the Reg. 104 alternative, and advised you on realistic prospects. If there are grounds to contest the charge, I prepare the defence. If a guilty plea is the better course, I prepare mitigation — including exceptional hardship where the totting threshold is engaged.

---

#### Trial or Sentencing

At trial, the prosecution must prove each element of the charge. I cross-examine the officer's evidence, challenge any footage, and present the defence case. The magistrates decide whether the charge is proved.

At sentencing — following a guilty plea or conviction — I present mitigation. In cases where totting is also live, I prepare and present the exceptional hardship argument at the same hearing.

:::`,
    },
    {
      heading: "Possible Outcomes",
      body: `::: cards

#### Acquittal

The prosecution fails to prove the charge. No conviction, no endorsement. The most common route is successfully challenging the evidence — footage quality, misidentification, or doubt about whether the device was genuinely held.

---

#### Reduced to Reg. 104

Prosecution accepts the lesser charge of driving without proper control — 3 points instead of 6. Can be decisive where totting-up or new driver status means the extra points are the difference between keeping and losing a licence.

---

#### No Further Action / Discontinuance

The prosecution decides not to pursue the case — because the evidence is insufficient, a procedural error has been identified, or the NIP was not validly served. This ends the matter entirely.

---

#### Guilty Plea — Minimise the Damage

Where conviction is likely, a timely guilty plea and effective mitigation can influence the fine and — where totting is live — the exceptional hardship argument determines whether you keep your licence.

:::`,
    },
    {
      eyebrow: "My Service",
      heading: "How I Help — Mobile Phone Cases",
      body: `Mobile phone charges are sometimes treated as minor traffic matters. They are not. Six points, a potential ban, a criminal record if the case goes to court, and the knock-on effects on insurance and employment deserve a considered response — not a reflex acceptance of a fixed penalty.

::: steps

#### Early Advice — Before You Respond to Anything

Whether you have been stopped at the roadside or received a NIP or fixed penalty offer, the most important step is to understand your current points position and the full range of options before you decide anything. I give you that picture quickly and clearly, including whether the Reg. 104 reduction is worth pursuing and whether the fixed penalty should be accepted at all.

---

#### Full Evidence Review

I examine the prosecution evidence — officer notes, dashcam or CCTV footage, phone records, and the NIP itself. I look at what was captured, how clearly, whether the footage is admissible, whether the NIP was validly served within 14 days, and whether the driver was correctly identified. These questions can determine whether there is a viable challenge before the case gets anywhere near trial.

---

#### The Regulation 104 Reduction

I assess in every mobile phone case whether the prosecution is open to accepting a plea to the lesser charge of driving without proper control under Regulation 104. This carries 3 points rather than 6 and a CW30 endorsement. In cases where the evidence is ambiguous or where the distinction matters critically to the client's licence, this is a route worth pursuing and I pursue it proactively.

---

#### Court Representation

I attend the hearing personally and present the strongest available case — whether contesting the charge or, where the focus is on sentence, presenting mitigation and exceptional hardship. You have one solicitor throughout.

---

#### Exceptional Hardship — Where Totting Is Also Live

Where a mobile phone conviction would take you to 12 points, the totting-up provisions are triggered and the court must consider a minimum 6-month ban unless exceptional hardship is proved. I prepare and present these arguments alongside the mobile phone case — so the hearing addresses both issues together, with full preparation for each.

:::`,
    },
    {
      eyebrow: "Why Instruct Me",
      heading: "Attention to Detail. Personal Service. Honest Advice.",
      body: `Mobile phone cases can be simple — or they can be the thing that costs a driver their licence, their job, and their ability to work. The distinction depends on how many points the driver already has, whether they are within 2 years of passing their test, and whether the evidence genuinely proves what the prosecution says it does.

I have been advising on motoring offences since qualification in 2005. I know where these cases can be challenged, what makes the Reg. 104 argument viable, and how to run a meaningful totting-up hearing alongside a mobile phone case. My fees are fixed and stated upfront, and my initial consultation is free.

If you have received a fixed penalty, a NIP, or a court summons for a mobile phone offence, and you have any points already on your licence — call me before you do anything else.`,
    },
  ],
  alertTitle: "Already have 6 points?",
  alertBody:
    "A further 6 puts you at 12 — straight to a court summons and probable 6-month ban. Before accepting a fixed penalty, check your total. Call me first.",
  quote:
    "The fixed penalty is not the only option. In some cases, the evidence doesn't prove what the prosecution says it proves. In others, three points instead of six makes all the difference. Neither of those routes is available unless someone looks.",
  quoteCite: "John Violaris",
  relatedLinks: [
    { label: "Speeding & Totting Up", href: "/services/speeding" },
    { label: "Exceptional Hardship", href: "/services/exceptional-hardship" },
    { label: "Careless Driving", href: "/services/careless-driving" },
    { label: "Special Reasons", href: "/services/special-reasons" },
    { label: "All Services", href: "/services" },
    { label: "Fees & Pricing", href: "/fees" },
  ],
  ctaHeading: "Received a mobile phone charge?",
  ctaEmphasis: "Check your points before you accept anything.",
};

import type { ServiceDetail } from "@/lib/content/service-detail";

/**
 * Totting Up: the page as John wrote it, from `totting-up.html`.
 *
 * Section bodies are written in the markup described in
 * `lib/content/service-markup.ts`.
 */
export const tottingUp: ServiceDetail = {
  headline: "Totting up.",
  emphasis: "Know your points. Know your options.",
  intro:
    "Penalty points add up quickly. A driver with an established licence who reaches 12 points within three years faces a minimum six-month ban. A new driver can lose their licence at just 6 points. Many drivers don't know exactly where they stand until a court letter arrives. I'll work out your position precisely and tell you honestly what can be done.",
  penalties: [
    {
      kicker: "The threshold",
      label: "12 points in 3 years",
      note: "Means a minimum six-month ban under s.35 of the Road Traffic Offenders Act 1988.",
      tone: "risk",
    },
    {
      kicker: "New drivers",
      label: "6 points in 2 years",
      note: "Means your licence is revoked, and you must pass the theory and practical tests again.",
      tone: "risk",
    },
    {
      kicker: "Previous bans",
      label: "1 or 2 years",
      note: "The minimum ban rises if you have been banned before within the relevant period.",
      tone: "risk",
    },
    {
      kicker: "The way out",
      label: "Exceptional hardship",
      note: "If the court accepts that a ban would cause exceptional hardship, it can impose a shorter ban or none at all.",
      tone: "note",
    },
  ],
  sections: [
    {
      eyebrow: "Legal framework",
      heading: "The legal framework: how your points are worked out",
      body: `### The three-year window

The court counts the points for your new offence plus any earlier points from offences **committed** within three years of it. The dates that matter are the dates of the offences, not when you were convicted or when the points appeared on your record. Points for offences committed more than three years before the new offence are left out.

::: note

#### Example

Speeding on 1 March 2024 (3 points), a red light on 10 January 2025 (3 points), then a mobile phone offence on 5 June 2026 (6 points). All three offences fall within three years of each other, so the total is 12 and a ban must be considered. If the first speeding offence had been on 1 May 2023, it would fall outside the window when measured from 5 June 2026, and the total would be 9.

:::

### "Live" points and points on your record are not the same

Most endorsements stay on your driving record for four years. Some serious offences, such as drink and drug driving, stay for 11 years. But for totting up, a point only counts for three years, measured from offence to offence. So your record can show points that no longer count towards 12. Insurers and employers may still see them.

### When points come off

- **Over time:** a point stops counting for totting up once three years have passed between that offence and a new one. DVLA removes most expired endorsements from your record automatically when they expire.
- **After a totting-up ban:** when you are banned under the totting-up rules, the points that led to it are not counted again on future convictions. You start afresh.
- **Other bans do not clear your points.** This rule applies only to totting-up bans. A ban for a different reason, such as drink driving or a discretionary ban for speeding, does not wipe the points already on your licence.

### The minimum ban

##### Totting-up minimum disqualification (s.35 RTOA 1988)

| Previous disqualifications that count | Minimum ban |
| --- | --- |
| None | 6 months |
| One | 1 year |
| More than one | 2 years |

A previous ban only counts if it lasted 56 days or more and was imposed within the three years before your latest offence.`,
    },
    {
      eyebrow: "New drivers",
      heading: "New drivers: the six-point rule",
      body: `For two years after you pass your first driving test, the limit is 6 points, not 12. This comes from the Road Traffic (New Drivers) Act 1995.

- **Reach 6 points within two years of passing, and your licence is revoked.** This is done by the DVLA, not by the court. It happens automatically once the points are on your record, and exceptional hardship cannot stop it.
- **Points from your provisional licence count.** If you had unexpired points as a learner, they carry over to your full licence. Further points that take you to 6 within two years of passing will trigger revocation.
- **Getting your licence back.** You must apply and pay for a new provisional licence, drive as a learner again, and pass **both** the theory and practical tests.
- **One offence can be enough.** A single mobile phone offence (6 points), or two speeding offences at 3 points each, will do it.
- **Fixed penalties count too.** Paying a fixed penalty fine and accepting points by post has the same effect as points imposed by a court.

::: warning

If you are within two years of passing and facing an offence that could take you to 6 points, speak to me *before* you accept a fixed penalty or enter a plea. Once the points are on your record, revocation follows automatically. The options depend on dealing with the case before that point.

:::`,
    },
    {
      eyebrow: "Check your points",
      heading: "Check your points",
      body: `You can view your driving record for free on GOV.UK. It shows your current penalty points, the offence codes, any bans, and when each endorsement will be removed.

- Go to [gov.uk/view-driving-licence](https://www.gov.uk/view-driving-licence)
- You will need your **driving licence number**, your **National Insurance number** and the **postcode** on your licence.
- The service covers licences issued in England, Wales and Scotland.
- You can also create a **check code**, valid for 21 days, to share your record. I may ask for one so I can see your record exactly as the court will.

###### The dates on your record show when each endorsement will be *removed*, not whether it still counts towards 12. Use the three-year offence-to-offence rule above, or send me your record and I'll work it out for you.`,
    },
    {
      eyebrow: "Clarity first",
      heading: "Clarity first. Then the ways to avoid a ban.",
      body: `Reaching 12 points does not automatically mean you will be banned. The options, in the order I consider them:

::: steps

#### Challenge the offence

If you are not convicted, no points are added. I look at the evidence, the paperwork and any procedural requirements, such as the Notice of Intended Prosecution in speeding cases.

---

#### Special reasons

For some offences, if there were special reasons connected with the offence itself, the court can decide not to add points. A genuine emergency is one example.

---

#### Exceptional hardship

If you reach 12 points, you can ask the court not to ban you, or to impose a shorter ban, because a ban would cause exceptional hardship to you or to others.

:::

### Exceptional hardship in brief

Exceptional hardship is the main route for drivers who reach 12 points. The bar is deliberately high. The court accepts that almost every ban causes hardship, so you must prove that your hardship goes well beyond the usual. That might be the impact on a family member who depends on you, a medical need, or a business and its staff. The burden is on you to prove it on the balance of probabilities. You will normally need to **give evidence under oath**, supported by documents. If you succeed, the 12 points stay on your licence. You also cannot rely on the same circumstances again within three years.

[Read the full Exceptional Hardship guide](/services/exceptional-hardship)

###### Exceptional hardship only applies to totting-up bans. It cannot be used to avoid the compulsory ban for offences such as drink driving. In those cases, the narrower "special reasons" route may be available instead.`,
    },
    {
      eyebrow: "What to share with me",
      heading: "What to share with me",
      body: `- **Your court paperwork**: the summons or postal requisition, or the Single Justice Procedure notice, with the hearing date or response deadline.
- **Your driving record**: a check code from [GOV.UK](https://www.gov.uk/view-driving-licence), or a screenshot of your record.
- **The date you passed your test**, if it was within the last two years.
- **Any Notice of Intended Prosecution or fixed penalty** you have received for the new offence. Don't accept or pay it until we have spoken if it could take you to 6 or 12 points.
- **What a ban would mean** for you, your work and the people who rely on you. This is the starting point for any exceptional hardship argument.`,
    },
    {
      eyebrow: "Personal representation",
      heading: "Personal representation",
      body: `When you instruct me, you deal with me directly, from checking your points to the final hearing. I have over 20 years' experience of criminal defence and represent clients at magistrates' courts across England and Wales. I will give you an honest view of whether a ban can be avoided and what it will take.

You will know the cost before you commit. My fees are fixed for each stage, agreed in writing, and your first 30-minute conversation is free.

Speak to me for free and I'll honestly assess your situation.

###### This page is general information about the law in England and Wales as at November 2026. It is not advice on your specific circumstances, and no outcome can be guaranteed.`,
    },
  ],
  relatedLinks: [
    { label: "Exceptional Hardship", href: "/services/exceptional-hardship" },
    { label: "Speeding", href: "/services/speeding" },
    { label: "Special Reasons", href: "/services/special-reasons" },
  ],
};

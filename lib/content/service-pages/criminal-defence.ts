import type { ServiceDetail } from "@/lib/content/service-detail";

/**
 * All Crime (`/services/criminal-defence`): the page as John wrote it, from
 * `all-crime.html`. His file names the address `/services/all-crime`, which
 * has redirected here since Non-Motoring Crime was retired.
 *
 * Section bodies are written in the markup described in
 * `lib/content/service-markup.ts`.
 */
export const criminalDefence: ServiceDetail = {
  headline: "All crime.",
  emphasis: "Not just a driving solicitor. A criminal defence solicitor first.",
  intro:
    "For over 20 years, most of my work has been defending people accused of crime at the police station and in the magistrates' court. That includes serious and sensitive allegations that go to trial. There are very few offences I haven't dealt with. If you want one experienced solicitor to prepare your case properly and stand beside you from start to finish, you are in the right place.",
  penalties: [
    {
      kicker: "Experience",
      label: "20+ years",
      note: "Defending people accused of crime, across almost every type of offence.",
      tone: "note",
    },
    {
      kicker: "Where I act",
      label: "Police station to trial",
      note: "Interviews, first hearings, trials and sentencing in the magistrates' court.",
      tone: "note",
    },
    {
      kicker: "Who you deal with",
      label: "Me. Every time.",
      note: "I don't hand your case to a colleague or send an agent to court in my place.",
      tone: "note",
    },
    {
      kicker: "Crown Court",
      label: "Still your solicitor",
      note: "If your case goes up, I keep preparing it and a barrister presents it at trial.",
      tone: "note",
    },
  ],
  sections: [
    {
      eyebrow: "Offences I defend",
      heading: "Offences I defend",
      body: `I represent people of all ages and backgrounds, for allegations ranging from the less serious to the very serious. This includes:

- Sexual offences
- Domestic abuse allegations
- Fraud and dishonesty
- Assault and violence
- Harassment and stalking
- Public order
- Theft and handling
- Drugs offences
- Weapons offences
- Criminal damage
- Malicious communications and online offences
- Youth and vulnerable adult cases

I have a particular background in representing young people and vulnerable adults, including at trial. If your allegation isn't listed, ask. The chances are I have dealt with it before.

::: note

You can change solicitor at any stage. You don't have to stay with the firm that represented you at the police station. The earlier I'm involved, the more I can do by gathering evidence, tracing witnesses and planning a defence before the first hearing, not after it.

:::`,
    },
    {
      eyebrow: "Why instruct me privately",
      heading: "Why instruct me privately",
      body: `Most people accused of an imprisonable offence can apply for legal aid. But legal aid pays solicitors fixed, limited fees, and those fees do not cover much of the work it takes to build a complete defence. Instructing me privately means your case gets the time it actually needs:

- **Thorough preparation:** going through the prosecution evidence line by line, chasing unused material, and tracking down the messages, footage and witnesses that support your account.
- **Consistency:** deal with the same solicitor who knows your case inside out.
- **Access:** you can reach me directly, and you won't be passed around an office.
- **Discretion:** sensitive allegations are handled with care and in confidence.

###### Police station advice is free to everyone, whatever their means. If you can't fund your case privately, I can also act for eligible clients under legal aid through the firm I practise with. Ask me about this when we speak.`,
    },
    {
      eyebrow: "Crown Court cases",
      heading: "Crown Court cases",
      body: `Some cases must go to the Crown Court. These are "indictable only" offences, cases where you choose a Crown Court jury trial, and cases sent there for sentence. In these cases, your representation transfers to my sister firm, **Darryl Ingram Solicitors**, and a barrister presents your case in court.

**I stay on as your solicitor.** I continue to prepare your case for trial, work with your barrister, and remain your point of contact. You don't have to start again with someone new.`,
    },
    {
      eyebrow: "What to share with me",
      heading: "What to share with me",
      body: `- **Your paperwork:** the charge sheet or postal requisition, bail conditions, or any letter inviting you to interview.
- **Key dates:** your first court hearing, bail return date or interview date.
- **What the police have told you** about the allegation, and any disclosure given at interview.
- **Anything that supports your account:** messages, emails, photographs, or the names of people who were there. Keep everything and delete nothing.
- **What matters most to you:** your job, family, immigration or professional status. These affect how I plan your case.

###### Don't contact the complainant or any prosecution witness, directly or through others, especially if you are on bail. Speak to me first.`,
    },
    {
      eyebrow: "Personal representation",
      heading: "Personal representation",
      body: `I am a practising duty solicitor. I represent members of the public at the police station and in court every week, under legal aid and privately. I have always been motivated by one thing: giving a voice to people who find themselves caught up in the justice system, whether they are guilty or innocent.

When you instruct me, you get that commitment, my experience and my full attention, from your first call to the end of your case. I will give you my honest assessment, even when it's not what you want to hear. Your first 30-minute conversation is free and in confidence.

Speak to me for free and I'll honestly assess your situation.

###### This page is general information about the law in England and Wales as at November 2026. It is not advice on your specific circumstances, and no outcome can be guaranteed.`,
    },
  ],
  quote:
    "There's nothing more fulfilling than winning a case for someone who hasn't done anything wrong, but a close second is helping someone avoid prison after they admit their mistake.",
  quoteCite: "John Violaris",
  relatedLinks: [
    { label: "Police Station Representation", href: "/police-station" },
    { label: "About John", href: "/about" },
    { label: "Magistrates Court", href: "/services/magistrates-court" },
  ],
};

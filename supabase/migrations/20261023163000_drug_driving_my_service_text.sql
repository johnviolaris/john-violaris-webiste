/*
 * Drug Driving, "My Service" section ("I Can Help — Whatever Stage You're
 * At"): the opening sentence and the four numbered steps (Police Station
 * Advice, Full Evidence Review, Court Representation, Special Reasons &
 * Mitigation) are replaced by two paragraphs, approved by John exactly as
 * written. "Why Instruct Me" is unchanged.
 *
 * Guarded on the section as it is today, so a page someone has since edited
 * in the CMS is left alone. The content revision trigger records the change.
 */

update public.service_pages as p
set content = jsonb_set(
      p.content,
      '{sections,4,body}',
      to_jsonb('My approach is calm, assured and direct. Whether you''re at the start of an investigation or about to be sentenced, I can help you by providing you with clarity and a much better understanding of your case. We can then work towards achieving your ideal outcome. Where an acquittal or discontinuance isn''t possible, I will help you make the best out of a bad situation.

If you have a drug driving case and want to understand your options properly — before you make any decisions — call me for a free initial consultation.'::text)
    ),
    updated_at = now()
from public.services s
where s.id = p.service_id
  and s.slug = 'drug-driving'
  and p.content->'sections'->4->>'eyebrow' = 'My Service'
  and p.content->'sections'->4->>'body' = 'My approach is calm, prepared and direct. At every stage I aim to give you a clear picture of where you stand and what your options are — without unnecessary complexity, and without drama.

::: steps

#### Police Station Advice

I can advise you before interview, at the police station, or as soon as you are contacted by police. Early advice is often the difference between a controlled response and avoidable damage to your position. I have attended police station interviews over 10,000 times since 2003.

---

#### Full Evidence Review

I examine the full evidential picture: the stop, the roadside test, the sample process, the custody record, the laboratory analysis, any prescription or medical history, and whether the prosecution has charged the correct offence. Technical detail is where drug driving cases are genuinely won or lost.

---

#### Court Representation

I represent you at the first hearing and at trial where needed. You deal directly with me at every stage — there are no hand-offs to junior colleagues or case handlers. The solicitor you speak to in consultation is the one who stands up in court.

---

#### Special Reasons & Mitigation

Where a special reasons argument is available, I prepare and present it with the care it requires. Where the focus is on mitigation, I take time to understand your individual circumstances and communicate them to the court in the most effective way possible.

:::';

/*
 * Drug Driving, "How a Drug Driving Case Progresses", "Police Stop & Arrest"
 * step: new wording, approved by John. "legal advice at the police station
 * can be decisive" stays bold. The rest of the section is unchanged.
 *
 * Guarded on the step as it is today, so a page someone has since edited in
 * the CMS is left alone. The content revision trigger records the change.
 */

update public.service_pages as p
set content = jsonb_set(
      p.content,
      '{sections,2,body}',
      to_jsonb(
        replace(
          p.content->'sections'->2->>'body',
          'The police may take a blood or urine sample and record observations about your condition. **Legal advice at the police station can be decisive** — particularly',
          'The police will request a blood or urine sample and record observations about your condition. You should always accept a sample of what they take from you. The procedure cannot be delayed for you to speak to a solicitor, but **legal advice at the police station can be decisive** — particularly'
        )
      )
    ),
    updated_at = now()
from public.services s
where s.id = p.service_id
  and s.slug = 'drug-driving'
  and p.content->'sections'->2->>'heading' = 'How a Drug Driving Case Progresses'
  and p.content->'sections'->2->>'body' like '%#### Police Stop & Arrest

You may be stopped following a positive roadside drug swipe test, observations about your driving, a collision, or an allegation by another person. The police may take a blood or urine sample and record observations about your condition. **Legal advice at the police station can be decisive** — particularly where prescribed medication or a medical condition is relevant.

---%';

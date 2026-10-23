/*
 * Drink Driving, "Where Will the Case Be Heard?": the closing sentence
 * "I represent clients at both." is removed, approved by John, because he
 * represents clients in the Magistrates' Court only. The rest of the
 * paragraph is unchanged.
 *
 * Guarded on the section as it is today, so a page someone has since edited
 * in the CMS is left alone. The content revision trigger records the change.
 */

update public.service_pages as p
set content = jsonb_set(
      p.content,
      '{sections,4,body}',
      to_jsonb('All drink driving cases are heard in the Magistrates'' Court, unless you appeal. Appeals against conviction or sentence are heard in the Crown Court.'::text)
    ),
    updated_at = now()
from public.services s
where s.id = p.service_id
  and s.slug = 'drink-driving'
  and p.content->'sections'->4->>'heading' = 'Where Will the Case Be Heard?'
  and p.content->'sections'->4->>'body' = 'All drink driving cases are heard in the Magistrates'' Court, unless you appeal. Appeals against conviction or sentence are heard in the Crown Court. I represent clients at both.';

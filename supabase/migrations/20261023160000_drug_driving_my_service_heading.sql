/*
 * Drug Driving, "My Service" section: the heading "How I Help — From Arrest
 * to Outcome" becomes "I Can Help — Whatever Stage You're At", approved by
 * John. Failing to Provide a Specimen keeps the old heading. The section's
 * anchor comes from its eyebrow, so it does not change.
 *
 * Guarded on the heading as it is today, so a page someone has since edited
 * in the CMS is left alone. The content revision trigger records the change.
 */

update public.service_pages as p
set content = jsonb_set(
      p.content,
      '{sections,4,heading}',
      to_jsonb('I Can Help — Whatever Stage You''re At'::text)
    ),
    updated_at = now()
from public.services s
where s.id = p.service_id
  and s.slug = 'drug-driving'
  and p.content->'sections'->4->>'eyebrow' = 'My Service'
  and p.content->'sections'->4->>'heading' = 'How I Help — From Arrest to Outcome';

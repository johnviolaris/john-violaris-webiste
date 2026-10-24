/*
 * Failing to Provide a Specimen: the "How the Case Progresses" section
 * ("What Happens, and When", with its four steps) and the "Possible
 * Outcomes" cards that carried on from it are removed, approved by John.
 * They were the fourth and fifth of seven sections; "Lines of Defence" now
 * leads into "My Service", which still says John has attended police station
 * interviews since 2003, over 10,000 times.
 *
 * Guarded on both sections as they are today (their bodies by checksum, as
 * they are long), so a page someone has since edited in the CMS is left
 * alone. The content revision trigger records the change.
 */

update public.service_pages as p
set content = p.content #- '{sections,4}' #- '{sections,3}',
    updated_at = now()
from public.services s
where s.id = p.service_id
  and s.slug = 'failing-to-provide'
  and jsonb_array_length(p.content->'sections') = 7
  and p.content->'sections'->3->>'eyebrow' = 'How the Case Progresses'
  and p.content->'sections'->3->>'heading' = 'What Happens, and When'
  and md5(p.content->'sections'->3->>'body') = '1c85557a3f9942312e2c0d76148626ef'
  and p.content->'sections'->4->>'eyebrow' is null
  and p.content->'sections'->4->>'heading' = 'Possible Outcomes'
  and md5(p.content->'sections'->4->>'body') = '74f682dfe8751804c254f1f643e35455';

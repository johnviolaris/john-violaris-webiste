/*
 * Failing to Provide a Specimen: the "DR31 endorsement" card ("Remains on
 * licence 11 years") is removed from the "At a glance" strip, approved by
 * John. It was the last of four cards; the other three are unchanged. The
 * page body still says the DR31 endorsement stays on the licence for 11 years.
 *
 * Guarded on the card as it is today, so a page someone has since edited in
 * the CMS is left alone. The content revision trigger records the change.
 */

update public.service_pages as p
set content = p.content #- '{penalties,3}',
    updated_at = now()
from public.services s
where s.id = p.service_id
  and s.slug = 'failing-to-provide'
  and jsonb_array_length(p.content->'penalties') = 4
  and p.content->'penalties'->3->>'label' = 'DR31 endorsement'
  and p.content->'penalties'->3->>'note' = 'Remains on licence 11 years';

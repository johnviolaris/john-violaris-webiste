/*
 * Failing to Provide a Specimen: the "My Service" section ("How I Help —
 * From Arrest to Outcome", with its opening paragraph and five steps) is
 * removed, approved by John. It was the fourth of five sections; "Lines of
 * Defence" now leads into "Why Instruct Me". John's pull quote is a separate
 * field and stays.
 *
 * Guarded on the section as it is today (its body by checksum, as it is
 * long), so a page someone has since edited in the CMS is left alone. The
 * content revision trigger records the change.
 */

update public.service_pages as p
set content = p.content #- '{sections,3}',
    updated_at = now()
from public.services s
where s.id = p.service_id
  and s.slug = 'failing-to-provide'
  and jsonb_array_length(p.content->'sections') = 5
  and p.content->'sections'->3->>'eyebrow' = 'My Service'
  and p.content->'sections'->3->>'heading' = 'How I Help — From Arrest to Outcome'
  and md5(p.content->'sections'->3->>'body') = 'bb0243ea78278c6efddc653b894e1c21';

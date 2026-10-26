/*
 * Failing to Provide a Specimen: John's pull quote becomes "Allow me to help
 * you get your head around your case without making it explode.", exactly
 * as he wrote it, in place of "The warning given, the wording of the
 * request, and the procedure followed — ...". The attribution is unchanged.
 *
 * Guarded on the quote as it is today, so a page someone has since edited in
 * the CMS is left alone. The content revision trigger records the change.
 */

update public.service_pages as p
set content = jsonb_set(
      p.content,
      '{quote}',
      to_jsonb('Allow me to help you get your head around your case without making it explode.'::text)
    ),
    updated_at = now()
from public.services s
where s.id = p.service_id
  and s.slug = 'failing-to-provide'
  and p.content->>'quote' = 'The warning given, the wording of the request, and the procedure followed — these are the details that determine whether a charge can be defended. I examine all of them before advising on anything.';

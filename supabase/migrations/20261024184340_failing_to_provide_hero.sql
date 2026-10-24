/*
 * Failing to Provide a Specimen: two hero changes, approved by John.
 *
 *  - The emphasised part of the main heading becomes "Even if you weren't
 *    driving", in place of "Specialist Defence".
 *  - The introduction ends "the technical issues that determine the outcome
 *    are often missed", in place of "determine guilt or innocence".
 *
 * Each update is guarded on the value the page has today, so a page someone
 * has since edited in the CMS is left alone. The content revision trigger
 * records each change.
 */

update public.service_pages as p
set content = jsonb_set(p.content, '{emphasis}', to_jsonb('Even if you weren''t driving'::text)),
    updated_at = now()
from public.services s
where s.id = p.service_id
  and s.slug = 'failing-to-provide'
  and p.content->>'emphasis' = 'Specialist Defence';

update public.service_pages as p
set content = jsonb_set(
      p.content,
      '{intro}',
      to_jsonb('Failing to provide a specimen is treated by the courts almost as seriously as drink driving itself. A mandatory 12-month ban follows conviction in most cases — and the technical issues that determine the outcome are often missed without specialist advice.'::text)
    ),
    updated_at = now()
from public.services s
where s.id = p.service_id
  and s.slug = 'failing-to-provide'
  and p.content->>'intro' = 'Failing to provide a specimen is treated by the courts almost as seriously as drink driving itself. A mandatory 12-month ban follows conviction in most cases — and the technical issues that determine guilt or innocence are often missed without specialist advice.';

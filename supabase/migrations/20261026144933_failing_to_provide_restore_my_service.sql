/*
 * Failing to Provide a Specimen: the "My Service" section comes back, with
 * its heading "How I Help — From Arrest to Outcome" and one paragraph as its
 * only text, exactly as John wrote it. It sits between "Lines of Defence"
 * and "Why Instruct Me", where it was before. The paragraph is the same as
 * the first one in Drug Driving's "My Service" section, as John chose.
 *
 * Guarded on the four sections as they are today and on there being no
 * "My Service" section yet, so a page someone has since edited in the CMS is
 * left alone. The content revision trigger records the change.
 */

update public.service_pages as p
set content = jsonb_insert(
      p.content,
      '{sections,3}',
      jsonb_build_object(
        'eyebrow', 'My Service',
        'heading', 'How I Help — From Arrest to Outcome',
        'body', 'My approach is calm, assured and direct. Whether you''re at the start of an investigation or about to be sentenced, I can help you by providing you with clarity and a much better understanding of your case. We can then work towards achieving your ideal outcome. Where an acquittal or discontinuance isn''t possible, I will help you make the best out of a bad situation.'
      )
    ),
    updated_at = now()
from public.services s
where s.id = p.service_id
  and s.slug = 'failing-to-provide'
  and jsonb_array_length(p.content->'sections') = 4
  and p.content->'sections'->2->>'eyebrow' = 'Lines of Defence'
  and p.content->'sections'->3->>'eyebrow' = 'Why Instruct Me'
  and not exists (
    select 1
    from jsonb_array_elements(p.content->'sections') as sec
    where sec->>'eyebrow' = 'My Service'
  );

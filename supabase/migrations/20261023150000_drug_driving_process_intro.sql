/*
 * Drug Driving, "How a Drug Driving Case Progresses": the opening sentence
 * ends at "so you know what is coming.", approved by John. The rest of the
 * section is unchanged.
 *
 * Guarded on the section as it is today, so a page someone has since edited
 * in the CMS is left alone. The content revision trigger records the change.
 */

update public.service_pages as p
set content = jsonb_set(
      p.content,
      '{sections,2,body}',
      to_jsonb(
        replace(
          p.content->'sections'->2->>'body',
          'My aim is to make each stage predictable — so you know what is coming, and what each decision means for the one that follows.',
          'My aim is to make each stage predictable — so you know what is coming.'
        )
      )
    ),
    updated_at = now()
from public.services s
where s.id = p.service_id
  and s.slug = 'drug-driving'
  and p.content->'sections'->2->>'heading' = 'How a Drug Driving Case Progresses'
  and p.content->'sections'->2->>'body' like 'Uncertainty is often what clients find hardest. My aim is to make each stage predictable — so you know what is coming, and what each decision means for the one that follows.

::: steps%';

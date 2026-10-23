/*
 * Drug Driving, "What Does Drug Driving Actually Mean?": "section 5A of the
 * Road Traffic Act 1988", "strict liability offence" and "driving whilst
 * unfit through drugs" are no longer bold. No words change.
 *
 * Guarded on the section as it is today, so a page someone has since edited
 * in the CMS is left alone. The content revision trigger records the change.
 */

update public.service_pages as p
set content = jsonb_set(
      p.content,
      '{sections,0,body}',
      to_jsonb(
        replace(
          replace(
            replace(
              p.content->'sections'->0->>'body',
              '**section 5A of the Road Traffic Act 1988**',
              'section 5A of the Road Traffic Act 1988'
            ),
            '**strict liability offence**',
            'strict liability offence'
          ),
          '**driving whilst unfit through drugs**',
          'driving whilst unfit through drugs'
        )
      )
    ),
    updated_at = now()
from public.services s
where s.id = p.service_id
  and s.slug = 'drug-driving'
  and p.content->'sections'->0->>'heading' = 'What Does Drug Driving Actually Mean?'
  and p.content->'sections'->0->>'body' like 'The primary offence under **section 5A of the Road Traffic Act 1988** is driving,%'
  and p.content->'sections'->0->>'body' like '%It is a **strict liability offence** — the prosecution%'
  and p.content->'sections'->0->>'body' like '%a separate offence of **driving whilst unfit through drugs**, which does%';

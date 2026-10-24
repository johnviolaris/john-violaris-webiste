/*
 * Failing to Provide a Specimen: in "Lines of Defence", the three boxes of
 * medical conditions get a heading, "Relevant Medical Conditions", and their
 * titles become "Breath", "Blood" and "Urine" in place of "Breath — may be
 * accepted" and so on. Approved by John. The lists inside the boxes are
 * unchanged.
 *
 * Guarded on the section and the three titles as they are today, so a page
 * someone has since edited in the CMS is left alone. The content revision
 * trigger records the change.
 */

update public.service_pages as p
set content = jsonb_set(
      p.content,
      '{sections,2,body}',
      to_jsonb(
        replace(
          replace(
            replace(
              p.content->'sections'->2->>'body',
              '::: cards

#### Breath — may be accepted
',
              '### Relevant Medical Conditions

::: cards

#### Breath
'
            ),
            '#### Blood — may be accepted
',
            '#### Blood
'
          ),
          '#### Urine — may be accepted
',
          '#### Urine
'
        )
      )
    ),
    updated_at = now()
from public.services s
where s.id = p.service_id
  and s.slug = 'failing-to-provide'
  and p.content->'sections'->2->>'eyebrow' = 'Lines of Defence'
  and strpos(p.content->'sections'->2->>'body', 'Relevant Medical Conditions') = 0
  and strpos(p.content->'sections'->2->>'body', '::: cards

#### Breath — may be accepted
') > 0
  and strpos(p.content->'sections'->2->>'body', '#### Blood — may be accepted
') > 0
  and strpos(p.content->'sections'->2->>'body', '#### Urine — may be accepted
') > 0
  and (
    length(p.content->'sections'->2->>'body')
    - length(replace(p.content->'sections'->2->>'body', ' — may be accepted', ''))
  ) = 3 * length(' — may be accepted');

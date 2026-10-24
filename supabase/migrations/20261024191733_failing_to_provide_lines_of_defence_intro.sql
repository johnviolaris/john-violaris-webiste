/*
 * Failing to Provide a Specimen: in "Lines of Defence", the heading becomes
 * "Where these cases can be won" (in place of "Where These Cases Can Be
 * Won") and its two opening paragraphs are reworded, exactly as John wrote
 * them. "without a reasonable excuse" stays bold, as "without reasonable
 * excuse" was. The defence cards below are unchanged.
 *
 * Guarded on the section and both paragraphs as they are today, so a page
 * someone has since edited in the CMS is left alone. The content revision
 * trigger records the change.
 */

update public.service_pages as p
set content = jsonb_set(
      jsonb_set(p.content, '{sections,2,heading}', to_jsonb('Where these cases can be won'::text)),
      '{sections,2,body}',
      to_jsonb(replace(
        p.content->'sections'->2->>'body',
        'The prosecution must prove two things: that you failed to provide the specimen, and that you did so **without reasonable excuse**. If either element is not proved to the criminal standard, you are entitled to be acquitted. There are also procedural routes that can undermine the prosecution case entirely.

I do not raise arguments that have no merit. But I look carefully at every case before advising on a plea — because the defences available here are genuinely misunderstood, and clients are sometimes advised to plead guilty when they have a real argument.',
        'The prosecution must prove two things: that you failed to provide the specimen and that you did so **without a reasonable excuse**. If either element isn''t proven to the criminal standard, you should be found not guilty. There are also procedural routes that can undermine the prosecution case entirely.

I look carefully at every case before advising client''s on their plea. I do not raise arguments that have no merit, but the defences available here are genuinely misunderstood and frequently overlooked.'
      ))
    ),
    updated_at = now()
from public.services s
where s.id = p.service_id
  and s.slug = 'failing-to-provide'
  and p.content->'sections'->2->>'eyebrow' = 'Lines of Defence'
  and p.content->'sections'->2->>'heading' = 'Where These Cases Can Be Won'
  and strpos(
        p.content->'sections'->2->>'body',
        'The prosecution must prove two things: that you failed to provide the specimen, and that you did so **without reasonable excuse**. If either element is not proved to the criminal standard, you are entitled to be acquitted. There are also procedural routes that can undermine the prosecution case entirely.

I do not raise arguments that have no merit. But I look carefully at every case before advising on a plea — because the defences available here are genuinely misunderstood, and clients are sometimes advised to plead guilty when they have a real argument.'
      ) = 1;

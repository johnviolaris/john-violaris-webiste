/*
 * Failing to Provide a Specimen: in "Why Instruct Me", the heading and the
 * first paragraph stay; the second and third paragraphs (qualification and
 * fees, and the call to action) give way to one closing paragraph, approved
 * by John: "If you have a failing to provide case and want to understand
 * your options properly — before you make any decisions — call me for a
 * free initial consultation."
 *
 * Guarded on the section and both paragraphs as they are today, so a page
 * someone has since edited in the CMS is left alone. The content revision
 * trigger records the change.
 */

update public.service_pages as p
set content = jsonb_set(
      p.content,
      '{sections,4,body}',
      to_jsonb(replace(
        p.content->'sections'->4->>'body',
        'I qualified as a solicitor in 2005 and have worked in criminal defence ever since. I have represented thousands of clients across England and Wales at the police station and in the magistrates'' court, across the full range of driving offences. I keep my fees fixed and transparent so you know what you are committing to before you instruct me.

If you have been charged with failing to provide a specimen — or if you are still at the police station stage and have not yet been charged — call me. The earlier I am involved, the more options are likely to be available.',
        'If you have a failing to provide case and want to understand your options properly — before you make any decisions — call me for a free initial consultation.'
      ))
    ),
    updated_at = now()
from public.services s
where s.id = p.service_id
  and s.slug = 'failing-to-provide'
  and jsonb_array_length(p.content->'sections') = 5
  and p.content->'sections'->4->>'eyebrow' = 'Why Instruct Me'
  and p.content->'sections'->4->>'heading' = 'Personal Advice. Technical Depth. Plain English.'
  and right(
        p.content->'sections'->4->>'body',
        length('I qualified as a solicitor in 2005 and have worked in criminal defence ever since. I have represented thousands of clients across England and Wales at the police station and in the magistrates'' court, across the full range of driving offences. I keep my fees fixed and transparent so you know what you are committing to before you instruct me.

If you have been charged with failing to provide a specimen — or if you are still at the police station stage and have not yet been charged — call me. The earlier I am involved, the more options are likely to be available.')
      ) = 'I qualified as a solicitor in 2005 and have worked in criminal defence ever since. I have represented thousands of clients across England and Wales at the police station and in the magistrates'' court, across the full range of driving offences. I keep my fees fixed and transparent so you know what you are committing to before you instruct me.

If you have been charged with failing to provide a specimen — or if you are still at the police station stage and have not yet been charged — call me. The earlier I am involved, the more options are likely to be available.';

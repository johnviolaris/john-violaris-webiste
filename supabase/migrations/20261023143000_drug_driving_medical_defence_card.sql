/*
 * Drug Driving, "Does a medical defence apply?" card: new wording, approved
 * by John. The rest of the section is unchanged.
 *
 * Guarded on the card as it is today, so a page someone has since edited in
 * the CMS is left alone. The content revision trigger records the change.
 */

update public.service_pages as p
set content = jsonb_set(
      p.content,
      '{sections,0,body}',
      to_jsonb(
        replace(
          p.content->'sections'->0->>'body',
          'For certain drugs, a statutory medical defence is available where the drug was taken as prescribed and there was no reason to expect impairment. This requires careful preparation.',
          'For certain drugs, a statutory medical defence is available where the drug was taken as prescribed, where driving guidelines were followed and where there was no impairment. This defence requires careful preparation by an experienced solicitor.'
        )
      )
    ),
    updated_at = now()
from public.services s
where s.id = p.service_id
  and s.slug = 'drug-driving'
  and p.content->'sections'->0->>'heading' = 'What Does Drug Driving Actually Mean?'
  and p.content->'sections'->0->>'body' like '%#### Does a medical defence apply?

For certain drugs, a statutory medical defence is available where the drug was taken as prescribed and there was no reason to expect impairment. This requires careful preparation.

---%';

/*
 * Failing to Provide a Specimen: under "In-Charge Cases — Different Rules"
 * in "Penalties & Consequences", the statutory defence sentence now refers
 * to 'in-charge' cases in place of drink-in-charge cases, and ends "you can
 * avoid a disqualification entirely" in place of "it can avoid any
 * disqualification entirely". Approved by John. The rest of the section is
 * unchanged.
 *
 * Guarded on the section and the sentence as they are today, so a page
 * someone has since edited in the CMS is left alone. The content revision
 * trigger records the change.
 */

update public.service_pages as p
set content = jsonb_set(
      p.content,
      '{sections,1,body}',
      to_jsonb(replace(
        p.content->'sections'->1->>'body',
        'The statutory defence available in drink-in-charge cases — that there was no likelihood you would have driven while over the limit — applies equally here. Where this can be argued, it can avoid any disqualification entirely.',
        'The statutory defence available in ''in-charge'' cases — that there was no likelihood you would have driven while over the limit — applies equally here. Where this can be argued, you can avoid a disqualification entirely.'
      ))
    ),
    updated_at = now()
from public.services s
where s.id = p.service_id
  and s.slug = 'failing-to-provide'
  and p.content->'sections'->1->>'eyebrow' = 'Penalties & Consequences'
  and p.content->'sections'->1->>'heading' = 'What the Courts Can Impose'
  and strpos(
        p.content->'sections'->1->>'body',
        'The statutory defence available in drink-in-charge cases — that there was no likelihood you would have driven while over the limit — applies equally here. Where this can be argued, it can avoid any disqualification entirely.'
      ) > 0;

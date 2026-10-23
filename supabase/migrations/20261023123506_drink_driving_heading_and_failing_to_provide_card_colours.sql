/*
 * Two service-page changes approved for John:
 *
 *  - Drink Driving: the emphasised part of the main heading becomes
 *    "Carries a Mandatory Ban", in place of "Specialist Defence".
 *  - Failing to Provide a Specimen: the "12-month minimum ban" and
 *    "Up to 6 months' custody" cards turn gold, to match the other two.
 *
 * Each update is guarded on the value the page has today, so a page someone
 * has since edited in the CMS is left alone. The content revision trigger
 * records each change, so the previous versions stay restorable from the
 * editor. Nothing else on either page changes.
 */

update public.service_pages as p
set content = jsonb_set(p.content, '{emphasis}', '"Carries a Mandatory Ban"'),
    updated_at = now()
from public.services s
where s.id = p.service_id
  and s.slug = 'drink-driving'
  and p.content->>'emphasis' = 'Specialist Defence';

update public.service_pages as p
set content = jsonb_set(
      p.content,
      '{penalties}',
      (
        select jsonb_agg(
                 case
                   when card->>'label' in ('12-month minimum ban', 'Up to 6 months'' custody')
                     then jsonb_set(card, '{tone}', '"note"')
                   else card
                 end
                 order by position
               )
        from jsonb_array_elements(p.content->'penalties') with ordinality as cards (card, position)
      )
    ),
    updated_at = now()
from public.services s
where s.id = p.service_id
  and s.slug = 'failing-to-provide'
  and exists (
    select 1
    from jsonb_array_elements(p.content->'penalties') as card
    where card->>'label' in ('12-month minimum ban', 'Up to 6 months'' custody')
      and card->>'tone' = 'risk'
  );

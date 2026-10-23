/*
 * Drug Driving: the "12-month minimum ban" card turns gold, matching the
 * Drink Driving and Failing to Provide a Specimen cards changed earlier today.
 *
 * Guarded on the card still being red, so a page someone has since edited in
 * the CMS is left alone. The content revision trigger records the change.
 */

update public.service_pages as p
set content = jsonb_set(
      p.content,
      '{penalties}',
      (
        select jsonb_agg(
                 case
                   when card->>'label' = '12-month minimum ban'
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
  and s.slug = 'drug-driving'
  and exists (
    select 1
    from jsonb_array_elements(p.content->'penalties') as card
    where card->>'label' = '12-month minimum ban'
      and card->>'tone' = 'risk'
  );

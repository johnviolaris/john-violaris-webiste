/*
 * The services menu, reordered at John's request, and Non-Motoring Crime
 * retired because All Crime covers the same ground.
 *
 *  - Drunk in Charge moves up to sit under Drink Driving.
 *  - All Crime leads the Representation group.
 *  - Representation becomes the first column, ahead of Drugs & Alcohol.
 *  - Non-Motoring Crime (`all-crime`) is unpublished, which takes it out of
 *    the menu, the services page, the footer and the sitemap, and its URL
 *    redirects permanently to All Crime (`criminal-defence`). The service row
 *    and its offence page are kept rather than deleted, so it can still be
 *    restored from the admin.
 *
 * Only order, visibility and the redirect change; no wording does. The
 * content revision trigger records each service change.
 */

-- 1. Drugs & Alcohol: Drink Driving, Drunk in Charge, Drug Driving, Failing
--    to Provide a Specimen.
update public.services as s
set sort_order = v.sort_order,
    updated_at = now()
from (values
    ('drink-driving'::text, 0::integer),
    ('drunk-in-charge'::text, 1::integer),
    ('drug-driving'::text, 2::integer),
    ('failing-to-provide'::text, 3::integer)
  ) as v (slug, sort_order)
where s.slug = v.slug;

-- 2. Representation: All Crime, Police Station, Magistrates Court, with the
--    retired Non-Motoring Crime kept at the end.
update public.services as s
set sort_order = v.sort_order,
    updated_at = now()
from (values
    ('criminal-defence'::text, 400::integer),
    ('police-station'::text, 401::integer),
    ('magistrates-court'::text, 402::integer),
    ('all-crime'::text, 403::integer)
  ) as v (slug, sort_order)
where s.slug = v.slug;

update public.services
set published = false,
    updated_at = now()
where slug = 'all-crime';

-- 3. Representation ahead of every other group, which keep their order.
update public.service_groups
set sort_order = (select min(sort_order) - 1 from public.service_groups)
where name = 'Representation';

-- 4. The retired page's URL goes to All Crime.
insert into public.redirects (source_path, destination_path, permanent, active, source_kind)
values ('/services/all-crime', '/services/criminal-defence', true, true, 'manual')
on conflict (source_path) do update
set destination_path = excluded.destination_path,
    permanent = true,
    active = true;

insert into public.redirect_admin_notes (source_path, notes)
values (
  '/services/all-crime',
  'Non-Motoring Crime was retired on 23 October 2026 at John''s request because All Crime covers the same ground. The service and its page are unpublished, not deleted.'
)
on conflict (source_path) do nothing;

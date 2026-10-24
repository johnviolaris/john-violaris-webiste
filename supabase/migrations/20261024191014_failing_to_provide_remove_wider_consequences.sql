/*
 * Failing to Provide a Specimen: "The Wider Consequences" section (six
 * cards: Employment, Professional Registration, International Travel,
 * Insurance, Criminal Record, Future Offences) is removed, approved by John.
 * It was the third of eight sections. The page still gives the DR31
 * endorsement's 11 years under "What the Courts Can Impose", and the 3-year
 * minimum for a further offence within 10 years.
 *
 * Guarded on the section as it is today, so a page someone has since edited
 * in the CMS is left alone. The content revision trigger records the change.
 */

update public.service_pages as p
set content = p.content #- '{sections,2}',
    updated_at = now()
from public.services s
where s.id = p.service_id
  and s.slug = 'failing-to-provide'
  and jsonb_array_length(p.content->'sections') = 8
  and p.content->'sections'->2->>'eyebrow' is null
  and p.content->'sections'->2->>'heading' = 'The Wider Consequences'
  and p.content->'sections'->2->>'body' = '::: cards

#### Employment

Driving jobs, shift work, site access, and roles requiring reliability or security clearance are all at risk. A conviction and ban can take immediate effect on your ability to earn.

---

#### Professional Registration

Doctors, nurses, pilots, solicitors, and other regulated professionals may have reporting obligations to their employer or regulator. Timing and disclosure must be handled carefully.

---

#### International Travel

A criminal conviction can create visa complications for travel to the US, Canada, Australia, and other countries. The conviction remains on your criminal record.

---

#### Insurance

Premiums typically rise sharply and some insurers may decline cover altogether. The DR31 endorsement remains visible on your DVLA record for 11 years.

---

#### Criminal Record

This is a criminal conviction — it appears on standard and enhanced DBS checks and may require disclosure in job applications, licensing applications, and visa forms.

---

#### Future Offences

A conviction for FTP counts as a relevant prior for 10 years. Any further drink, drug, or FTP offence within that period triggers a 3-year minimum ban as a starting point.

:::';

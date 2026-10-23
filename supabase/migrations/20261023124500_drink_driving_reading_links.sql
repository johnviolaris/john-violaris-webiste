/*
 * Drink Driving, opening paragraph: the three legal limits link down to the
 * Sentencing Guidelines table, and "challenge the case" is no longer bold.
 * No words change.
 *
 * Guarded on the paragraph as it is today, so a page someone has since edited
 * in the CMS is left alone. The content revision trigger records the change.
 */

update public.service_pages as p
set content = jsonb_set(
      p.content,
      '{sections,0,body}',
      to_jsonb('If your breath reading is above [**35µg/100ml**](#sentencing-guidelines) (or blood above [**80mg/100ml**](#sentencing-guidelines), or urine above [**108mg/100ml**](#sentencing-guidelines)), you will face a prosecution and an appearance before the Magistrates'' Court. I act for motorists across England and Wales facing drink driving allegations — from first-time offenders to professionals worried about their career and licence.

Whether you want to challenge the case, or whether you are planning to plead guilty and need expert mitigation for your upcoming court appearance, I can help at every stage.'::text)
    ),
    updated_at = now()
from public.services s
where s.id = p.service_id
  and s.slug = 'drink-driving'
  and p.content->'sections'->0->>'body' = 'If your breath reading is above **35µg/100ml** (or blood above **80mg/100ml**, or urine above **108mg/100ml**), you will face a prosecution and an appearance before the Magistrates'' Court. I act for motorists across England and Wales facing drink driving allegations — from first-time offenders to professionals worried about their career and licence.

Whether you want to **challenge the case**, or whether you are planning to plead guilty and need expert mitigation for your upcoming court appearance, I can help at every stage.';

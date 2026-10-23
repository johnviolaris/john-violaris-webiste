/*
 * Drug Driving: the "Why Instruct Me" section ("What Makes This Practice
 * Different") is removed, approved by John. It was the last section; the
 * pull quote is a separate field and stays, now following "My Service".
 *
 * Guarded on the section as it is today, so a page someone has since edited
 * in the CMS is left alone. The content revision trigger records the change.
 */

update public.service_pages as p
set content = p.content #- '{sections,5}',
    updated_at = now()
from public.services s
where s.id = p.service_id
  and s.slug = 'drug-driving'
  and jsonb_array_length(p.content->'sections') = 6
  and p.content->'sections'->5->>'eyebrow' = 'Why Instruct Me'
  and p.content->'sections'->5->>'heading' = 'What Makes This Practice Different'
  and p.content->'sections'->5->>'body' = 'Clients instruct me because they want clear, personal advice from one solicitor who stays involved from first contact to final outcome. Drug driving cases reward technical knowledge — but technical knowledge is only useful if it is communicated clearly and acted on strategically.

I have been practising criminal defence since 2005, with a background that spans police station representation, youth court work, and the full range of driving offences at magistrates'' court level. I qualified at the University of Bristol and have represented thousands of clients across England and Wales.

I do not operate a volume practice. I take on work I can handle personally, to the standard I would want for myself. If you have a drug driving case and want to understand your options properly — before you make any decisions — call me for a free initial consultation.';

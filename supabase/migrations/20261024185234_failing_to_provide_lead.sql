/*
 * Failing to Provide a Specimen: the opening paragraph ("These cases turn
 * on...") is reworded, approved by John. A straightforward-looking case "can
 * have real deficiencies" in place of "real defences", and the last sentence
 * becomes "The only way to know is by instructing your solicitor to examine
 * the evidence properly." The bold first sentence is unchanged.
 *
 * Guarded on the paragraph as it is today, so a page someone has since edited
 * in the CMS is left alone. The content revision trigger records the change.
 */

update public.service_pages as p
set content = jsonb_set(
      p.content,
      '{lead}',
      to_jsonb('These cases turn on the **warning given, the exact request made, your medical position, and the procedure the police followed.** A case that looks straightforward at first sight can have real deficiencies — and a case that looks hopeless may have options. The only way to know is by instructing your solicitor to examine the evidence properly.'::text)
    ),
    updated_at = now()
from public.services s
where s.id = p.service_id
  and s.slug = 'failing-to-provide'
  and p.content->>'lead' = 'These cases turn on the **warning given, the exact request made, your medical position, and the procedure the police followed.** A case that looks straightforward at first sight can have real defences — and a case that looks hopeless may have options. The only way to know is to examine the evidence properly.';

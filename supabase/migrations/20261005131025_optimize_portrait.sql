/*
 * Switch the original home portrait to its smaller equivalent WebP asset.
 * Match the legacy URL exactly to preserve uploaded portraits and other fields.
 * Public page wording requires John's review and is deliberately unchanged.
 */
update public.page_sections
set content = jsonb_set(content, '{portrait}', to_jsonb('/john-violaris-portrait.webp'::text))
where page = 'home'
  and section = 'hero'
  and content ->> 'portrait' = '/Profile 7.png';

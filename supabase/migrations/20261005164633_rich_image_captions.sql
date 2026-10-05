-- Explicit opt-in preserves every existing caption as literal plain text.
-- Rendering supports a conservative inline subset; arbitrary HTML is never used.
alter table public.media_assets
  add column caption_format text not null default 'plain'
  constraint media_assets_caption_format_check check (caption_format in ('plain','markdown'));

comment on column public.media_assets.caption_format is
  'plain preserves literal legacy text; markdown enables only bold, italic and safe web links';

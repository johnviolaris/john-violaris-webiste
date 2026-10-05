-- Internal notes belong in a separate relation: active redirect rows are public.
-- The source-path primary key also indexes the FK for lifecycle cleanup.
create table public.redirect_admin_notes (
  source_path text primary key references public.redirects(source_path) on delete cascade,
  notes text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint redirect_admin_notes_length_check check (char_length(notes) between 1 and 1000),
  constraint redirect_admin_notes_control_check check (notes !~ E'[\\x01-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]')
);

create trigger redirect_admin_notes_touch_updated_at
before update on public.redirect_admin_notes
for each row execute function private.touch_updated_at();

alter table public.redirect_admin_notes enable row level security;
revoke all on table public.redirect_admin_notes from public, anon, authenticated, service_role;
grant select, insert, update, delete on table public.redirect_admin_notes to authenticated;
create policy "Admins can manage internal redirect notes"
on public.redirect_admin_notes for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

-- A failed note write rolls back the redirect and its chain-flattening triggers.
-- This is an invoker function: it never elevates an authenticated caller.
create function public.save_redirect_with_admin_notes(
  p_source_path text, p_destination_path text, p_permanent boolean,
  p_active boolean, p_notes text
)
returns text
language plpgsql security invoker set search_path = ''
as $$
declare
  saved_notes text := btrim(replace(replace(coalesce(p_notes,''), E'\r\n', E'\n'), E'\r', E'\n'), E' \t\n\r');
begin
  -- Check the caller's own RLS-readable profile without expanding private-
  -- schema privileges. The note/routing policies also independently enforce
  -- the existing private.is_admin() predicate on each statement below.
  if not exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin') then
    raise exception using errcode='42501', message='Administrator access is required';
  end if;

  insert into public.redirects(source_path,destination_path,permanent,active,source_kind)
  values(p_source_path,p_destination_path,p_permanent,p_active,'manual')
  on conflict(source_path) do update set
    destination_path=excluded.destination_path,
    permanent=excluded.permanent,
    active=excluded.active;
  -- Existing generated origins and creation dates are intentionally preserved.

  if saved_notes = '' then
    delete from public.redirect_admin_notes where source_path=p_source_path;
  else
    insert into public.redirect_admin_notes(source_path,notes)
    values(p_source_path,saved_notes)
    on conflict(source_path) do update set notes=excluded.notes;
  end if;
  return p_source_path;
end;
$$;

revoke all on function public.save_redirect_with_admin_notes(text,text,boolean,boolean,text)
from public, anon, authenticated, service_role;
grant execute on function public.save_redirect_with_admin_notes(text,text,boolean,boolean,text) to authenticated;

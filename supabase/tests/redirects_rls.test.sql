begin;

select plan(25);

select has_table('public', 'redirects', 'redirects table exists');
select col_is_pk(
  'public',
  'redirects',
  'source_path',
  'redirect source path is the primary key'
);
select col_not_null(
  'public',
  'redirects',
  'destination_path',
  'redirect destination is required'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.redirects'::regclass),
  'row level security is enabled on redirects'
);
select ok(
  has_table_privilege('anon', 'public.redirects', 'select'),
  'anonymous visitors may resolve redirects'
);
select ok(
  not has_table_privilege('anon', 'public.redirects', 'insert,update,delete'),
  'anonymous visitors cannot change redirects'
);
select ok(
  has_table_privilege(
    'authenticated',
    'public.redirects',
    'select,insert,update,delete'
  ),
  'authenticated requests have the grants that RLS narrows to admins'
);
select policies_are(
  'public',
  'redirects',
  array[
    'Admins can create redirects',
    'Admins can delete redirects',
    'Admins can read all redirects',
    'Admins can update redirects',
    'Anyone can read active redirects'
  ],
  'redirects has public-read and per-operation admin policies'
);
select has_trigger(
  'public',
  'blog_posts',
  'blog_posts_capture_slug_redirect',
  'blog post slug changes are captured'
);
select has_trigger(
  'public',
  'services',
  'services_capture_slug_redirect',
  'service slug changes are captured'
);

insert into public.blog_posts (slug, title, published, content)
values ('pgtap-old-article', 'Redirect test article', true, '{}'::jsonb);

update public.blog_posts
set slug = 'pgtap-new-article'
where slug = 'pgtap-old-article';

select is(
  (
    select destination_path
    from public.redirects
    where source_path = '/blog/pgtap-old-article'
  ),
  '/blog/pgtap-new-article',
  'renaming a blog post creates a permanent path redirect'
);

update public.blog_posts
set slug = 'pgtap-final-article'
where slug = 'pgtap-new-article';

select is(
  (
    select destination_path
    from public.redirects
    where source_path = '/blog/pgtap-old-article'
  ),
  '/blog/pgtap-final-article',
  'older blog aliases are flattened to the latest canonical path'
);
select is(
  (
    select destination_path
    from public.redirects
    where source_path = '/blog/pgtap-new-article'
  ),
  '/blog/pgtap-final-article',
  'the immediately previous blog path also redirects to the canonical path'
);

insert into public.services (
  slug,
  name,
  published,
  content
)
values (
  'pgtap-old-service',
  'Redirect test service',
  true,
  '{"group":"Tests","icon":"document"}'::jsonb
);

insert into public.blog_posts (slug, title, content)
values (
  'pgtap-related-article',
  'Related link test article',
  '{"relatedService":"/services/pgtap-old-service"}'::jsonb
);

update public.services
set slug = 'pgtap-new-service'
where slug = 'pgtap-old-service';

select is(
  (
    select destination_path
    from public.redirects
    where source_path = '/services/pgtap-old-service'
  ),
  '/services/pgtap-new-service',
  'renaming a service creates a permanent path redirect'
);
select is(
  (
    select content ->> 'relatedService'
    from public.blog_posts
    where slug = 'pgtap-related-article'
  ),
  '/services/pgtap-new-service',
  'service renames update related links in articles'
);

insert into public.redirects (source_path, destination_path)
values ('/pgtap-chain-start', '/pgtap-chain-middle');
insert into public.redirects (source_path, destination_path)
values ('/pgtap-chain-middle', '/pgtap-chain-end');

select is(
  (
    select destination_path
    from public.redirects
    where source_path = '/pgtap-chain-start'
  ),
  '/pgtap-chain-end',
  'manual redirect chains are flattened'
);
select throws_ok(
  $$insert into public.redirects (source_path, destination_path)
    values ('/pgtap-loop', '/pgtap-loop')$$,
  '23514',
  null,
  'self-redirects are rejected'
);
select throws_ok(
  $$insert into public.redirects (source_path, destination_path)
    values ('/pgtap-external', 'https://example.com')$$,
  '23514',
  null,
  'external redirect destinations are rejected'
);

insert into public.blog_posts (slug, title, content)
values ('pgtap-draft-old', 'Draft redirect test', '{}'::jsonb);
update public.blog_posts
set slug = 'pgtap-draft-new'
where slug = 'pgtap-draft-old';
select is(
  (
    select count(*)::bigint
    from public.redirects
    where source_path = '/blog/pgtap-draft-old'
  ),
  0::bigint,
  'renaming a never-published draft does not create a redirect'
);

insert into public.blog_posts (slug, title, published, content)
values ('pgtap-draft-publish-old', 'Draft publication test', false, '{}'::jsonb);
update public.blog_posts
set slug = 'pgtap-draft-publish-new',
    published = true
where slug = 'pgtap-draft-publish-old';
select is(
  (
    select count(*)::bigint
    from public.redirects
    where source_path = '/blog/pgtap-draft-publish-old'
  ),
  0::bigint,
  'publishing a renamed draft does not expose its never-public draft slug'
);

insert into public.blog_posts (slug, title, published, content)
values (
  'pgtap-published-to-draft-old',
  'Published to draft redirect test',
  true,
  '{}'::jsonb
);
update public.blog_posts
set slug = 'pgtap-published-to-draft-new',
    published = false
where slug = 'pgtap-published-to-draft-old';
select is(
  (
    select count(*)::bigint
    from public.redirects
    where source_path = '/blog/pgtap-published-to-draft-old'
      and active
  ),
  0::bigint,
  'renaming while unpublishing creates no active redirect to the draft URL'
);

-- Trigger functions do not need a direct EXECUTE grant when PostgreSQL invokes
-- them. Exercise the real authenticated-admin path to guard that property.
insert into auth.users (
  id,
  email,
  aud,
  role,
  raw_app_meta_data,
  raw_user_meta_data
)
values (
  '00000000-0000-4000-8000-000000000201'::uuid,
  'redirect-admin@example.test',
  'authenticated',
  'authenticated',
  '{}'::jsonb,
  '{}'::jsonb
);

update public.profiles
set role = 'admin'
where id = '00000000-0000-4000-8000-000000000201'::uuid;

insert into public.blog_posts (slug, title, published, content)
values ('pgtap-admin-old', 'Authenticated redirect test', true, '{}'::jsonb);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000201',
  true
);
select lives_ok(
  $$update public.blog_posts
    set slug = 'pgtap-admin-new'
    where slug = 'pgtap-admin-old'$$,
  'an authenticated admin can rename content through the revoked trigger functions'
);
reset role;

select is(
  (
    select destination_path
    from public.redirects
    where source_path = '/blog/pgtap-admin-old'
  ),
  '/blog/pgtap-admin-new',
  'the authenticated-admin rename captured its redirect'
);

set local role anon;
select is(
  (select count(*)::bigint from public.redirects where active),
  6::bigint,
  'anonymous visitors can see active redirect rows'
);
select throws_ok(
  $$insert into public.redirects (source_path, destination_path)
    values ('/anon-write', '/blocked')$$,
  '42501',
  null,
  'anonymous visitors cannot insert redirects'
);
reset role;

select * from finish();

rollback;


begin;

select plan(10);

select has_table('public', 'profiles', 'profiles table exists');
select col_is_pk('public', 'profiles', 'id', 'profiles.id is the primary key');
select col_type_is('public', 'profiles', 'id', 'uuid', 'profiles.id uses uuid');
select col_not_null('public', 'profiles', 'role', 'profiles.role is required');
select col_default_is(
  'public',
  'profiles',
  'role',
  'user',
  'new profiles default to the user role'
);
select col_has_check(
  'public',
  'profiles',
  'role',
  'profiles.role is constrained'
);
select ok(
  not has_table_privilege('anon', 'public.profiles', 'select,insert,update,delete'),
  'anonymous clients cannot access profiles'
);
select ok(
  has_table_privilege('authenticated', 'public.profiles', 'select'),
  'authenticated users can select profiles'
);
select ok(
  not has_table_privilege('authenticated', 'public.profiles', 'insert,update,delete'),
  'authenticated users cannot create profiles or change roles'
);
select policies_are(
  'public',
  'profiles',
  array['Users can read their own profile'],
  'profiles has only the self-read policy'
);

select * from finish();

rollback;

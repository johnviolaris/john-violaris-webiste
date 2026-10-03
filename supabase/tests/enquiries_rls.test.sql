begin;

select plan(21);

select has_table('public', 'enquiries', 'enquiries table exists');
select col_type_is('public', 'enquiries', 'referrer', 'text', 'referrer is text');
select col_type_is('public', 'enquiries', 'utm_source', 'text', 'utm_source is text');
select col_type_is('public', 'enquiries', 'utm_medium', 'text', 'utm_medium is text');
select col_type_is('public', 'enquiries', 'utm_campaign', 'text', 'utm_campaign is text');
select col_type_is('public', 'enquiries', 'utm_term', 'text', 'utm_term is text');
select col_type_is('public', 'enquiries', 'utm_content', 'text', 'utm_content is text');
select col_type_is('public', 'enquiries', 'gclid', 'text', 'gclid is text');
select col_has_check(
  'public',
  'enquiries',
  'referrer',
  'referrer has a database length limit'
);
select col_has_check(
  'public',
  'enquiries',
  'utm_source',
  'utm_source has a database length limit'
);
select col_has_check(
  'public',
  'enquiries',
  'utm_medium',
  'utm_medium has a database length limit'
);
select col_has_check(
  'public',
  'enquiries',
  'utm_campaign',
  'utm_campaign has a database length limit'
);
select col_has_check(
  'public',
  'enquiries',
  'utm_term',
  'utm_term has a database length limit'
);
select col_has_check(
  'public',
  'enquiries',
  'utm_content',
  'utm_content has a database length limit'
);
select col_has_check(
  'public',
  'enquiries',
  'gclid',
  'gclid has a database length limit'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.enquiries'::regclass),
  'row level security is enabled on enquiries'
);
select ok(
  not has_table_privilege('anon', 'public.enquiries', 'select,insert,update,delete'),
  'anonymous clients have no direct enquiry access'
);
select ok(
  has_table_privilege('authenticated', 'public.enquiries', 'select,update,delete'),
  'authenticated requests have the grants needed by admin policies'
);
select ok(
  not has_table_privilege('authenticated', 'public.enquiries', 'insert'),
  'authenticated clients cannot insert enquiries directly'
);
select ok(
  has_table_privilege(
    'service_role',
    'public.enquiries',
    'select,insert,update,delete'
  ),
  'the server-side enquiry action has explicit service-role privileges'
);
select policies_are(
  'public',
  'enquiries',
  array[
    'Admins can delete enquiries',
    'Admins can read enquiries',
    'Admins can update enquiries'
  ],
  'enquiries has only the intended admin policies'
);

select * from finish();

rollback;


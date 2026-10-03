/*
 * The initial website content is already installed by the historical,
 * production-safe migration `20260917111415_seed_cms_content.sql` and later
 * content migrations. Those statements are guarded so they never overwrite
 * CMS edits.
 *
 * Supabase CLI still expects the configured seed file after migrations during
 * `supabase db reset`. Keeping this intentionally empty file makes that reset
 * reproducible without applying a second, potentially destructive content
 * seed after the full migration history has run.
 */

select 1;


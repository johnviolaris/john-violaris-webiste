/**
 * The shortest new password the admin accepts, checked in the browser and
 * again by the server action. Supabase's own password rules can ask for more,
 * and its refusal is passed on to the visitor.
 */
export const minimumPasswordLength = 10;

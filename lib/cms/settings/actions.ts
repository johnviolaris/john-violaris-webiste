"use server";

import { requireAdmin } from "@/lib/auth";
import { formError, readFields, type CmsFormState } from "@/lib/cms/form";
import {
  settingSpecs,
  type SettingField,
  type SettingValues,
} from "@/lib/cms/settings/schema";
import { cmsWrite } from "@/lib/cms/write";
import { siteSettingKeys } from "@/lib/site-config";
import { practiceFactsErrors } from "@/lib/cms/settings/practice-facts";

/**
 * Saving the site settings.
 *
 * All of them in one submission rather than a form per setting: they are read
 * together, they are short, and the telephone number written for dialling and
 * the one written for printing should be changed in the same breath.
 *
 * A blank field deletes its row rather than storing an empty string. An unset
 * setting is one the defaults in `lib/site-config.ts` answer for, and that is
 * exactly what no row means — so clearing the telephone number puts every call
 * link back to the contact page, which is the behaviour someone clearing it
 * wants.
 */

/** Whether `value` is an https address on `host` or one of its subdomains. */
function isOn(value: string, host: string): boolean {
  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      (url.hostname === host || url.hostname.endsWith(`.${host}`))
    );
  } catch {
    return false;
  }
}

/** A four-digit year no later than this one. */
function isPastYear(value: string): boolean {
  return (
    /^\d{4}$/.test(value) &&
    Number(value) >= 1950 &&
    Number(value) <= new Date().getFullYear()
  );
}

export async function saveSiteSettings(
  _previous: CmsFormState<SettingField>,
  formData: FormData,
): Promise<CmsFormState<SettingField>> {
  await requireAdmin();

  const values = readFields(formData, siteSettingKeys) as SettingValues;
  const fieldErrors: Partial<Record<SettingField, string>> = {};

  for (const spec of settingSpecs) {
    const value = values[spec.key];

    if (value.length > spec.maxLength) {
      fieldErrors[spec.key] = `${spec.label} must be ${spec.maxLength} characters or fewer.`;
    }

    if (!value) {
      if (spec.required) {
        fieldErrors[spec.key] = `${spec.label} cannot be empty.`;
      }

      continue;
    }

    /*
     * Checked here rather than through `validateFields`, which knows about
     * slugs, numbers and dates but not about the shapes that matter on this
     * screen. Each message says what to write rather than what is wrong.
     */
    if (spec.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      fieldErrors[spec.key] = "That does not look like an email address.";
    }

    if (spec.host && !isOn(value, spec.host)) {
      fieldErrors[spec.key] =
        `Paste the full address of the page, starting with https:// — it must be on ${spec.host}.`;
    }

    if (spec.key === "qualifiedYear" && !isPastYear(value)) {
      fieldErrors[spec.key] = "Write the year as four digits, for example 2005.";
    }

    if (spec.key === "phoneE164" && !/^\+\d{7,15}$/.test(value)) {
      fieldErrors[spec.key] =
        "Write the number in international format, starting with + and digits only — for example +447427260293.";
    }
  }

  Object.assign(fieldErrors, practiceFactsErrors(values));
  if (Object.keys(fieldErrors).length > 0) {
    return formError(values, fieldErrors);
  }

  const toStore = siteSettingKeys.filter((key) => values[key]);
  const toClear = siteSettingKeys.filter((key) => !values[key]);

  return cmsWrite<SettingField, null>({
    entity: "site-settings",
    values,
    successMessage: "Settings saved.",
    run: async (supabase) => {
      // Upsert on the primary key, so a setting saved for the first time is an
      // insert and one being changed is an update, with no round trip in
      // between to find out which.
      if (toStore.length > 0) {
        const { error } = await supabase.from("site_settings").upsert(
          toStore.map((key) => ({ key, value: values[key] })),
          { onConflict: "key" },
        );

        if (error) return { data: null, error };
      }

      if (toClear.length > 0) {
        const { error } = await supabase
          .from("site_settings")
          .delete()
          .in("key", toClear);

        if (error) return { data: null, error };
      }

      return { data: null, error: null };
    },
  });
}

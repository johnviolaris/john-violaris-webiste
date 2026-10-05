import { initialCmsFormState, type CmsFormState } from "@/lib/cms/form";
import { seoTips } from "@/lib/cms/seo-tips";
import {
  siteSettingKeys,
  siteSettingsDefaults,
  type SiteSettings,
} from "@/lib/site-config";

/**
 * The Site Settings editor: which settings are editable, and how each is
 * described to the person editing it.
 *
 * Shared by the form and the action that receives it, so the two cannot drift.
 * The field list itself comes from `siteSettingKeys` in `lib/site-config.ts`,
 * which is also what the read layer uses — a setting cannot exist in one and
 * not the other.
 *
 * No server-only imports: the editor is a client component.
 */

export type SettingField = keyof SiteSettings;

export type SettingValues = Record<SettingField, string>;

export type SettingSpec = {
  key: SettingField;
  label: string;
  hint?: string;
  /** What the setting does for search, shown apart from the hint. */
  seo?: string;
  required?: boolean;
  maxLength: number;
  /** `tel` gets the matching mobile keyboard and browser validation. */
  type?: "text" | "email" | "tel" | "url";
  /**
   * For a profile link: the site it must be on. A link to anywhere else is
   * refused, so a pasted address cannot claim John is someone else's page.
   */
  host?: string;
  /**
   * Shown greyed in the input when the setting has no value, so it is obvious
   * what the site falls back to rather than looking like an empty field.
   */
  placeholder?: string;
};

export type SettingGroup = {
  label: string;
  description: string;
  fields: SettingSpec[];
};

export const settingGroups: SettingGroup[] = [
  {
    label: "Confirmed practice details",
    description: "Leave these empty until John confirms the practice identity, public address and hours. Confirmation is recorded before any details appear on Contact or in structured data. A solicitor's personal SRA number and a practice identifier are different records.",
    fields: [
      { key: "practiceLegalName", label: "Practice legal/trading name", maxLength: 160 },
      { key: "practiceSraNumber", label: "Practice SRA identifier", maxLength: 10 },
      { key: "addressStreet", label: "Public street address", maxLength: 160 },
      { key: "addressLocality", label: "Town or city", maxLength: 80 },
      { key: "addressRegion", label: "County or region", maxLength: 80 },
      { key: "addressPostalCode", label: "Postcode", maxLength: 20 },
      { key: "addressCountry", label: "Country code", maxLength: 2, hint: "For example GB. Confirm the address is intended to be public." },
      { key: "latitude", label: "Confirmed latitude", maxLength: 20 },
      { key: "longitude", label: "Confirmed longitude", maxLength: 20 },
      { key: "openingHours", label: "Confirmed opening hours", maxLength: 250, hint: "For example Mo-Fr 09:00-18:00; Sa 09:00-12:00. Leave blank when hours are unknown." },
      { key: "practiceDetailsReviewedAt", label: "Date John confirmed these details", maxLength: 10, hint: "YYYY-MM-DD. Record an actual confirmation, rather than today's date by default." },
    ],
  },
  {
    label: "Identity",
    description:
      "How John is named across the site — in the masthead, the footer, the page titles and the enquiry emails.",
    fields: [
      {
        key: "name",
        label: "Name",
        required: true,
        maxLength: 80,
        hint: "Shown in the masthead and used in every page title.",
        seo: "Google reads it in every page title and in the details about John it is given behind the scenes. Write it exactly as it appears on the SRA register, ReviewSolicitors and the Law Society: matching details across sites help Google tie them to one solicitor.",
      },
      {
        key: "role",
        label: "Role",
        required: true,
        maxLength: 80,
        hint: "The line under the name, e.g. “Criminal Defence Solicitor”.",
        seo: "Given to Google as John’s job title, and printed on the default share picture. A role that names the work, such as “Criminal Defence Solicitor”, reinforces what the site is about.",
      },
      {
        key: "roleLong",
        label: "Role, in full",
        maxLength: 120,
        hint: "Used in the small print at the foot of the enquiry emails.",
        seo: seoTips.noSearchEffect,
      },
      {
        key: "initials",
        label: "Monogram",
        maxLength: 4,
        hint: "The letters on the card in the hero.",
        seo: seoTips.minor,
      },
      {
        key: "jurisdiction",
        label: "Jurisdiction",
        maxLength: 80,
        hint: "Where John practises, e.g. “England & Wales”.",
        seo: "Given to Google as the area John serves, which matters for searches that name a place. Keep it to where he genuinely takes cases.",
      },
    ],
  },
  {
    label: "Contact",
    description:
      "Every telephone, email and WhatsApp link on the site comes from here. A route with nothing set is left out rather than shown as a dead link.",
    fields: [
      {
        key: "email",
        label: "Email address",
        type: "email",
        required: true,
        maxLength: 160,
        hint: "Used for every “Email John” link, and as the fallback address for enquiry notifications.",
        seo: "Given to Google as the practice’s email. Use the same address everywhere the practice is listed.",
      },
      {
        key: "phoneE164",
        label: "Telephone number, for dialling",
        type: "tel",
        maxLength: 24,
        placeholder: "+447427260293",
        hint: "International format, no spaces. This is what a “Call” link dials. Leave blank and every call link points at the contact page instead.",
        seo: "Given to Google as the practice’s telephone. Use the same number as on ReviewSolicitors, the Law Society and any Google Business Profile: consistent contact details across sites are a signal for local search.",
      },
      {
        key: "phoneDisplay",
        label: "Telephone number, as written",
        maxLength: 40,
        placeholder: "07427 260293",
        hint: "How the number is printed on the page.",
        seo: "Keep it the same number as above, written the way people expect to see it.",
      },
      {
        key: "whatsappNumber",
        label: "WhatsApp number",
        type: "tel",
        maxLength: 24,
        placeholder: "+44 7427 260293",
        hint: "Any usual shape works. Leave blank and no WhatsApp link is shown anywhere.",
        seo: seoTips.noSearchEffect,
      },
      {
        key: "responseTime",
        label: "Response promise",
        maxLength: 80,
        hint: "Shown in the contact rail and the footer, e.g. “Response within 24 hours”.",
        seo: seoTips.minor,
      },
    ],
  },
  {
    label: "Credentials",
    description:
      "The regulatory details, and the public profiles that confirm who John is. The profiles are not shown on the page; they tell search engines that these pages and this site are about the same solicitor.",
    fields: [
      {
        key: "sraNumber",
        label: "SRA number",
        maxLength: 40,
        hint: "Printed in the footer once set. Left blank, no number is shown — none is ever invented.",
        seo: "Given to Google as John’s regulatory identifier. A verifiable credential is one of the strongest trust signals a legal site can have, so set it as soon as it is confirmed.",
      },
      {
        key: "qualifiedYear",
        label: "Year qualified",
        maxLength: 4,
        hint: "Printed in the footer as “Qualified since …”. Left blank, the line is left out.",
        seo: "Given to Google as part of John’s credentials. Experience a reader can verify is what Google looks for on legal sites.",
      },
      {
        key: "reviewSolicitorsUrl",
        label: "ReviewSolicitors page",
        type: "url",
        host: "reviewsolicitors.co.uk",
        maxLength: 300,
        hint: "The practice’s page on ReviewSolicitors.",
        seo: "Tells Google that the reviews there are about this practice.",
      },
      {
        key: "lawSocietyUrl",
        label: "Law Society profile",
        type: "url",
        host: "lawsociety.org.uk",
        maxLength: 300,
        placeholder: "Not set",
        hint: "John’s entry on the Law Society’s Find a Solicitor. Left blank until the address is confirmed.",
        seo: "Tells Google that this profile and the site are the same solicitor, which strengthens both.",
      },
      {
        key: "linkedinUrl",
        label: "LinkedIn profile",
        type: "url",
        host: "linkedin.com",
        maxLength: 300,
        placeholder: "Not set",
        hint: "John’s own LinkedIn page. Left blank until the address is confirmed.",
        seo: "Tells Google that this profile and the site are the same solicitor, which strengthens both.",
      },
    ],
  },
];

/** Every spec, flattened. The action validates against this. */
export const settingSpecs: SettingSpec[] = settingGroups.flatMap(
  (group) => group.fields,
);

export const emptySettingValues: SettingValues = Object.fromEntries(
  siteSettingKeys.map((key) => [key, ""]),
) as SettingValues;

export const initialSettingsFormState: CmsFormState<SettingField> =
  initialCmsFormState(emptySettingValues);

/**
 * Stored rows -> editor values.
 *
 * A setting with no row comes back empty rather than pre-filled with the
 * default. The field's placeholder shows what the site falls back to, so the
 * difference between "John set this" and "this is the built-in value" stays
 * visible — pre-filling would turn every default into an edit on the next save.
 */
export function settingValuesFrom(
  stored: Record<string, unknown>,
): SettingValues {
  const values = { ...emptySettingValues };

  for (const key of siteSettingKeys) {
    const value = stored[key];

    if (typeof value === "string") values[key] = value;
  }

  return values;
}

/** What the site uses when a setting is blank, for the field's placeholder. */
export function defaultFor(spec: SettingSpec): string {
  return spec.placeholder ?? siteSettingsDefaults[spec.key];
}

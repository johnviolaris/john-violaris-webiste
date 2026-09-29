import { initialCmsFormState, type CmsFormState } from "@/lib/cms/form";
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
      },
      {
        key: "role",
        label: "Role",
        required: true,
        maxLength: 80,
        hint: "The line under the name, e.g. “Criminal Defence Solicitor”.",
      },
      {
        key: "roleLong",
        label: "Role, in full",
        maxLength: 120,
        hint: "Used in the small print at the foot of the enquiry emails.",
      },
      {
        key: "initials",
        label: "Monogram",
        maxLength: 4,
        hint: "The letters on the card in the hero.",
      },
      {
        key: "jurisdiction",
        label: "Jurisdiction",
        maxLength: 80,
        hint: "Where John practises, e.g. “England & Wales”.",
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
      },
      {
        key: "phoneE164",
        label: "Telephone number, for dialling",
        type: "tel",
        maxLength: 24,
        placeholder: "+447427260293",
        hint: "International format, no spaces. This is what a “Call” link dials. Leave blank and every call link points at the contact page instead.",
      },
      {
        key: "phoneDisplay",
        label: "Telephone number, as written",
        maxLength: 40,
        placeholder: "07427 260293",
        hint: "How the number is printed on the page.",
      },
      {
        key: "whatsappNumber",
        label: "WhatsApp number",
        type: "tel",
        maxLength: 24,
        placeholder: "+44 7427 260293",
        hint: "Any usual shape works. Leave blank and no WhatsApp link is shown anywhere.",
      },
      {
        key: "responseTime",
        label: "Response promise",
        maxLength: 80,
        hint: "Shown in the contact rail and the footer, e.g. “Response within 24 hours”.",
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
      },
      {
        key: "qualifiedYear",
        label: "Year qualified",
        maxLength: 4,
        hint: "Printed in the footer as “Qualified since …”. Left blank, the line is left out.",
      },
      {
        key: "reviewSolicitorsUrl",
        label: "ReviewSolicitors page",
        type: "url",
        host: "reviewsolicitors.co.uk",
        maxLength: 300,
        hint: "The practice’s page on ReviewSolicitors.",
      },
      {
        key: "lawSocietyUrl",
        label: "Law Society profile",
        type: "url",
        host: "lawsociety.org.uk",
        maxLength: 300,
        placeholder: "Not set",
        hint: "John’s entry on the Law Society’s Find a Solicitor. Left blank until the address is confirmed.",
      },
      {
        key: "linkedinUrl",
        label: "LinkedIn profile",
        type: "url",
        host: "linkedin.com",
        maxLength: 300,
        placeholder: "Not set",
        hint: "John’s own LinkedIn page. Left blank until the address is confirmed.",
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

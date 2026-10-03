"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

import {
  gaMeasurementId,
  readConsent,
  subscribeConsent,
} from "@/lib/analytics";
import {
  emptyEnquiryAttribution,
  enquiryAttributionFields,
  enquiryAttributionStorageKey,
  normaliseReferrer,
  normaliseUtmValue,
  type EnquiryAttributionValues,
} from "@/lib/enquiries/attribution";

export const enquiryAttributionUpdatedEvent = "jv:enquiry-attribution";

/** A guarded read: browsers may disable sessionStorage in strict modes. */
export function readStoredEnquiryAttribution(): EnquiryAttributionValues {
  if (
    typeof window === "undefined" ||
    !gaMeasurementId ||
    readConsent() !== "granted"
  ) {
    return emptyEnquiryAttribution;
  }

  try {
    const raw = window.sessionStorage.getItem(enquiryAttributionStorageKey);
    const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};

    return {
      referrer: normaliseReferrer(parsed.referrer) ?? "",
      utm_source: normaliseUtmValue(parsed.utm_source) ?? "",
      utm_medium: normaliseUtmValue(parsed.utm_medium) ?? "",
      utm_campaign: normaliseUtmValue(parsed.utm_campaign) ?? "",
      utm_term: normaliseUtmValue(parsed.utm_term) ?? "",
      utm_content: normaliseUtmValue(parsed.utm_content) ?? "",
      gclid: normaliseUtmValue(parsed.gclid) ?? "",
    };
  } catch {
    return emptyEnquiryAttribution;
  }
}

/**
 * Preserve first-touch campaign details for the lifetime of this browser tab.
 *
 * This calls no third party and only accompanies an enquiry the visitor chooses
 * to submit. Because browser storage used for campaign measurement is not
 * essential to the requested service, it follows the existing analytics choice:
 * nothing is written before acceptance, and rejecting or withdrawing clears it.
 * It ignores every query parameter except the five standard UTM fields and
 * Google Ads click id, and strips the query and fragment from an external
 * referrer.
 */
export function EnquiryAttributionCapture() {
  const pathname = usePathname();
  const choice = useSyncExternalStore(
    subscribeConsent,
    readConsent,
    () => null,
  );
  const pending = useRef<EnquiryAttributionValues>({
    ...emptyEnquiryAttribution,
  });

  useEffect(() => {
    if (!gaMeasurementId) return;

    try {
      const params = new URLSearchParams(window.location.search);
      const pageValues = { ...emptyEnquiryAttribution };

      // Read, never removed from the address: Google's tag only loads after
      // the visitor accepts, and it takes the campaign and `gclid` from the
      // page address at that moment. Stripping them first would report every
      // campaign visit as direct. The canonical tag already keeps search
      // engines on the clean URL.
      for (const field of enquiryAttributionFields) {
        if (field === "referrer") continue;

        pageValues[field] = normaliseUtmValue(params.get(field)) ?? "";
      }

      if (document.referrer) {
        const referrer = normaliseReferrer(document.referrer);

        if (referrer && new URL(referrer).origin !== window.location.origin) {
          pageValues.referrer = referrer;
        }
      }

      if (choice !== "granted") {
        if (choice === null) {
          for (const field of enquiryAttributionFields) {
            if (!pending.current[field] && pageValues[field]) {
              pending.current[field] = pageValues[field];
            }
          }
        } else {
          pending.current = { ...emptyEnquiryAttribution };
          window.sessionStorage.removeItem(enquiryAttributionStorageKey);
          window.dispatchEvent(new Event(enquiryAttributionUpdatedEvent));
        }

        return;
      }

      const stored = readStoredEnquiryAttribution();
      const next = { ...stored };

      for (const field of enquiryAttributionFields) {
        if (next[field]) continue;
        next[field] = pending.current[field] || pageValues[field];
      }

      if (JSON.stringify(next) === JSON.stringify(stored)) return;

      window.sessionStorage.setItem(
        enquiryAttributionStorageKey,
        JSON.stringify(next),
      );
      pending.current = { ...emptyEnquiryAttribution };
      window.dispatchEvent(new Event(enquiryAttributionUpdatedEvent));
    } catch {
      // Attribution must never interfere with navigation or the enquiry form.
    }
  }, [choice, pathname]);

  return null;
}


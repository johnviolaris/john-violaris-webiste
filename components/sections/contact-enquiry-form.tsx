"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActionState, useEffect, useId, useRef, useState } from "react";

import { useEnquiryTracking } from "@/components/layout/analytics";
import {
  enquiryAttributionUpdatedEvent,
  readStoredEnquiryAttribution,
} from "@/components/layout/enquiry-attribution";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/ui/icons";
import { submitEnquiry } from "@/lib/enquiries/actions";
import {
  descriptionMaxLength,
  honeypotField,
  initialEnquiryFormState,
  matterTypes,
  type EnquiryField,
} from "@/lib/enquiries/schema";
import {
  emptyEnquiryAttribution,
  enquiryAttributionFields,
} from "@/lib/enquiries/attribution";
import { useSiteConfig } from "@/components/layout/site-config-provider";

/**
 * The enquiry form (PRD §6.8).
 *
 * A client component only because it needs `useActionState` for field-level
 * errors and a pending state; the submission itself runs entirely on the
 * server. Values are echoed back from the action so a rejected submission never
 * empties the form — retyping a case summary is exactly the moment a visitor
 * gives up and leaves.
 */
export function ContactEnquiryForm({ readOnly = false }: { readOnly?: boolean } = {}) {
  const config = useSiteConfig();
  const [state, formAction, pending] = useActionState(
    submitEnquiry,
    initialEnquiryFormState,
  );
  const pathname = usePathname();
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLParagraphElement>(null);
  const [attribution, setAttribution] = useState(emptyEnquiryAttribution);

  // `form_submit` or `form_error`, once per submission, when consent allows.
  useEnquiryTracking(state);

  // The layout records first-touch campaign details before a visitor reaches
  // this form. Listen as well as reading immediately so effect ordering and
  // client-side navigation cannot leave the hidden values stale.
  useEffect(() => {
    if (readOnly) return;
    const sync = () => setAttribution(readStoredEnquiryAttribution());

    sync();
    window.addEventListener(enquiryAttributionUpdatedEvent, sync);

    return () =>
      window.removeEventListener(enquiryAttributionUpdatedEvent, sync);
  }, [readOnly]);

  /**
   * React resets the form once an action settles, but its value tracker is not
   * told about that reset. For the text inputs the echoed `defaultValue` still
   * lands; a `<select>` is left showing "Please select" while React believes the
   * submitted option is still chosen, so it writes nothing. Re-applying the
   * value here is what keeps the matter selected through a rejected submission.
   */
  useEffect(() => {
    const select = formRef.current?.elements.namedItem("matterType");

    if (select instanceof HTMLSelectElement) {
      select.value = state.values.matterType;
    }
  }, [state]);

  // Send focus where the visitor needs to look, rather than leaving it on a
  // submit button below the fold.
  useEffect(() => {
    if (state.status !== "error") return;

    const firstInvalid = formRef.current?.querySelector<HTMLElement>(
      '[aria-invalid="true"]',
    );

    (firstInvalid ?? alertRef.current)?.focus();
  }, [state]);

  const describedBy = (field: EnquiryField) =>
    state.fieldErrors[field] ? `${formId}-${field}-error` : undefined;

  /** Name, echoed value and error wiring, shared by every control. */
  const fieldProps = (field: EnquiryField) => ({
    name: field,
    defaultValue: state.values[field],
    "aria-invalid": state.fieldErrors[field] ? true : undefined,
    "aria-describedby": describedBy(field),
  });

  const succeeded = state.status === "success";

  return (
    <section
      className="enquiry-section section-space"
      data-track="enquiry_form"
      aria-labelledby="enquiry-heading"
    >
      <Container>
        <div className="enquiry-layout">
          <div>
            <p className="eyebrow">
              <span className="small-rule" /> Enquiry form
            </p>
            <h2 id="enquiry-heading" className="display-heading">
              Tell John about
              <br />
              <em>your case.</em>
            </h2>
            <p className="enquiry-intro">
              Send John the outline of your situation and he will come back to
              you personally. If your hearing is tomorrow or your police
              interview is today, please call instead — that reaches him faster
              than any form.
            </p>
            <div className="enquiry-direct">
              <a href={config.telHref}>
                <Icon name="call" size={18} />
                <span>
                  {config.phoneE164
                    ? config.phoneDisplay
                    : "Call John"}
                </span>
              </a>
              <a href={config.mailtoHref}>
                <Icon name="arrowRight" size={18} />
                <span>{config.email}</span>
              </a>
            </div>
          </div>

          {succeeded ? (
            <div className="enquiry-success" role="status">
              <p className="eyebrow">
                <span className="small-rule" /> Enquiry received
              </p>
              <h3>Thank you — your enquiry has reached John.</h3>
              <p>
                A confirmation has been sent to your email address. John reads
                every enquiry himself and will come back to you directly to talk
                through your situation.
              </p>
              <p>
                If matters change before you hear back — a new date, a letter
                from the court, anything urgent — please call rather than send a
                second enquiry.
              </p>
              <p className="enquiry-success-note">
                Sending this enquiry does not create a solicitor–client
                relationship. None exists until John has confirmed he is able to
                act and the terms of business are agreed.
              </p>
            </div>
          ) : (
            <form ref={formRef} className="enquiry-form" action={readOnly ? undefined : formAction}
              onSubmit={readOnly ? (event) => event.preventDefault() : undefined}>
              <input type="hidden" name="sourcePath" value={pathname} />
              {enquiryAttributionFields.map((field) => (
                <input
                  key={field}
                  type="hidden"
                  name={field}
                  value={attribution[field]}
                />
              ))}
              {/* Honeypot. Hidden from sight, assistive technology and tab order. */}
              <div className="enquiry-honeypot" aria-hidden="true">
                <label htmlFor={`${formId}-${honeypotField}`}>
                  Company (leave blank)
                </label>
                <input
                  id={`${formId}-${honeypotField}`}
                  type="text"
                  name={honeypotField}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <fieldset disabled={pending || readOnly}>
                <legend className="sr-only">Case enquiry details</legend>

                {state.status === "error" && state.message ? (
                  <p
                    ref={alertRef}
                    className="enquiry-alert"
                    role="alert"
                    tabIndex={-1}
                  >
                    {state.message}
                  </p>
                ) : null}

                <div className="enquiry-form-row">
                  <label>
                    <span>First name</span>
                    <input
                      type="text"
                      autoComplete="given-name"
                      maxLength={80}
                      required
                      {...fieldProps("firstName")}
                    />
                    <FieldError
                      id={`${formId}-firstName-error`}
                      message={state.fieldErrors.firstName}
                    />
                  </label>
                  <label>
                    <span>Last name</span>
                    <input
                      type="text"
                      autoComplete="family-name"
                      maxLength={80}
                      required
                      {...fieldProps("lastName")}
                    />
                    <FieldError
                      id={`${formId}-lastName-error`}
                      message={state.fieldErrors.lastName}
                    />
                  </label>
                </div>

                <div className="enquiry-form-row">
                  <label>
                    <span>Phone number</span>
                    <input
                      type="tel"
                      autoComplete="tel"
                      maxLength={40}
                      required
                      {...fieldProps("phone")}
                    />
                    <FieldError
                      id={`${formId}-phone-error`}
                      message={state.fieldErrors.phone}
                    />
                  </label>
                  <label>
                    <span>Email address</span>
                    <input
                      type="email"
                      autoComplete="email"
                      maxLength={254}
                      required
                      {...fieldProps("email")}
                    />
                    <FieldError
                      id={`${formId}-email-error`}
                      message={state.fieldErrors.email}
                    />
                  </label>
                </div>

                <label>
                  <span>Type of matter</span>
                  <select required {...fieldProps("matterType")}>
                    <option value="">Please select</option>
                    {matterTypes.map((matter) => (
                      <option key={matter} value={matter}>
                        {matter}
                      </option>
                    ))}
                  </select>
                  <FieldError
                    id={`${formId}-matterType-error`}
                    message={state.fieldErrors.matterType}
                  />
                </label>

                <div className="enquiry-form-row">
                  <label>
                    <span>Court or interview date, if known</span>
                    <input
                      type="text"
                      maxLength={120}
                      placeholder="For example, 15 March 2026"
                      {...fieldProps("courtDate")}
                    />
                    <FieldError
                      id={`${formId}-courtDate-error`}
                      message={state.fieldErrors.courtDate}
                    />
                  </label>
                  <label>
                    <span>Court or police station, if known</span>
                    <input
                      type="text"
                      maxLength={160}
                      {...fieldProps("courtLocation")}
                    />
                    <FieldError
                      id={`${formId}-courtLocation-error`}
                      message={state.fieldErrors.courtLocation}
                    />
                  </label>
                </div>

                <label>
                  <span>Brief description of your case</span>
                  <textarea
                    rows={6}
                    maxLength={descriptionMaxLength}
                    required
                    {...fieldProps("description")}
                  />
                  <FieldError
                    id={`${formId}-description-error`}
                    message={state.fieldErrors.description}
                  />
                </label>

                <button type="submit">
                  {pending ? "Sending…" : "Send enquiry"}
                </button>
              </fieldset>

              <p className="enquiry-preview-note">
                Your enquiry goes to John and is stored securely so that he can
                respond. Please keep it to a brief outline — do not send
                confidential documents or full case papers until John has
                confirmed he is able to act. The{" "}
                <Link href="/privacy">privacy notice</Link> explains how your
                details are handled.
              </p>
            </form>
          )}
        </div>
      </Container>
    </section>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <span className="enquiry-error" id={id}>
      {message}
    </span>
  );
}

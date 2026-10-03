import assert from "node:assert/strict";
import test from "node:test";

import {
  enquiryFullName,
  isEnquiryStatus,
  validateEnquiry,
} from "../lib/enquiries/schema.ts";

const validEnquiry = {
  firstName: " Jane ",
  lastName: " Smith ",
  phone: " +44 7700 900123 ",
  email: " jane@example.com ",
  matterType: "Speeding",
  courtDate: "",
  courtLocation: "",
  description: " I need advice about a notice. ",
};

test("valid enquiries are trimmed and optional fields may be blank", () => {
  const result = validateEnquiry(validEnquiry);

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.deepEqual(result.values, {
    firstName: "Jane",
    lastName: "Smith",
    phone: "+44 7700 900123",
    email: "jane@example.com",
    matterType: "Speeding",
    courtDate: "",
    courtLocation: "",
    description: "I need advice about a notice.",
  });
});

test("invalid contact details and an unknown matter type are rejected", () => {
  const result = validateEnquiry({
    ...validEnquiry,
    phone: "123",
    email: "not-an-email",
    matterType: "A made-up category",
  });

  assert.equal(result.ok, false);
  if (result.ok) return;

  assert.deepEqual(result.fieldErrors, {
    phone: "Enter a complete telephone number.",
    email: "Check your email address and try again.",
    matterType: "Choose one of the listed options.",
  });
});

test("required enquiry fields report actionable messages", () => {
  const result = validateEnquiry({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    matterType: "",
    courtDate: "",
    courtLocation: "",
    description: "",
  });

  assert.equal(result.ok, false);
  if (result.ok) return;

  assert.deepEqual(Object.keys(result.fieldErrors).sort(), [
    "description",
    "email",
    "firstName",
    "lastName",
    "matterType",
    "phone",
  ]);
});

test("stored enquiry vocabulary only accepts known statuses", () => {
  assert.equal(isEnquiryStatus("new"), true);
  assert.equal(isEnquiryStatus("replied"), true);
  assert.equal(isEnquiryStatus("deleted"), false);
  assert.equal(isEnquiryStatus(null), false);
});

test("enquiry names are formatted without stray outer whitespace", () => {
  assert.equal(
    enquiryFullName({ first_name: "Jane", last_name: "Smith" }),
    "Jane Smith",
  );
  assert.equal(enquiryFullName({ first_name: "Jane", last_name: "" }), "Jane");
});

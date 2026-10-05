"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { SeoTip } from "@/components/admin/seo-tip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { iconNames } from "@/components/ui/icons";
import {
  itemCountName,
  itemFieldName,
  type ItemField,
  type SectionField,
} from "@/lib/cms/sections/schema";
import { emptyItemRow } from "@/lib/cms/sections/values";

/**
 * A repeating group of rows — process steps, penalty cards, table rows.
 *
 * Shared by the page-section editor and the offence-page editor, and written
 * against the same `SectionField` description both use, so the rows an editor
 * renders are the rows `readItems` in `lib/cms/sections/values.ts` reads back.
 *
 * Rows are React state rather than uncontrolled inputs. They have to be: they
 * can be added, removed and reordered, and React resets a form after an action
 * settles, which would empty them on a rejected save. `useItemRows` holds that
 * state for every repeating field in one form.
 */

type Row = Record<string, string> & { _key?: string };

/** Editor rows keyed by field, each with a stable React key. */
function keyed(initial: Record<string, Record<string, string>[]>) {
  return Object.fromEntries(
    Object.entries(initial).map(([key, list]) => [key, list.map(withKey)]),
  );
}

/**
 * State and handlers for every repeating field of one form.
 *
 * `initial` is keyed by field, each entry the rows as editor text. Returns
 * `rowsFor`, which gives one field its rows and handlers ready to spread onto
 * `ItemsField`, and `resetRows`, which replaces them all — for a form whose
 * content has just been put back to its defaults.
 */
export function useItemRows(initial: Record<string, Record<string, string>[]>) {
  const [rows, setRows] = useState<Record<string, Row[]>>(() => keyed(initial));

  function resetRows(next: Record<string, Record<string, string>[]>) {
    setRows(keyed(next));
  }

  function rowsFor(field: SectionField) {
    const key = field.key;

    return {
      rows: rows[key] ?? [],
      onUpdate: (index: number, part: string, value: string) =>
        setRows((current) => ({
          ...current,
          [key]: (current[key] ?? []).map((row, i) =>
            i === index ? { ...row, [part]: value } : row,
          ),
        })),
      onMove: (index: number, by: -1 | 1) =>
        setRows((current) => {
          const next = [...(current[key] ?? [])];
          const target = index + by;

          if (target < 0 || target >= next.length) return current;

          [next[index], next[target]] = [next[target], next[index]];

          return { ...current, [key]: next };
        }),
      onRemove: (index: number) =>
        setRows((current) => ({
          ...current,
          [key]: (current[key] ?? []).filter((_, i) => i !== index),
        })),
      onAdd: () =>
        setRows((current) => ({
          ...current,
          [key]: [...(current[key] ?? []), withKey(emptyItemRow(field))],
        })),
    };
  }

  return { rowsFor, resetRows };
}

export function ItemsField({
  field,
  formId,
  rows,
  error,
  errorId,
  onUpdate,
  onMove,
  onRemove,
  onAdd,
}: {
  field: SectionField;
  formId: string;
  rows: Row[];
  error?: string;
  errorId?: string;
  onUpdate: (index: number, key: string, value: string) => void;
  onMove: (index: number, by: -1 | 1) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
}) {
  if (!field.item) return null;

  const { label: itemLabel, fields: subFields, max } = field.item;
  const atMax = max !== undefined && rows.length >= max;

  return (
    <fieldset className="rounded-xl border p-3 md:p-4">
      <legend className="px-1 text-sm leading-none font-medium">
        {field.label}
      </legend>

      {field.hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{field.hint}</p>
      ) : null}
      {/* Once for the whole group rather than in every row, where a dozen
          copies of the same advice would bury the fields. */}
      {field.seo ? <SeoTip className="mt-1.5">{field.seo}</SeoTip> : null}
      <div className="mb-3" />

      <input type="hidden" name={itemCountName(field.key)} value={rows.length} />

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          Nothing here yet.
        </p>
      ) : null}

      <ol className="space-y-3">
        {rows.map((row, index) => (
          <li key={row._key} className="rounded-lg border p-3">
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                {itemLabel} {index + 1}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={index === 0}
                  onClick={() => onMove(index, -1)}
                >
                  <ArrowUp aria-hidden="true" />
                  <span className="sr-only">
                    Move {itemLabel.toLowerCase()} {index + 1} up
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={index === rows.length - 1}
                  onClick={() => onMove(index, 1)}
                >
                  <ArrowDown aria-hidden="true" />
                  <span className="sr-only">
                    Move {itemLabel.toLowerCase()} {index + 1} down
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(index)}
                >
                  <Trash2 aria-hidden="true" />
                  <span className="sr-only">
                    Remove {itemLabel.toLowerCase()} {index + 1}
                  </span>
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {subFields.map((sub) => (
                <ItemInput
                  key={sub.key}
                  sub={sub}
                  id={`${formId}-${field.key}-${index}-${sub.key}`}
                  name={itemFieldName(field.key, index, sub.key)}
                  value={row[sub.key] ?? ""}
                  onChange={(value) => onUpdate(index, sub.key, value)}
                />
              ))}
            </div>
          </li>
        ))}
      </ol>

      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        disabled={atMax}
        onClick={onAdd}
      >
        <Plus aria-hidden="true" />
        Add {itemLabel.toLowerCase()}
      </Button>

      {atMax ? (
        <p className="mt-2 text-xs text-muted-foreground">
          {max} is as many as this section lays out.
        </p>
      ) : null}
    </fieldset>
  );
}

function ItemInput({
  sub,
  id,
  name,
  value,
  onChange,
}: {
  sub: ItemField;
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const options =
    sub.kind === "icon"
      ? iconNames.map((icon) => ({ value: icon, label: icon }))
      : sub.kind === "select"
        ? (sub.options ?? [])
        : null;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {sub.label}
        {sub.required ? null : (
          <span className="text-xs font-normal text-muted-foreground">
            optional
          </span>
        )}
      </Label>
      {options ? (
        <select
          id={id}
          name={name}
          // A new row starts empty. For a `select`, show it on the fallback
          // option, which is also what `readItems` would store for it.
          value={sub.kind === "select" ? value || options[0]?.value : value}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : sub.kind === "text" ? (
        <Input
          id={id}
          name={name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <Textarea
          id={id}
          name={name}
          rows={sub.rows ?? 3}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {sub.hint ? (
        <p className="text-xs text-muted-foreground">{sub.hint}</p>
      ) : null}
    </div>
  );
}

/**
 * A stable React key for a row.
 *
 * Index keys would do the wrong thing on reorder and removal — React would
 * reuse the inputs in place and the text would appear to jump between rows.
 */
function withKey(row: Record<string, string>): Row {
  return { ...row, _key: crypto.randomUUID() };
}

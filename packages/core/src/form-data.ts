import { compact } from "es-toolkit/array";
import { pickBy } from "es-toolkit/object";

export interface FormDataReader {
  get(name: string): unknown;
}

export function formString(data: FormDataReader, key: string): string {
  const value = data.get(key);

  return typeof value === "string" ? value : "";
}

export function formTrimmedString(data: FormDataReader, key: string): string {
  return formString(data, key).trim();
}

export function formSeparatedList(data: FormDataReader, key: string): string[] {
  return compact(
    formString(data, key)
      .split(/[\n,]/)
      .map((value) => value.trim()),
  );
}

export function formHeaderLines(data: FormDataReader, key = "headers"): Record<string, string> {
  return Object.fromEntries(
    compact(
      formString(data, key)
        .split("\n")
        .map((line) => {
          const trimmed = line.trim();
          const separatorIndex = trimmed.indexOf(":");

          if (separatorIndex <= 0) {
            return null;
          }

          const headerKey = trimmed.slice(0, separatorIndex).trim();
          const headerValue = trimmed.slice(separatorIndex + 1).trim();

          return headerKey && headerValue ? ([headerKey, headerValue] as const) : null;
        }),
    ),
  );
}

export function nonEmptyObject<T extends Record<string, unknown>>(value: T): T | undefined {
  const compacted = pickBy(value, (entry) => {
    if (typeof entry === "string") {
      return entry.length > 0;
    }

    if (Array.isArray(entry)) {
      return entry.length > 0;
    }

    if (entry && typeof entry === "object") {
      return Object.keys(entry).length > 0;
    }

    return entry !== undefined && entry !== null;
  }) as T;

  return Object.keys(compacted).length > 0 ? compacted : undefined;
}

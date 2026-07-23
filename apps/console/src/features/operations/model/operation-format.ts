import * as React from "react";

import { fallbackTimeZone } from "#/i18n/time-zone";
import { useLocale, useTimeZone } from "#/i18n/use-i18n";

export interface OperationDateFormatter {
  formatDateTime: (value: string) => string;
  formatTime: (value: string) => string;
}

export function useOperationDateFormatter(): OperationDateFormatter {
  const locale = useLocale();
  const timeZone = useTimeZone();

  return useOperationDateFormatterForTimeZone(locale, timeZone ?? fallbackTimeZone);
}

function useOperationDateFormatterForTimeZone(
  locale: string,
  timeZone: string,
): OperationDateFormatter {
  return React.useMemo(
    () => ({
      formatDateTime: (value) => formatDateTime(value, { locale, timeZone }),
      formatTime: (value) => formatTime(value, { locale, timeZone }),
    }),
    [locale, timeZone],
  );
}

export function formatTime(value: string, options: DateFormatOptions = {}): string {
  return createDateTimeFormat(options, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatDateTime(value: string, options: DateFormatOptions = {}): string {
  return createDateTimeFormat(options, {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function summarizeResponseBody(value: string | null): string {
  if (!value?.trim()) {
    return "—";
  }

  const normalized = value.replaceAll(/\s+/g, " ").trim();
  return normalized.length > 120 ? `${normalized.slice(0, 117)}...` : normalized;
}

interface DateFormatOptions {
  locale?: string;
  timeZone?: string;
}

function createDateTimeFormat(
  options: DateFormatOptions,
  formatOptions: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(options.locale, {
    ...formatOptions,
    hour12: false,
    timeZone: options.timeZone ?? fallbackTimeZone,
  });
}

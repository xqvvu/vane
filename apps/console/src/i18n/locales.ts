export const defaultLocale = "en-US";
export const supportedLocales = ["en-US", "zh-Hans"] as const;

export type AppLocale = (typeof supportedLocales)[number];

const supportedLocaleSet = new Set<string>(supportedLocales);

export function isAppLocale(value: string): value is AppLocale {
  return supportedLocaleSet.has(value);
}

export function normalizeLocale(value: string | null | undefined): AppLocale | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().replaceAll("_", "-");
  const lower = normalized.toLocaleLowerCase();

  if (lower === "zh" || lower === "zh-cn" || lower === "zh-sg" || lower === "zh-hans") {
    return "zh-Hans";
  }

  if (lower === "en" || lower === "en-us") {
    return "en-US";
  }

  return null;
}

export function localeDisplayName(locale: AppLocale): string {
  switch (locale) {
    case "zh-Hans": {
      return "简体中文";
    }
    case "en-US": {
      return "English";
    }
  }
}

export function resolveLocale(input: {
  cookieLocale?: string | null;
  acceptLanguage?: string | null;
  fallback?: AppLocale;
}): AppLocale {
  return (
    normalizeLocale(input.cookieLocale) ??
    parseAcceptLanguage(input.acceptLanguage) ??
    input.fallback ??
    defaultLocale
  );
}

export function parseAcceptLanguage(header: string | null | undefined): AppLocale | null {
  if (!header) {
    return null;
  }

  return (
    header
      .split(",")
      .map(parseAcceptLanguagePart)
      .filter(
        (part): part is { locale: AppLocale; quality: number; index: number } => part !== null,
      )
      .sort((left, right) => right.quality - left.quality || left.index - right.index)[0]?.locale ??
    null
  );
}

function parseAcceptLanguagePart(
  part: string,
  index: number,
): { locale: AppLocale; quality: number; index: number } | null {
  const [tagPart, ...parameterParts] = part.split(";");
  const locale = normalizeLocale(tagPart);

  if (!locale) {
    return null;
  }

  const quality = parameterParts
    .map((parameter) => parameter.trim())
    .find((parameter) => parameter.startsWith("q="));

  return {
    locale,
    quality: quality ? Number(quality.slice(2)) || 0 : 1,
    index,
  };
}

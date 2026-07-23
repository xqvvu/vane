import type { AbstractIntlMessages } from "use-intl";

import type { AppLocale } from "#/i18n/locales";
import enUsMessages from "#/i18n/messages/en-US.json";
import zhHansMessages from "#/i18n/messages/zh-Hans.json";

export type FlatAppMessages = typeof enUsMessages;
export type AppMessages = AbstractIntlMessages;

const flatMessagesByLocale = {
  "en-US": enUsMessages,
  "zh-Hans": zhHansMessages,
} satisfies Record<AppLocale, FlatAppMessages>;

export const messagesByLocale = {
  "en-US": expandFlatMessages(enUsMessages),
  "zh-Hans": expandFlatMessages(zhHansMessages),
} satisfies Record<AppLocale, AppMessages>;

export function getMessages(locale: AppLocale): AppMessages {
  return messagesByLocale[locale];
}

export function getFlatMessages(locale: AppLocale): FlatAppMessages {
  return flatMessagesByLocale[locale];
}

function expandFlatMessages(messages: FlatAppMessages): AppMessages {
  const expanded: AppMessages = {};

  for (const [flatKey, message] of Object.entries(messages)) {
    const parts = flatKey.split(".");
    let cursor = expanded;

    for (const part of parts.slice(0, -1)) {
      const next = cursor[part];

      if (typeof next === "string") {
        throw new Error(
          `Cannot expand i18n key "${flatKey}" because "${part}" is already a message.`,
        );
      }

      cursor = next ?? (cursor[part] = {});
    }

    const leafKey = parts.at(-1);

    if (!leafKey) {
      throw new Error(`Cannot expand empty i18n key "${flatKey}".`);
    }

    cursor[leafKey] = message;
  }

  return expanded;
}

import json from "@shikijs/langs/json";
import githubDark from "@shikijs/themes/github-dark";
import githubLight from "@shikijs/themes/github-light";
import {
  createHighlighterCore,
  type LanguageRegistration,
  type ThemeRegistration,
} from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

const CODE_BLOCK_LANGUAGES = {
  json,
} satisfies Record<string, LanguageRegistration[]>;

const CODE_BLOCK_THEMES = {
  light: {
    name: "github-light",
    registration: githubLight,
  },
  dark: {
    name: "github-dark",
    registration: githubDark,
  },
} as const satisfies Record<"light" | "dark", { name: string; registration: ThemeRegistration }>;

export type CodeBlockLanguage = keyof typeof CODE_BLOCK_LANGUAGES;

const highlighterPromise = createHighlighterCore({
  engine: createJavaScriptRegexEngine(),
  langs: Object.values(CODE_BLOCK_LANGUAGES).flat(),
  themes: Object.values(CODE_BLOCK_THEMES).map(({ registration }) => registration),
});

export async function tokenizeCode(code: string, language: CodeBlockLanguage) {
  const highlighter = await highlighterPromise;

  return highlighter.codeToTokens(code, {
    lang: language,
    themes: {
      dark: CODE_BLOCK_THEMES.dark.name,
      light: CODE_BLOCK_THEMES.light.name,
    },
  });
}

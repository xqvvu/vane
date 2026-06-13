import { createClientOnlyFn } from "@tanstack/react-start";
import * as React from "react";

import { Skeleton } from "#/components/ui/skeleton.tsx";

const LanguageSelectClient = React.lazy(
  createClientOnlyFn(async () => {
    const module = await import("#/i18n/language-switcher-impl.tsx");

    return { default: module.LanguageSelectClient };
  }),
);

export function LanguageSelect() {
  return <LanguageSelectClient />;
}

function LanguageSelectSkeleton() {
  return <Skeleton className="h-7 w-32" />;
}

export const LanguageSelector = Object.assign(LanguageSelect, {
  Skeleton: LanguageSelectSkeleton,
});

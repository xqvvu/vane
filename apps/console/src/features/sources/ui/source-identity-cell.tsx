import { SourceProviderIcon } from "#/features/sources/ui/source-provider-icon.tsx";
import type { SourceSummary } from "#/features/sources/ui/source-ui-types.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function SourceIdentityCell({ source }: { source: SourceSummary }) {
  const t = useTranslations();

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="border-border bg-muted/70 flex size-8 shrink-0 items-center justify-center border">
        <SourceProviderIcon provider={source.provider} />
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold" title={source.name}>
          {source.name}
        </div>
        <div className="text-muted-foreground mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] font-medium uppercase">
          <span>{t(`sources.providers.${source.provider}`)}</span>
          <span aria-hidden>|</span>
          <span className="truncate font-mono lowercase" title={source.id}>
            {source.id.slice(0, 12)}
          </span>
        </div>
      </div>
    </div>
  );
}

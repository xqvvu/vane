import { Field as UiField, FieldGroup, FieldLabel } from "#/components/ui/field.tsx";
import { Input } from "#/components/ui/input.tsx";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select.tsx";
import type { Configuration } from "#/features/configuration/model/configuration-types.ts";
import type { DashboardOperationSearch } from "#/features/operations/model/operation-search.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";
import { cn } from "#/lib/utils.ts";

export function OperationFilters({
  configuration,
  search,
  pending,
  onChange,
  layout = "grid",
}: {
  configuration: Configuration;
  search: DashboardOperationSearch;
  pending: boolean;
  onChange: (next: Partial<DashboardOperationSearch>) => void;
  layout?: "grid" | "rail";
}) {
  const t = useTranslations();

  const sourceItems = [
    { value: null, label: t("operations.filters.anySource") },
    ...configuration.sources.map((source) => ({ value: source.id, label: source.name })),
  ];
  const destinationItems = [
    { value: null, label: t("operations.filters.anyDestination") },
    ...configuration.destinations.map((destination) => ({
      value: destination.id,
      label: destination.name,
    })),
  ];

  return (
    <FieldGroup
      className={cn(
        "border-border bg-background grid gap-2 border p-2",
        layout === "grid" ? "md:grid-cols-3 xl:grid-cols-6" : null,
      )}
    >
      <UiField>
        <FieldLabel htmlFor="operation-source">{t("operations.filters.source")}</FieldLabel>
        <Select
          id="operation-source"
          items={sourceItems}
          value={search.sourceId || null}
          disabled={pending}
          onValueChange={(value) => onChange({ sourceId: value ?? "" })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("operations.filters.anySource")} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={null}>{t("operations.filters.anySource")}</SelectItem>
              {configuration.sources.map((source) => (
                <SelectItem key={source.id} value={source.id}>
                  {source.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </UiField>
      <UiField>
        <FieldLabel htmlFor="operation-severity">{t("operations.filters.severity")}</FieldLabel>
        <Select
          id="operation-severity"
          items={[
            { value: null, label: t("common.severity.any") },
            { value: "critical", label: t("common.severity.critical") },
            { value: "warning", label: t("common.severity.warning") },
            { value: "info", label: t("common.severity.info") },
            { value: "unknown", label: t("common.severity.unknown") },
          ]}
          value={search.severity || null}
          disabled={pending}
          onValueChange={(value) =>
            onChange({
              severity: (value ?? "") as DashboardOperationSearch["severity"],
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("common.severity.any")} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={null}>{t("common.severity.any")}</SelectItem>
              <SelectItem value="critical">{t("common.severity.critical")}</SelectItem>
              <SelectItem value="warning">{t("common.severity.warning")}</SelectItem>
              <SelectItem value="info">{t("common.severity.info")}</SelectItem>
              <SelectItem value="unknown">{t("common.severity.unknown")}</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </UiField>
      <UiField>
        <FieldLabel htmlFor="operation-status">{t("operations.filters.status")}</FieldLabel>
        <Select
          id="operation-status"
          items={[
            { value: null, label: t("common.alertStatus.any") },
            { value: "firing", label: t("common.alertStatus.firing") },
            { value: "resolved", label: t("common.alertStatus.resolved") },
            { value: "unknown", label: t("common.alertStatus.unknown") },
          ]}
          value={search.status || null}
          disabled={pending}
          onValueChange={(value) =>
            onChange({ status: (value ?? "") as DashboardOperationSearch["status"] })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("common.alertStatus.any")} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={null}>{t("common.alertStatus.any")}</SelectItem>
              <SelectItem value="firing">{t("common.alertStatus.firing")}</SelectItem>
              <SelectItem value="resolved">{t("common.alertStatus.resolved")}</SelectItem>
              <SelectItem value="unknown">{t("common.alertStatus.unknown")}</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </UiField>
      <UiField>
        <FieldLabel htmlFor="operation-destination">
          {t("operations.filters.destination")}
        </FieldLabel>
        <Select
          id="operation-destination"
          items={destinationItems}
          value={search.destinationId || null}
          disabled={pending}
          onValueChange={(value) => onChange({ destinationId: value ?? "" })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("operations.filters.anyDestination")} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={null}>{t("operations.filters.anyDestination")}</SelectItem>
              {configuration.destinations.map((destination) => (
                <SelectItem key={destination.id} value={destination.id}>
                  {destination.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </UiField>
      <UiField>
        <FieldLabel htmlFor="operation-delivery-state">
          {t("operations.filters.deliveryState")}
        </FieldLabel>
        <Select
          id="operation-delivery-state"
          items={[
            { value: null, label: t("common.deliveryState.any") },
            { value: "pending", label: t("common.deliveryState.pending") },
            { value: "running", label: t("common.deliveryState.running") },
            { value: "succeeded", label: t("common.deliveryState.succeeded") },
            { value: "failed", label: t("common.deliveryState.failed") },
          ]}
          value={search.deliveryState || null}
          disabled={pending}
          onValueChange={(value) =>
            onChange({
              deliveryState: (value ?? "") as DashboardOperationSearch["deliveryState"],
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("common.deliveryState.any")} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={null}>{t("common.deliveryState.any")}</SelectItem>
              <SelectItem value="pending">{t("common.deliveryState.pending")}</SelectItem>
              <SelectItem value="running">{t("common.deliveryState.running")}</SelectItem>
              <SelectItem value="succeeded">{t("common.deliveryState.succeeded")}</SelectItem>
              <SelectItem value="failed">{t("common.deliveryState.failed")}</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </UiField>
      <UiField>
        <FieldLabel htmlFor="operation-search">{t("operations.filters.search")}</FieldLabel>
        <Input
          id="operation-search"
          value={search.q ?? ""}
          disabled={pending}
          placeholder={t("operations.filters.searchPlaceholder")}
          onChange={(event) => onChange({ q: event.currentTarget.value })}
        />
      </UiField>
    </FieldGroup>
  );
}

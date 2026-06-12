import { Field as UiField, FieldGroup, FieldLabel } from "#/components/ui/field.tsx";
import { Input } from "#/components/ui/input.tsx";
import { NativeSelect, NativeSelectOption } from "#/components/ui/native-select.tsx";
import type { Configuration } from "#/features/configuration/model/configuration-types.ts";
import type { DashboardOperationSearch } from "#/features/operations/model/operation-search.ts";
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
  return (
    <FieldGroup
      className={cn(
        "border-border bg-background grid gap-2 border p-2",
        layout === "grid" ? "md:grid-cols-3 xl:grid-cols-6" : null,
      )}
    >
      <UiField>
        <FieldLabel htmlFor="operation-source">Source</FieldLabel>
        <NativeSelect
          id="operation-source"
          className="w-full"
          value={search.sourceId ?? ""}
          disabled={pending}
          onChange={(event) => onChange({ sourceId: event.currentTarget.value })}
        >
          <NativeSelectOption value="">Any source</NativeSelectOption>
          {configuration.sources.map((source) => (
            <NativeSelectOption key={source.id} value={source.id}>
              {source.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </UiField>
      <UiField>
        <FieldLabel htmlFor="operation-severity">Severity</FieldLabel>
        <NativeSelect
          id="operation-severity"
          className="w-full"
          value={search.severity ?? ""}
          disabled={pending}
          onChange={(event) =>
            onChange({
              severity: event.currentTarget.value as DashboardOperationSearch["severity"],
            })
          }
        >
          <NativeSelectOption value="">Any severity</NativeSelectOption>
          <NativeSelectOption value="critical">Critical</NativeSelectOption>
          <NativeSelectOption value="warning">Warning</NativeSelectOption>
          <NativeSelectOption value="info">Info</NativeSelectOption>
          <NativeSelectOption value="unknown">Unknown</NativeSelectOption>
        </NativeSelect>
      </UiField>
      <UiField>
        <FieldLabel htmlFor="operation-status">Status</FieldLabel>
        <NativeSelect
          id="operation-status"
          className="w-full"
          value={search.status ?? ""}
          disabled={pending}
          onChange={(event) =>
            onChange({ status: event.currentTarget.value as DashboardOperationSearch["status"] })
          }
        >
          <NativeSelectOption value="">Any status</NativeSelectOption>
          <NativeSelectOption value="firing">Firing</NativeSelectOption>
          <NativeSelectOption value="resolved">Resolved</NativeSelectOption>
          <NativeSelectOption value="unknown">Unknown</NativeSelectOption>
        </NativeSelect>
      </UiField>
      <UiField>
        <FieldLabel htmlFor="operation-destination">Destination</FieldLabel>
        <NativeSelect
          id="operation-destination"
          className="w-full"
          value={search.destinationId ?? ""}
          disabled={pending}
          onChange={(event) => onChange({ destinationId: event.currentTarget.value })}
        >
          <NativeSelectOption value="">Any destination</NativeSelectOption>
          {configuration.destinations.map((destination) => (
            <NativeSelectOption key={destination.id} value={destination.id}>
              {destination.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </UiField>
      <UiField>
        <FieldLabel htmlFor="operation-delivery-state">Delivery state</FieldLabel>
        <NativeSelect
          id="operation-delivery-state"
          className="w-full"
          value={search.deliveryState ?? ""}
          disabled={pending}
          onChange={(event) =>
            onChange({
              deliveryState: event.currentTarget.value as DashboardOperationSearch["deliveryState"],
            })
          }
        >
          <NativeSelectOption value="">Any state</NativeSelectOption>
          <NativeSelectOption value="pending">Pending</NativeSelectOption>
          <NativeSelectOption value="running">Running</NativeSelectOption>
          <NativeSelectOption value="succeeded">Succeeded</NativeSelectOption>
          <NativeSelectOption value="failed">Failed</NativeSelectOption>
        </NativeSelect>
      </UiField>
      <UiField>
        <FieldLabel htmlFor="operation-search">Search</FieldLabel>
        <Input
          id="operation-search"
          value={search.q ?? ""}
          disabled={pending}
          placeholder="title or message"
          onChange={(event) => onChange({ q: event.currentTarget.value })}
        />
      </UiField>
    </FieldGroup>
  );
}

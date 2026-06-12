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
  const sourceItems = [
    { value: null, label: "Any source" },
    ...configuration.sources.map((source) => ({ value: source.id, label: source.name })),
  ];
  const destinationItems = [
    { value: null, label: "Any destination" },
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
        <FieldLabel htmlFor="operation-source">Source</FieldLabel>
        <Select
          id="operation-source"
          items={sourceItems}
          value={search.sourceId || null}
          disabled={pending}
          onValueChange={(value) => onChange({ sourceId: value ?? "" })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Any source" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={null}>Any source</SelectItem>
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
        <FieldLabel htmlFor="operation-severity">Severity</FieldLabel>
        <Select
          id="operation-severity"
          items={operationSeverityItems}
          value={search.severity || null}
          disabled={pending}
          onValueChange={(value) =>
            onChange({
              severity: (value ?? "") as DashboardOperationSearch["severity"],
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Any severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={null}>Any severity</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </UiField>
      <UiField>
        <FieldLabel htmlFor="operation-status">Status</FieldLabel>
        <Select
          id="operation-status"
          items={operationStatusItems}
          value={search.status || null}
          disabled={pending}
          onValueChange={(value) =>
            onChange({ status: (value ?? "") as DashboardOperationSearch["status"] })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Any status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={null}>Any status</SelectItem>
              <SelectItem value="firing">Firing</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </UiField>
      <UiField>
        <FieldLabel htmlFor="operation-destination">Destination</FieldLabel>
        <Select
          id="operation-destination"
          items={destinationItems}
          value={search.destinationId || null}
          disabled={pending}
          onValueChange={(value) => onChange({ destinationId: value ?? "" })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Any destination" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={null}>Any destination</SelectItem>
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
        <FieldLabel htmlFor="operation-delivery-state">Delivery state</FieldLabel>
        <Select
          id="operation-delivery-state"
          items={operationDeliveryStateItems}
          value={search.deliveryState || null}
          disabled={pending}
          onValueChange={(value) =>
            onChange({
              deliveryState: (value ?? "") as DashboardOperationSearch["deliveryState"],
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Any state" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={null}>Any state</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="succeeded">Succeeded</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
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

const operationSeverityItems = [
  { value: null, label: "Any severity" },
  { value: "critical", label: "Critical" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Info" },
  { value: "unknown", label: "Unknown" },
];

const operationStatusItems = [
  { value: null, label: "Any status" },
  { value: "firing", label: "Firing" },
  { value: "resolved", label: "Resolved" },
  { value: "unknown", label: "Unknown" },
];

const operationDeliveryStateItems = [
  { value: null, label: "Any state" },
  { value: "pending", label: "Pending" },
  { value: "running", label: "Running" },
  { value: "succeeded", label: "Succeeded" },
  { value: "failed", label: "Failed" },
];

import { ClientOnly } from "@tanstack/react-router";

import { Skeleton } from "#/components/ui/skeleton";
import { useOperationDateFormatter } from "#/features/operations/model/operation-format";
import { cn } from "#/lib/utils";

export interface OperationTimestampProps {
  className?: string;
  format: "dateTime" | "time";
  skeletonClassName?: string;
  titleFormat?: "dateTime" | "time";
  value: string;
}

export function OperationTimestamp({
  className,
  format,
  skeletonClassName,
  titleFormat = "dateTime",
  value,
}: OperationTimestampProps) {
  return (
    <ClientOnly
      fallback={
        <Skeleton
          aria-hidden
          className={cn(format === "dateTime" ? "h-4 w-32" : "h-4 w-11", skeletonClassName)}
        />
      }
    >
      <OperationTimestampText
        className={className}
        format={format}
        titleFormat={titleFormat}
        value={value}
      />
    </ClientOnly>
  );
}

function OperationTimestampText({
  className,
  format,
  titleFormat,
  value,
}: Required<Pick<OperationTimestampProps, "format" | "titleFormat" | "value">> &
  Pick<OperationTimestampProps, "className">) {
  const dateFormatter = useOperationDateFormatter();
  const displayValue =
    format === "dateTime" ? dateFormatter.formatDateTime(value) : dateFormatter.formatTime(value);
  const title =
    titleFormat === "dateTime"
      ? dateFormatter.formatDateTime(value)
      : dateFormatter.formatTime(value);

  return (
    <time className={className} dateTime={value} title={title}>
      {displayValue}
    </time>
  );
}

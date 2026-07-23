import { stickyActionsColumnClassName } from "#/components/common/operations-table-layout";

export const eventsPageSize = 20;
export const eventsTableMinWidthClassName = "min-w-275";

export function eventsColumnClassName(columnId: string): string | null {
  switch (columnId) {
    case "event":
      return "w-[32%]";
    case "source":
      return "w-[12%]";
    case "state":
      return "w-[10%]";
    case "deliveries":
      return "w-[19%]";
    case "received":
      return "w-[17%]";
    case "actions":
      return `${stickyActionsColumnClassName} w-[10%] min-w-24`;
    default:
      return null;
  }
}

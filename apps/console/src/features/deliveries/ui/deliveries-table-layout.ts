import { stickyActionsColumnClassName } from "#/components/common/operations-table-layout";

export const deliveriesPageSize = 20;
export const deliveriesTableMinWidthClassName = "min-w-320";

export function deliveriesColumnClassName(columnId: string): string | null {
  switch (columnId) {
    case "target":
      return "w-[16%]";
    case "event":
      return "w-[19%]";
    case "state":
      return "w-[8%]";
    case "attempts":
      return "w-[7%]";
    case "next":
      return "w-[8%]";
    case "lastError":
      return "w-[22%]";
    case "updated":
      return "w-[11%]";
    case "actions":
      return `${stickyActionsColumnClassName} w-[9%] min-w-24`;
    default:
      return null;
  }
}

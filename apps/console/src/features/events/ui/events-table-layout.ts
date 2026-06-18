export const eventsPageSize = 20;

export function eventsColumnClassName(columnId: string): string | null {
  switch (columnId) {
    case "event":
      return "w-[34%]";
    case "source":
      return "w-[14%]";
    case "state":
      return "w-[10%]";
    case "deliveries":
      return "w-[20%]";
    case "received":
      return "w-[16%]";
    case "actions":
      return "w-[6%]";
    default:
      return null;
  }
}

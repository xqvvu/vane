import { cn } from "#/lib/utils.ts";

export function powerActionButtonClassName(enabled: boolean): string {
  return cn(
    "relative overflow-visible border-0 bg-transparent shadow-none hover:border-0 hover:bg-transparent focus-visible:border-0",
    enabled
      ? "text-destructive hover:text-destructive focus-visible:ring-destructive/35 [&_svg]:drop-shadow-[0_0_6px_rgb(248_113_113_/_0.95)] [&_svg]:transition-[filter,color] hover:[&_svg]:drop-shadow-[0_0_9px_rgb(248_113_113_/_1)]"
      : "text-muted-foreground hover:text-foreground focus-visible:ring-ring/35 [&_svg]:drop-shadow-none [&_svg]:transition-[filter,color]",
  );
}

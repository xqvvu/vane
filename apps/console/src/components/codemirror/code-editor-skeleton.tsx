import { Skeleton } from "#/components/ui/skeleton";

export function CodeEditorSkeleton() {
  return (
    <div className="border-border bg-background h-full min-h-0 min-w-0 overflow-hidden border">
      <div className="flex h-full min-h-0 min-w-0">
        <div className="bg-muted/70 border-border flex h-full w-16 shrink-0 flex-col gap-3 border-r px-3 py-3">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-8" />
        </div>
        <div className="h-full min-h-0 min-w-0 flex-1 p-4">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="mt-4 h-3 w-5/6" />
          <Skeleton className="mt-4 h-3 w-2/3" />
          <Skeleton className="mt-4 h-3 w-4/5" />
          <Skeleton className="mt-4 h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

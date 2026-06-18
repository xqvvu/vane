import { createClientOnlyFn } from "@tanstack/react-start";
import * as React from "react";

import { Skeleton } from "#/components/ui/skeleton.tsx";

export interface TomlEditorProps {
  id: string;
  value: string;
  placeholder: string;
  readOnly?: boolean;
  onChange: (value: string) => void;
}

const TomlEditorClient = React.lazy(
  createClientOnlyFn(async () => {
    const module = await import("#/components/codemirror/toml-editor-impl.tsx");

    return { default: module.TomlEditorClient };
  }),
);

function TomlEditorRoot(props: TomlEditorProps) {
  return <TomlEditorClient {...props} />;
}

function TomlEditorSkeleton() {
  return (
    <div className="border-border bg-background min-w-0 overflow-hidden border">
      <div className="flex min-h-112 min-w-0">
        <div className="bg-muted/70 border-border flex w-16 shrink-0 flex-col gap-3 border-r px-3 py-3">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-8" />
        </div>
        <div className="min-w-0 flex-1 p-4">
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

export const TomlEditor = Object.assign(TomlEditorRoot, {
  Skeleton: TomlEditorSkeleton,
});

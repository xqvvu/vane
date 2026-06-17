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
    const module = await import("#/components/codemirror/toml-editor-impl");

    return { default: module.TomlEditorClient };
  }),
);

function TomlEditorRoot(props: TomlEditorProps) {
  return <TomlEditorClient {...props} />;
}

function TomlEditorSkeleton() {
  return (
    <div className="border-border bg-background min-w-0 overflow-hidden border">
      <div className="border-border bg-muted/40 flex h-8 items-center gap-2 border-b px-2">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="flex min-h-[28rem] min-w-0">
        <div className="bg-muted/40 border-border w-11 shrink-0 border-r px-2 py-3">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="min-w-0 flex-1 p-3">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="mt-3 h-3 w-1/2" />
          <Skeleton className="mt-3 h-3 w-2/3" />
          <Skeleton className="mt-3 h-3 w-5/6" />
        </div>
      </div>
    </div>
  );
}

export const TomlEditor = Object.assign(TomlEditorRoot, {
  Skeleton: TomlEditorSkeleton,
});

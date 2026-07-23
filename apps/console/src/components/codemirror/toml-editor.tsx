import { createClientOnlyFn } from "@tanstack/react-start";
import * as React from "react";

import { CodeEditorSkeleton } from "#/components/codemirror/code-editor-skeleton";

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

export const TomlEditor = Object.assign(TomlEditorRoot, {
  Skeleton: CodeEditorSkeleton,
});

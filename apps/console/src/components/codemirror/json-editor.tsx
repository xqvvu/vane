import { createClientOnlyFn } from "@tanstack/react-start";
import * as React from "react";

import { CodeEditorSkeleton } from "#/components/codemirror/code-editor-skeleton";

export interface JsonEditorProps {
  id: string;
  value: string;
  placeholder: string;
  readOnly?: boolean;
  onChange: (value: string) => void;
}

const JsonEditorClient = React.lazy(
  createClientOnlyFn(async () => {
    const module = await import("#/components/codemirror/json-editor-impl");

    return { default: module.JsonEditorClient };
  }),
);

function JsonEditorRoot(props: JsonEditorProps) {
  return <JsonEditorClient {...props} />;
}

export const JsonEditor = Object.assign(JsonEditorRoot, {
  Skeleton: CodeEditorSkeleton,
});

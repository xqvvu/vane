import "@tanstack/react-start/client-only";
import { json } from "@codemirror/lang-json";
import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";

import { codeEditorTheme } from "#/components/codemirror/code-editor-theme.ts";
import { codeFoldGutter } from "#/components/codemirror/code-fold-gutter.ts";
import type { JsonEditorProps } from "#/components/codemirror/json-editor.tsx";

const jsonExtensions = [json(), codeFoldGutter(), EditorView.lineWrapping, codeEditorTheme];

export function JsonEditorClient({
  id,
  value,
  placeholder,
  readOnly = false,
  onChange,
}: JsonEditorProps) {
  return (
    <div
      id={id}
      className="border-border bg-background focus-within:ring-ring/30 h-full min-w-0 overflow-hidden border transition-shadow focus-within:ring-[1px]"
    >
      <CodeMirror
        value={value}
        height="100%"
        minHeight="min(28rem, 100%)"
        basicSetup={{
          bracketMatching: true,
          closeBrackets: true,
          foldGutter: false,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          lineNumbers: true,
          searchKeymap: true,
        }}
        extensions={jsonExtensions}
        editable={!readOnly}
        readOnly={readOnly}
        placeholder={placeholder}
        theme="none"
        className="h-full min-w-0"
        onChange={onChange}
      />
    </div>
  );
}

import "@tanstack/react-start/client-only";
import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";

import { tomlEditorTheme } from "#/components/codemirror/toml-editor-theme.ts";
import type { TomlEditorProps } from "#/components/codemirror/toml-editor.tsx";
import { toml } from "#/components/codemirror/toml-language.ts";

const tomlExtensions = [toml(), EditorView.lineWrapping, tomlEditorTheme];

export function TomlEditorClient({
  id,
  value,
  placeholder,
  readOnly = false,
  onChange,
}: TomlEditorProps) {
  return (
    <div
      id={id}
      className="border-border bg-background focus-within:ring-ring/30 min-w-0 overflow-hidden border transition-shadow focus-within:ring-[1px]"
    >
      <CodeMirror
        value={value}
        height="28rem"
        minHeight="28rem"
        basicSetup={{
          bracketMatching: true,
          closeBrackets: true,
          foldGutter: false,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          lineNumbers: true,
          searchKeymap: true,
        }}
        extensions={tomlExtensions}
        editable={!readOnly}
        readOnly={readOnly}
        placeholder={placeholder}
        theme="none"
        className="min-w-0"
        onChange={onChange}
      />
    </div>
  );
}

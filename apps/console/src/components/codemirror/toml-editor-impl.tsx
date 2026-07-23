import "@tanstack/react-start/client-only";
import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";

import { codeEditorTheme } from "#/components/codemirror/code-editor-theme";
import type { TomlEditorProps } from "#/components/codemirror/toml-editor";
import { toml } from "#/components/codemirror/toml-language";

const tomlExtensions = [toml(), EditorView.lineWrapping, codeEditorTheme];

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
        extensions={tomlExtensions}
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

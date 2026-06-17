import "@tanstack/react-start/client-only";
import { EditorView } from "@codemirror/view";
import { githubLight } from "@uiw/codemirror-theme-github";
import CodeMirror from "@uiw/react-codemirror";

import type { TomlEditorProps } from "#/components/codemirror/toml-editor";
import { toml } from "#/components/codemirror/toml-language";

const tomlExtensions = [toml(), EditorView.lineWrapping];

export function TomlEditorClient({
  id,
  value,
  placeholder,
  readOnly = false,
  onChange,
}: TomlEditorProps) {
  return (
    <div id={id} className="border-border bg-background min-w-0 overflow-hidden border">
      <CodeMirror
        value={value}
        height="28rem"
        minHeight="28rem"
        basicSetup={{
          bracketMatching: true,
          closeBrackets: true,
          foldGutter: true,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          lineNumbers: true,
          searchKeymap: true,
        }}
        extensions={tomlExtensions}
        editable={!readOnly}
        readOnly={readOnly}
        placeholder={placeholder}
        theme={githubLight}
        className="min-w-0 text-[12px] [&_.cm-content]:font-mono [&_.cm-content]:leading-5 [&_.cm-editor]:outline-none [&_.cm-scroller]:max-w-full"
        onChange={onChange}
      />
    </div>
  );
}

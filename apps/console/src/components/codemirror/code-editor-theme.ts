import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";

const codeEditorViewTheme = EditorView.theme({
  "&": {
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
    fontSize: "12px",
    minWidth: "0",
  },
  ".cm-scroller": {
    fontFamily: '"SFMono-Regular", "Cascadia Code", Consolas, "Liberation Mono", Menlo, monospace',
    lineHeight: "1.55",
    maxWidth: "100%",
  },
  ".cm-content": {
    caretColor: "var(--primary)",
    minWidth: "0",
    padding: "12px 0",
  },
  ".cm-line": {
    padding: "0 16px",
  },
  ".cm-placeholder": {
    color: "var(--muted-foreground)",
    whiteSpace: "pre-wrap",
  },
  ".cm-gutters": {
    backgroundColor: "color-mix(in oklab, var(--muted) 70%, var(--background))",
    borderRight: "1px solid var(--border)",
    color: "var(--muted-foreground)",
  },
  ".cm-gutter": {
    minHeight: "100%",
  },
  ".cm-gutterElement": {
    alignItems: "center",
    boxSizing: "border-box",
    display: "flex",
    height: "18.6px",
    lineHeight: "18.6px",
  },
  ".cm-lineNumbers .cm-gutterElement": {
    justifyContent: "flex-end",
    minWidth: "2.75rem",
    padding: "0 10px 0 12px",
  },
  ".cm-foldGutter": {
    minWidth: "1.4rem",
  },
  ".cm-foldGutter .cm-gutterElement": {
    justifyContent: "center",
    minWidth: "1.4rem",
    padding: "0",
  },
  ".cm-code-fold-marker": {
    alignItems: "center",
    color: "currentColor",
    display: "inline-flex",
    height: "12px",
    justifyContent: "center",
    lineHeight: "1",
    width: "12px",
  },
  ".cm-foldGutter .cm-gutterElement:not(.cm-activeLineGutter) .cm-code-fold-marker": {
    color: "var(--muted-foreground)",
  },
  ".cm-foldGutter .cm-gutterElement.cm-activeLineGutter .cm-code-fold-marker": {
    color: "var(--foreground)",
  },
  ".cm-code-fold-marker svg": {
    display: "block",
    fill: "none",
    height: "12px",
    overflow: "visible",
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: "1.35",
    width: "12px",
  },
  ".cm-activeLine": {
    backgroundColor: "color-mix(in oklab, var(--accent) 72%, transparent)",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "color-mix(in oklab, var(--accent) 88%, transparent)",
    color: "var(--foreground)",
  },
  ".cm-cursor": {
    borderLeftColor: "var(--primary)",
  },
  "&.cm-focused": {
    outline: "none",
  },
  "&.cm-focused .cm-cursor": {
    borderLeftColor: "var(--primary)",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
    backgroundColor: "color-mix(in oklab, var(--primary) 24%, transparent)",
  },
  ".cm-matchingBracket": {
    backgroundColor: "color-mix(in oklab, var(--primary) 12%, transparent)",
    outline: "1px solid color-mix(in oklab, var(--primary) 28%, transparent)",
  },
  ".cm-nonmatchingBracket": {
    backgroundColor: "color-mix(in oklab, var(--destructive) 12%, transparent)",
    outline: "1px solid color-mix(in oklab, var(--destructive) 30%, transparent)",
  },
  ".cm-searchMatch": {
    backgroundColor: "color-mix(in oklab, var(--primary) 18%, transparent)",
    outline: "1px solid color-mix(in oklab, var(--primary) 26%, transparent)",
  },
  ".cm-searchMatch.cm-searchMatch-selected": {
    backgroundColor: "color-mix(in oklab, var(--primary) 28%, transparent)",
  },
  ".cm-tooltip": {
    backgroundColor: "var(--popover)",
    border: "1px solid var(--border)",
    color: "var(--popover-foreground)",
  },
  ".cm-panels": {
    backgroundColor: "var(--popover)",
    borderColor: "var(--border)",
    color: "var(--popover-foreground)",
  },
});

const codeHighlightStyle = HighlightStyle.define([
  {
    tag: tags.heading,
    color: "var(--cm-toml-heading)",
    fontWeight: "600",
  },
  {
    tag: tags.className,
    color: "var(--cm-toml-table)",
    fontWeight: "600",
  },
  {
    tag: tags.propertyName,
    color: "var(--cm-toml-key)",
  },
  {
    tag: tags.string,
    color: "var(--cm-toml-string)",
  },
  {
    tag: tags.number,
    color: "var(--cm-toml-number)",
  },
  {
    tag: tags.bool,
    color: "var(--cm-toml-bool)",
    fontWeight: "600",
  },
  {
    tag: tags.atom,
    color: "var(--cm-toml-atom)",
  },
  {
    tag: tags.lineComment,
    color: "var(--cm-toml-comment)",
    fontStyle: "italic",
  },
  {
    tag: tags.punctuation,
    color: "var(--cm-toml-punctuation)",
  },
]);

export const codeEditorTheme = [codeEditorViewTheme, syntaxHighlighting(codeHighlightStyle)];

import "@tanstack/react-start/client-only";
import {
  LanguageSupport,
  LRLanguage,
  continuedIndent,
  delimitedIndent,
  foldGutter,
  foldInside,
  foldNodeProp,
  indentNodeProp,
} from "@codemirror/language";
import { styleTags, tags } from "@lezer/highlight";
import { parser } from "lezer-toml";

function createFoldMarker(open: boolean): HTMLElement {
  const marker = document.createElement("span");

  marker.className = "cm-toml-fold-marker";
  marker.setAttribute("aria-hidden", "true");
  marker.dataset.state = open ? "open" : "closed";
  marker.innerHTML = open
    ? '<svg viewBox="0 0 12 12" focusable="false"><path d="M3 4.5 6 7.5 9 4.5" /></svg>'
    : '<svg viewBox="0 0 12 12" focusable="false"><path d="M4.5 3 7.5 6 4.5 9" /></svg>';

  return marker;
}

function defineTomlLanguage(): LRLanguage {
  const comments = ["Comment"];
  const bools = ["True", "False"];
  const atoms = ["OffsetDateTime", "LocalDateTime", "LocalDate", "LocalTime"];
  const classNames = ["TopLevelTable", "Table", "ArrayTable"];
  const headings = ["TableHeader", "ArrayTableHeader"];
  const propertyNames = ["BareKey", "BasicStringKey", "LiteralStringKey", "CompoundKey"];
  const strings = [
    "ShortBasicString",
    "LongBasicString",
    "ShortLiteralString",
    "LongLiteralString",
  ];
  const numbers = [
    "DecimalInteger",
    "HexadecimalInteger",
    "OctalInteger",
    "BinaryInteger",
    "DecimalFloat",
    "Infinity NaN",
  ];

  return LRLanguage.define({
    name: "toml",
    parser: parser.configure({
      props: [
        styleTags({
          [comments.join(" ")]: tags.lineComment,
          [propertyNames.join(" ")]: tags.propertyName,
          [strings.join(" ")]: tags.string,
          [numbers.join(" ")]: tags.number,
          [bools.join(" ")]: tags.bool,
          [atoms.join(" ")]: tags.atom,
          [classNames.join(" ")]: tags.className,
          [headings.join(" ")]: tags.heading,
        }),
        indentNodeProp.add({
          Array: delimitedIndent({ closing: "]" }),
          InlineTable: delimitedIndent({ closing: "}" }),
          Pair: continuedIndent(),
        }),
        foldNodeProp.add({
          Array: foldInside,
          InlineTable: foldInside,
          Table: foldInside,
          ArrayTable: foldInside,
        }),
      ],
    }),
    languageData: {
      commentTokens: { line: "#" },
      closeBrackets: { brackets: ["[", "{", '"', "'"] },
    },
  });
}

export function toml() {
  const tomlLanguage = defineTomlLanguage();

  return new LanguageSupport(tomlLanguage, [
    foldGutter({
      markerDOM: createFoldMarker,
    }),
  ]);
}

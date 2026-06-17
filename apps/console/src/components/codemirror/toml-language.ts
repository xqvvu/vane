import {
  LanguageSupport,
  LRLanguage,
  continuedIndent,
  delimitedIndent,
  foldInside,
  foldNodeProp,
  indentNodeProp,
} from "@codemirror/language";
import { styleTags, tags as t } from "@lezer/highlight";
import { parser } from "lezer-toml";

const tomlLanguage = LRLanguage.define({
  name: "toml",
  parser: parser.configure({
    props: [
      styleTags({
        Comment: t.lineComment,
        "BareKey BasicStringKey LiteralStringKey CompoundKey": t.propertyName,
        "ShortBasicString LongBasicString ShortLiteralString LongLiteralString": t.string,
        "DecimalInteger HexadecimalInteger OctalInteger BinaryInteger DecimalFloat Infinity NaN":
          t.number,
        "True False": t.bool,
        "OffsetDateTime LocalDateTime LocalDate LocalTime": t.atom,
        "TopLevelTable Table ArrayTable": t.className,
        "TableHeader ArrayTableHeader": t.heading,
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

export function toml() {
  return new LanguageSupport(tomlLanguage);
}

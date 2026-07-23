import { toast } from "sonner";

import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockCopyButton,
  CodeBlockFilename,
  CodeBlockHeader,
  CodeBlockTitle,
} from "#/components/ai-elements/code-block";
import { useTranslations } from "#/i18n/use-i18n";
import { cn } from "#/lib/utils";

export function EventJsonBlock({
  title,
  value,
  className,
}: {
  title: string;
  value: unknown;
  className?: string;
}) {
  const t = useTranslations();
  const code = JSON.stringify(value, null, 2);

  return (
    <CodeBlock
      code={code}
      language="json"
      showLineNumbers
      className={cn("min-h-0", className)}
      contentClassName="min-h-0 flex-1"
    >
      <CodeBlockHeader>
        <CodeBlockTitle>
          <CodeBlockFilename>{title}</CodeBlockFilename>
        </CodeBlockTitle>
        <CodeBlockActions>
          <CodeBlockCopyButton
            aria-label={title}
            title={title}
            onCopy={() => toast.success(t("common.actions.copied"))}
            onError={() => toast.error(t("common.actions.copyFailed"))}
          />
        </CodeBlockActions>
      </CodeBlockHeader>
    </CodeBlock>
  );
}

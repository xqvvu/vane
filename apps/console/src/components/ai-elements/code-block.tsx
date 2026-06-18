import { RiCheckLine, RiFileCopyLine } from "@remixicon/react";
import type { ComponentProps, HTMLAttributes } from "react";
import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Button } from "#/components/ui/button.tsx";
import { copyText } from "#/lib/browser.ts";
import { cn } from "#/lib/utils.ts";

type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string;
  language: string;
  showLineNumbers?: boolean;
  contentClassName?: string;
  preClassName?: string;
};

interface CodeBlockContextType {
  code: string;
}

const CodeBlockContext = createContext<CodeBlockContextType>({
  code: "",
});

const LINE_NUMBER_CLASSES = cn(
  "block",
  "before:mr-3",
  "before:inline-block",
  "before:w-7",
  "before:select-none",
  "before:text-right",
  "before:font-mono",
  "before:text-muted-foreground/50",
  "before:[counter-increment:line]",
  "before:content-[counter(line)]",
);

interface KeyedLine {
  key: string;
  value: string;
}

const addKeysToLines = (code: string): KeyedLine[] =>
  code.split("\n").map((line, lineIndex) => ({
    key: `line-${lineIndex}-${line.length}`,
    value: line,
  }));

const CodeBlockBody = memo(function CodeBlockBody({
  code,
  showLineNumbers,
  contentClassName,
  preClassName,
}: {
  code: string;
  showLineNumbers: boolean;
  contentClassName?: string;
  preClassName?: string;
}) {
  const lines = useMemo(() => addKeysToLines(code), [code]);

  return (
    <CodeBlockContent className={contentClassName}>
      <pre
        className={cn(
          "m-0 min-w-max bg-transparent p-3 font-mono text-[11px] leading-5 text-foreground",
          showLineNumbers ? "[counter-reset:line]" : null,
          preClassName,
        )}
      >
        <code className="whitespace-pre" data-language="">
          {showLineNumbers
            ? lines.map((line) => (
                <span key={line.key} className={LINE_NUMBER_CLASSES}>
                  {line.value || " "}
                </span>
              ))
            : code}
        </code>
      </pre>
    </CodeBlockContent>
  );
});

const CodeBlock = ({
  code,
  language,
  showLineNumbers = false,
  contentClassName,
  preClassName,
  className,
  children,
  ...props
}: CodeBlockProps) => {
  const contextValue = useMemo(() => ({ code }), [code]);

  return (
    <CodeBlockContext.Provider value={contextValue}>
      <div
        data-language={language}
        className={cn(
          "relative overflow-hidden rounded-none border bg-background text-foreground",
          className,
        )}
        {...props}
      >
        {children}
        <CodeBlockBody
          code={code}
          showLineNumbers={showLineNumbers}
          contentClassName={contentClassName}
          preClassName={preClassName}
        />
      </div>
    </CodeBlockContext.Provider>
  );
};

const CodeBlockHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex min-h-8 items-center justify-between gap-2 border-b bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground",
      className,
    )}
    {...props}
  />
);

const CodeBlockTitle = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex min-w-0 items-center gap-2", className)} {...props} />
);

const CodeBlockFilename = ({ className, ...props }: HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn("min-w-0 truncate font-mono text-[11px] text-muted-foreground", className)}
    {...props}
  />
);

const CodeBlockActions = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex shrink-0 items-center gap-1", className)} {...props} />
);

type CodeBlockCopyButtonProps = ComponentProps<typeof Button> & {
  onCopy?: () => void;
  onError?: (error: Error) => void;
  timeout?: number;
};

const CodeBlockCopyButton = ({
  onCopy,
  onError,
  timeout = 2000,
  children,
  className,
  onClick,
  ...props
}: CodeBlockCopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const { code } = useContext(CodeBlockContext);
  const timeoutRef = useRef<number | null>(null);

  const copyToClipboard = useCallback(async () => {
    if (isCopied) {
      return;
    }

    try {
      const copied = await copyText(code);

      if (!copied) {
        throw new Error("Clipboard API is not available");
      }

      setIsCopied(true);
      onCopy?.();

      timeoutRef.current = window.setTimeout(() => {
        setIsCopied(false);
        timeoutRef.current = null;
      }, timeout);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }, [code, isCopied, onCopy, onError, timeout]);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  const Icon = isCopied ? RiCheckLine : RiFileCopyLine;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className={cn("text-muted-foreground hover:text-foreground", className)}
      onClick={async (event) => {
        onClick?.(event);

        if (event.defaultPrevented) {
          return;
        }

        await copyToClipboard();
      }}
      {...props}
    >
      {children ?? <Icon aria-hidden />}
    </Button>
  );
};

const CodeBlockContent = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("relative overflow-auto", className)} {...props} />
);

const CodeBlockContainer = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("not-prose flex flex-col gap-2", className)} {...props} />
);

export {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContainer,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockFilename,
  CodeBlockHeader,
  CodeBlockTitle,
};

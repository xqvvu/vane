import type { CSSProperties } from "react";
import { CheckCircle, XCircle, AlertTriangle, InfoCircle, Loader } from "reicon-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      icons={{
        success: <CheckCircle aria-hidden />,
        info: <InfoCircle aria-hidden />,
        warning: <AlertTriangle aria-hidden />,
        error: <XCircle aria-hidden />,
        loading: <Loader aria-hidden />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "!rounded-none !border-border !bg-popover !px-3 !py-2.5 !text-popover-foreground !shadow-[0_1px_2px_rgb(0_0_0/0.06)]",
          title: "!text-xs !font-medium !text-foreground",
          description: "!text-xs !text-muted-foreground !opacity-100",
          content: "!gap-0.5",
          icon: "!text-foreground [&_svg]:!size-4",
          error: "[&_[data-icon]]:!text-destructive",
          closeButton:
            "!rounded-none !border-border !bg-popover !text-muted-foreground hover:!bg-muted hover:!text-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

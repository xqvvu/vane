import "@tanstack/react-start/client-only";
import { RiLoginCircleLine, RiUserAddLine } from "@remixicon/react";
import { useNavigate } from "@tanstack/react-router";
import * as React from "react";

import { Button } from "#/components/ui/button.tsx";
import { Input } from "#/components/ui/input.tsx";
import { authClient } from "#/lib/auth.client.ts";
import { cn } from "#/lib/utils.ts";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const navigate = useNavigate();
  const [mode, setMode] = React.useState<"sign-in" | "sign-up">("sign-in");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const email = formString(form, "email");
    const password = formString(form, "password");
    const name = formString(form, "name") || "Vane Owner";

    try {
      const result =
        mode === "sign-in"
          ? await authClient.signIn.email({
              email,
              password,
            })
          : await authClient.signUp.email({
              name,
              email,
              password,
            });

      if (result.error) {
        setError(result.error.message ?? "Authentication failed");
        return;
      }

      await navigate({
        to: redirectTo as never,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="border-border grid grid-cols-2 border">
        <button
          type="button"
          className={cn(
            "flex h-8 items-center justify-center gap-1.5 text-xs font-medium",
            mode === "sign-in" ? "bg-primary text-primary-foreground" : "hover:bg-muted",
          )}
          onClick={() => setMode("sign-in")}
        >
          <RiLoginCircleLine className="size-3.5" aria-hidden />
          Sign in
        </button>
        <button
          type="button"
          className={cn(
            "border-border flex h-8 items-center justify-center gap-1.5 border-l text-xs font-medium",
            mode === "sign-up" ? "bg-primary text-primary-foreground" : "hover:bg-muted",
          )}
          onClick={() => setMode("sign-up")}
        >
          <RiUserAddLine className="size-3.5" aria-hidden />
          First setup
        </button>
      </div>

      {error ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive border px-3 py-2 text-xs">
          {error}
        </div>
      ) : null}

      <form className="space-y-3" onSubmit={(event) => void submit(event)}>
        {mode === "sign-up" ? (
          <Field label="Name">
            <Input name="name" autoComplete="name" defaultValue="Vane Owner" required />
          </Field>
        ) : null}

        <Field label="Email">
          <Input name="email" type="email" autoComplete="email" required />
        </Field>

        <Field label="Password">
          <Input
            name="password"
            type="password"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            minLength={8}
            required
          />
        </Field>

        <Button className="w-full" type="submit" disabled={pending}>
          {mode === "sign-in" ? <RiLoginCircleLine aria-hidden /> : <RiUserAddLine aria-hidden />}
          {pending ? "Working" : mode === "sign-in" ? "Sign in" : "Create owner"}
        </Button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5 text-xs font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}

function formString(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

import "@tanstack/react-start/client-only";
import { RiErrorWarningLine, RiLoginCircleLine, RiUserAddLine } from "@remixicon/react";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import * as React from "react";

import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Field as UiField, FieldError, FieldGroup, FieldLabel } from "#/components/ui/field.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs.tsx";
import { authClient } from "#/lib/auth.client.ts";

type LoginMode = "sign-in" | "sign-up";

type LoginFormValues = {
  name: string;
  email: string;
  password: string;
};

const defaultValues: LoginFormValues = {
  name: "Vane Owner",
  email: "",
  password: "",
};

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const navigate = useNavigate();
  const [mode, setMode] = React.useState<LoginMode>("sign-in");
  const [error, setError] = React.useState<string | null>(null);
  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      setError(null);

      try {
        const result =
          mode === "sign-in"
            ? await authClient.signIn.email({
                email: value.email.trim(),
                password: value.password,
              })
            : await authClient.signUp.email({
                name: value.name.trim() || defaultValues.name,
                email: value.email.trim(),
                password: value.password,
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
      }
    },
  });

  return (
    <Tabs value={mode} onValueChange={(value) => setMode(value as LoginMode)}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="sign-in">
          <RiLoginCircleLine data-icon="inline-start" aria-hidden />
          Sign in
        </TabsTrigger>
        <TabsTrigger value="sign-up">
          <RiUserAddLine data-icon="inline-start" aria-hidden />
          First setup
        </TabsTrigger>
      </TabsList>

      {error ? (
        <Alert variant="destructive">
          <RiErrorWarningLine aria-hidden />
          <AlertTitle>Authentication failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <TabsContent value={mode}>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <FieldGroup className="gap-3">
            {mode === "sign-up" ? (
              <form.Field
                name="name"
                validators={{
                  onSubmit: ({ value }) =>
                    value.trim().length === 0 ? "Name is required" : undefined,
                }}
              >
                {(field) => (
                  <UiField data-invalid={field.state.meta.errors.length > 0}>
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      autoComplete="name"
                      required
                      value={field.state.value}
                      aria-invalid={field.state.meta.errors.length > 0}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.currentTarget.value)}
                    />
                    <FieldError
                      errors={field.state.meta.errors.map((fieldError) => ({
                        message: String(fieldError),
                      }))}
                    />
                  </UiField>
                )}
              </form.Field>
            ) : null}
            <form.Field
              name="email"
              validators={{
                onSubmit: ({ value }) => {
                  const email = value.trim();

                  if (email.length === 0) {
                    return "Email is required";
                  }

                  return email.includes("@") ? undefined : "Enter a valid email address";
                },
              }}
            >
              {(field) => (
                <UiField data-invalid={field.state.meta.errors.length > 0}>
                  <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    autoComplete="email"
                    required
                    value={field.state.value}
                    aria-invalid={field.state.meta.errors.length > 0}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.currentTarget.value)}
                  />
                  <FieldError
                    errors={field.state.meta.errors.map((fieldError) => ({
                      message: String(fieldError),
                    }))}
                  />
                </UiField>
              )}
            </form.Field>
            <form.Field
              name="password"
              validators={{
                onSubmit: ({ value }) =>
                  value.length < 8 ? "Password must be at least 8 characters" : undefined,
              }}
            >
              {(field) => (
                <UiField data-invalid={field.state.meta.errors.length > 0}>
                  <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                    minLength={8}
                    required
                    value={field.state.value}
                    aria-invalid={field.state.meta.errors.length > 0}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.currentTarget.value)}
                  />
                  <FieldError
                    errors={field.state.meta.errors.map((fieldError) => ({
                      message: String(fieldError),
                    }))}
                  />
                </UiField>
              )}
            </form.Field>
          </FieldGroup>

          <form.Subscribe
            selector={(state) => ({
              canSubmit: state.canSubmit,
              isSubmitting: state.isSubmitting,
            })}
          >
            {({ canSubmit, isSubmitting }) => (
              <Button className="w-full" type="submit" disabled={!canSubmit || isSubmitting}>
                {mode === "sign-in" ? (
                  <RiLoginCircleLine data-icon="inline-start" aria-hidden />
                ) : (
                  <RiUserAddLine data-icon="inline-start" aria-hidden />
                )}
                {isSubmitting ? "Working" : mode === "sign-in" ? "Sign in" : "Create owner"}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </TabsContent>
    </Tabs>
  );
}

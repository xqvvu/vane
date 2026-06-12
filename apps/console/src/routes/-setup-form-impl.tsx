import "@tanstack/react-start/client-only";
import { RiUserAddLine } from "@remixicon/react";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "#/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card.tsx";
import { Field as UiField, FieldError, FieldGroup, FieldLabel } from "#/components/ui/field.tsx";
import { Input } from "#/components/ui/input.tsx";
import { authQueryKeys } from "#/features/auth/api/auth.queries.ts";
import { authClient } from "#/lib/auth.client.ts";
import type { SetupFormProps } from "#/routes/-setup-form.tsx";

type SetupFormValues = {
  name: string;
  email: string;
  password: string;
};

const defaultValues: SetupFormValues = {
  name: "Vane Owner",
  email: "",
  password: "",
};

export function SetupFormClient({ redirectTo }: SetupFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        const result = await authClient.signUp.email({
          name: value.name.trim() || defaultValues.name,
          email: value.email.trim(),
          password: value.password,
        });

        if (result.error) {
          toast.error("Setup failed", {
            description: result.error.message ?? "The owner account could not be created.",
          });
          return;
        }

        await queryClient.invalidateQueries({
          queryKey: authQueryKeys.all,
        });
        toast.success("Owner account created", {
          description: "Opening the dashboard.",
        });
        await navigate({
          to: redirectTo as never,
        });
      } catch (caught) {
        toast.error("Setup failed", {
          description: caught instanceof Error ? caught.message : String(caught),
        });
      }
    },
  });

  return (
    <Card className="w-full max-w-sm" data-testid="setup-card">
      <CardHeader>
        <CardTitle>Create owner account</CardTitle>
        <CardDescription>Register the first dashboard user for this deployment.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <FieldGroup>
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
                    placeholder="admin@example.test"
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
                    autoComplete="new-password"
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

            <form.Subscribe
              selector={(state) => ({
                canSubmit: state.canSubmit,
                isSubmitting: state.isSubmitting,
              })}
            >
              {({ canSubmit, isSubmitting }) => (
                <UiField>
                  <Button type="submit" disabled={!canSubmit || isSubmitting}>
                    <RiUserAddLine data-icon="inline-start" aria-hidden />
                    {isSubmitting ? "Creating owner" : "Create owner"}
                  </Button>
                </UiField>
              )}
            </form.Subscribe>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

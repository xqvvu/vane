import "@tanstack/react-start/client-only";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Login } from "reicon-react";
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
import { useTranslations } from "#/i18n/use-i18n.ts";
import { authClient } from "#/lib/auth.client.ts";
import type { LoginFormProps } from "#/routes/-login-form.tsx";

type LoginFormValues = {
  email: string;
  password: string;
};

const defaultValues: LoginFormValues = {
  email: "",
  password: "",
};

export function LoginFormClient({ redirectTo }: LoginFormProps) {
  const t = useTranslations();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        const result = await authClient.signIn.email({
          email: value.email.trim(),
          password: value.password,
        });

        if (result.error) {
          toast.error(t("auth.login.failureTitle"), {
            description: result.error.message ?? t("auth.login.failureDescription"),
          });
          return;
        }

        queryClient.removeQueries({
          queryKey: authQueryKeys.dashboardSession(),
        });
        await queryClient.invalidateQueries({
          queryKey: authQueryKeys.all,
        });
        toast.success(t("auth.login.successTitle"), {
          description: t("auth.login.successDescription"),
        });
        await navigate({
          to: redirectTo as never,
          replace: true,
        });
      } catch (caught) {
        toast.error(t("auth.login.failureTitle"), {
          description: caught instanceof Error ? caught.message : String(caught),
        });
      }
    },
  });

  return (
    <Card className="w-full max-w-sm" data-testid="login-card">
      <CardHeader>
        <CardTitle>{t("auth.login.title")}</CardTitle>
        <CardDescription>{t("auth.login.description")}</CardDescription>
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
              name="email"
              validators={{
                onSubmit: ({ value }) => {
                  const email = value.trim();

                  if (email.length === 0) {
                    return t("auth.login.validation.emailRequired");
                  }

                  return email.includes("@") ? undefined : t("auth.login.validation.emailInvalid");
                },
              }}
            >
              {(field) => (
                <UiField data-invalid={field.state.meta.errors.length > 0}>
                  <FieldLabel htmlFor={field.name}>{t("auth.login.emailLabel")}</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    autoComplete="email"
                    placeholder={t("auth.login.emailPlaceholder")}
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
                  value.length < 8 ? t("auth.login.validation.passwordMin") : undefined,
              }}
            >
              {(field) => (
                <UiField data-invalid={field.state.meta.errors.length > 0}>
                  <FieldLabel htmlFor={field.name}>{t("auth.login.passwordLabel")}</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    autoComplete="current-password"
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
                    <Login data-icon="inline-start" aria-hidden />
                    {isSubmitting ? t("auth.login.submitting") : t("auth.login.submit")}
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

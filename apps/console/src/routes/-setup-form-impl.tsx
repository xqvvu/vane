import "@tanstack/react-start/client-only";
import { RiUserAddLine } from "@remixicon/react";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { Field as UiField, FieldError, FieldGroup, FieldLabel } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { authQueryKeys } from "#/features/auth/api/auth.queries";
import { useTranslations } from "#/i18n/use-i18n";
import { authClient } from "#/lib/auth.client";
import type { SetupFormProps } from "#/routes/-setup-form";

type SetupFormValues = {
  name: string;
  email: string;
  password: string;
};

export function SetupFormClient({ redirectTo }: SetupFormProps) {
  const t = useTranslations();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const defaultValues: SetupFormValues = {
    name: t("auth.setup.defaultName"),
    email: "",
    password: "",
  };
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
          toast.error(t("auth.setup.failureTitle"), {
            description: result.error.message ?? t("auth.setup.failureDescription"),
          });
          return;
        }

        queryClient.removeQueries({
          queryKey: authQueryKeys.dashboardSession(),
        });
        queryClient.removeQueries({
          queryKey: authQueryKeys.bootstrap(),
        });
        await queryClient.invalidateQueries({
          queryKey: authQueryKeys.all,
        });
        toast.success(t("auth.setup.successTitle"), {
          description: t("auth.setup.successDescription"),
        });
        await navigate({
          to: redirectTo as never,
          replace: true,
        });
      } catch (caught) {
        toast.error(t("auth.setup.failureTitle"), {
          description: caught instanceof Error ? caught.message : String(caught),
        });
      }
    },
  });

  return (
    <Card className="w-full max-w-sm" data-testid="setup-card">
      <CardHeader>
        <CardTitle>{t("auth.setup.title")}</CardTitle>
        <CardDescription>{t("auth.setup.description")}</CardDescription>
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
                  value.trim().length === 0 ? t("auth.setup.validation.nameRequired") : undefined,
              }}
            >
              {(field) => (
                <UiField data-invalid={field.state.meta.errors.length > 0}>
                  <FieldLabel htmlFor={field.name}>{t("auth.setup.nameLabel")}</FieldLabel>
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
                    return t("auth.setup.validation.emailRequired");
                  }

                  return email.includes("@") ? undefined : t("auth.setup.validation.emailInvalid");
                },
              }}
            >
              {(field) => (
                <UiField data-invalid={field.state.meta.errors.length > 0}>
                  <FieldLabel htmlFor={field.name}>{t("auth.setup.emailLabel")}</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    autoComplete="email"
                    placeholder={t("auth.setup.emailPlaceholder")}
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
                  value.length < 8 ? t("auth.setup.validation.passwordMin") : undefined,
              }}
            >
              {(field) => (
                <UiField data-invalid={field.state.meta.errors.length > 0}>
                  <FieldLabel htmlFor={field.name}>{t("auth.setup.passwordLabel")}</FieldLabel>
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
                    {isSubmitting ? t("auth.setup.submitting") : t("auth.setup.submit")}
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

import { createClientOnlyFn } from "@tanstack/react-start";
import * as React from "react";

import { Card, CardContent, CardHeader } from "#/components/ui/card.tsx";
import { Skeleton } from "#/components/ui/skeleton.tsx";
import { cn } from "#/lib/utils.ts";

export interface LoginFormProps {
  redirectTo: string;
}

const LoginFormClient = React.lazy(
  createClientOnlyFn(async () => {
    const module = await import("#/routes/-login-form-impl.tsx");

    return { default: module.LoginFormClient };
  }),
);

function LoginFormRoot(props: LoginFormProps) {
  return <LoginFormClient {...props} />;
}

function LoginFormSkeleton() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <FormFieldSkeleton labelClassName="w-14" />
          <FormFieldSkeleton labelClassName="w-20" />
          <Skeleton className="h-8 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

function FormFieldSkeleton({ labelClassName }: { labelClassName: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className={cn("h-3", labelClassName)} />
      <Skeleton className="h-8 w-full" />
    </div>
  );
}

export const LoginForm = Object.assign(LoginFormRoot, {
  Skeleton: LoginFormSkeleton,
});

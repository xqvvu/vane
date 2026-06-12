import { createClientOnlyFn } from "@tanstack/react-start";
import * as React from "react";

import { Card, CardContent, CardHeader } from "#/components/ui/card.tsx";
import { Skeleton } from "#/components/ui/skeleton.tsx";
import { cn } from "#/lib/utils.ts";

export interface SetupFormProps {
  redirectTo: string;
}

const SetupFormClient = React.lazy(
  createClientOnlyFn(async () => {
    const module = await import("#/routes/-setup-form-impl.tsx");

    return { default: module.SetupFormClient };
  }),
);

function SetupFormRoot(props: SetupFormProps) {
  return <SetupFormClient {...props} />;
}

function SetupFormSkeleton() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <FormFieldSkeleton labelClassName="w-12" />
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

export const SetupForm = Object.assign(SetupFormRoot, {
  Skeleton: SetupFormSkeleton,
});

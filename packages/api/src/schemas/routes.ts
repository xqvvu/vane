import * as z from "zod";

import { RouteDefinitionSchema } from "@vane/core";

import { IdOutputSchema } from "./shared";

export const RouteListOutputSchema = z.array(RouteDefinitionSchema);

export const RouteOutputSchema = RouteDefinitionSchema;

export const RouteDeleteOutputSchema = IdOutputSchema;


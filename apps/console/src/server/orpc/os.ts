import { implement } from "@orpc/server";

import { contract } from "@vane/api";

import { requestId } from "#/server/orpc/middlewares/request-id";

export const os = implement(contract).use(requestId());

import type { RouterContractClient } from "@orpc/contract";

import type { contract } from "./contract";

export type RPCClient = RouterContractClient<typeof contract>;

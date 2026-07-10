import serverEntry from "@tanstack/react-start/server-entry";
import { FastResponse } from "srvx";

import { noop } from "#/lib/utils";
import { logger } from "#/server/runtime/logging.ts";

async function bootstrap() {
  globalThis.Response = FastResponse;

  await Promise.all([noop(), logger()]);
}

await bootstrap();

export default serverEntry;

import serverEntry from "@tanstack/react-start/server-entry";
import { FastResponse } from "srvx";

import { getApplicationContainer } from "#/server/runtime/container.ts";
import { logger } from "#/server/runtime/logging.ts";
import {
  loadSystemInformation,
  logSystemInformation,
} from "#/server/runtime/system-information.ts";

async function bootstrap() {
  globalThis.Response = FastResponse;

  await logger();
  const store = await getApplicationContainer().getSqliteStore();
  const sqliteVersion = await store.sqliteVersion();
  logSystemInformation(loadSystemInformation(sqliteVersion));
}

await bootstrap();

export default serverEntry;

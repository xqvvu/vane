export type HealthCheckStatus = "ok" | "error" | "skipped";

export interface HealthResponse {
  status: "ok";
}

export interface ReadyResponse {
  status: "ok" | "error";
  checks: {
    sqlite: HealthCheckStatus;
    migrations: HealthCheckStatus;
    worker: HealthCheckStatus;
  };
}

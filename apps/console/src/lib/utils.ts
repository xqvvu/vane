import { round } from "es-toolkit/math";

export { cn } from "cn";

export async function noop(): Promise<void> {}

export function elapsedMs(startedAt: number): number {
  return round(performance.now() - startedAt, 2);
}

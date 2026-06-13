import { createClientOnlyFn, createIsomorphicFn } from "@tanstack/react-start";

export const urlFromCurrentOrigin = createIsomorphicFn()
  .server((path: string) => path)
  .client((path: string) => new URL(path, window.location.origin).toString());

export const copyText = createClientOnlyFn(async (value: string) => {
  if (!navigator.clipboard) {
    return false;
  }

  await navigator.clipboard.writeText(value);
  return true;
});

export const hardReloadPage = createClientOnlyFn(() => {
  window.location.reload();
});

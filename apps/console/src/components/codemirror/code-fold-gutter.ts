import "@tanstack/react-start/client-only";
import { foldGutter } from "@codemirror/language";

function createFoldMarker(open: boolean): HTMLElement {
  const marker = document.createElement("span");

  marker.className = "cm-code-fold-marker";
  marker.setAttribute("aria-hidden", "true");
  marker.dataset.state = open ? "open" : "closed";
  marker.innerHTML = open
    ? '<svg viewBox="0 0 12 12" focusable="false"><path d="M3 4.5 6 7.5 9 4.5" /></svg>'
    : '<svg viewBox="0 0 12 12" focusable="false"><path d="M4.5 3 7.5 6 4.5 9" /></svg>';

  return marker;
}

export function codeFoldGutter() {
  return foldGutter({
    markerDOM: createFoldMarker,
  });
}

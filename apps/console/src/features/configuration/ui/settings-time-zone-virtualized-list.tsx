import { useVirtualizer } from "@tanstack/react-virtual";
import * as React from "react";

import { ComboboxItem, ComboboxList, useComboboxFilteredItems } from "#/components/ui/combobox.tsx";

export type SettingsTimeZoneVirtualizer = ReturnType<
  typeof useVirtualizer<HTMLDivElement, Element>
>;

export function SettingsTimeZoneVirtualizedList({
  open,
  virtualizerRef,
}: {
  open: boolean;
  virtualizerRef: React.RefObject<SettingsTimeZoneVirtualizer | null>;
}) {
  const filteredTimeZones = useComboboxFilteredItems<string>();
  const scrollElementRef = React.useRef<HTMLDivElement | null>(null);
  const virtualizer = useVirtualizer({
    enabled: open,
    count: filteredTimeZones.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => 32,
    initialRect: { width: 0, height: 288 },
    overscan: 10,
    paddingStart: 4,
    paddingEnd: 4,
    scrollPaddingStart: 4,
    scrollPaddingEnd: 4,
  });

  React.useImperativeHandle(virtualizerRef, () => virtualizer);

  const handleScrollElementRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      scrollElementRef.current = element;
      if (element) {
        virtualizer.measure();
      }
    },
    [virtualizer],
  );
  const totalSize = virtualizer.getTotalSize();

  if (!filteredTimeZones.length) {
    return null;
  }

  return (
    <ComboboxList className="max-h-none overflow-visible p-0">
      <div
        ref={handleScrollElementRef}
        role="presentation"
        data-slot="time-zone-virtualized-list"
        className="h-[min(18rem,var(--time-zone-list-height))] max-h-(--available-height) scroll-py-1 overflow-auto overscroll-contain"
        style={{ "--time-zone-list-height": `${totalSize}px` } as React.CSSProperties}
      >
        <div role="presentation" className="relative w-full" style={{ height: totalSize }}>
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const timeZone = filteredTimeZones[virtualItem.index];

            if (!timeZone) {
              return null;
            }

            return (
              <ComboboxItem
                key={timeZone}
                ref={virtualizer.measureElement}
                index={virtualItem.index}
                data-index={virtualItem.index}
                value={timeZone}
                aria-setsize={filteredTimeZones.length}
                aria-posinset={virtualItem.index + 1}
                className="absolute top-0 left-0 h-8 py-0"
                style={{
                  width: "100%",
                  height: virtualItem.size,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                {timeZone}
              </ComboboxItem>
            );
          })}
        </div>
      </div>
    </ComboboxList>
  );
}

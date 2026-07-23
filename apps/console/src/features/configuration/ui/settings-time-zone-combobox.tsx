import * as React from "react";

import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput } from "#/components/ui/combobox";
import {
  SettingsTimeZoneVirtualizedList,
  type SettingsTimeZoneVirtualizer,
} from "#/features/configuration/ui/settings-time-zone-virtualized-list";
import { supportedTimeZones } from "#/i18n/time-zone";
import { useTranslations } from "#/i18n/use-i18n";

const timeZones = supportedTimeZones();
const searchableTimeZones = timeZones.map((value) => ({
  value,
  searchValue: value.toLowerCase(),
}));

export function SettingsTimeZoneCombobox({
  id,
  invalid,
  value,
  onBlur,
  onChange,
}: {
  id: string;
  invalid: boolean;
  value: string;
  onBlur: () => void;
  onChange: (value: string) => void;
}) {
  const t = useTranslations();
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);
  const virtualizerRef = React.useRef<SettingsTimeZoneVirtualizer | null>(null);
  const deferredInputValue = React.useDeferredValue(inputValue);
  const filteredTimeZones = React.useMemo(
    () => filterTimeZones(deferredInputValue),
    [deferredInputValue],
  );

  return (
    <Combobox
      items={timeZones}
      filteredItems={filteredTimeZones}
      inputValue={inputValue}
      open={open}
      virtualized
      value={value}
      onInputValueChange={setInputValue}
      onOpenChange={setOpen}
      onItemHighlighted={(item, { reason, index }) => {
        const virtualizer = virtualizerRef.current;

        if (!item || !virtualizer) {
          return;
        }

        const isStart = index === 0;
        const isEnd = index === virtualizer.options.count - 1;
        const shouldScroll = reason === "none" || (reason === "keyboard" && (isStart || isEnd));

        if (shouldScroll) {
          queueMicrotask(() => {
            virtualizer.scrollToIndex(index, { align: isEnd ? "start" : "end" });
          });
        }
      }}
      onValueChange={(nextValue) => {
        if (nextValue) {
          setInputValue(nextValue);
          onChange(nextValue);
        }
      }}
    >
      <ComboboxInput
        id={id}
        name={id}
        className="w-full"
        placeholder={t("configuration.appSettings.timeZonePlaceholder")}
        aria-invalid={invalid}
        onBlur={onBlur}
      />
      <ComboboxContent>
        <ComboboxEmpty>{t("configuration.appSettings.timeZoneEmpty")}</ComboboxEmpty>
        <SettingsTimeZoneVirtualizedList open={open} virtualizerRef={virtualizerRef} />
      </ComboboxContent>
    </Combobox>
  );
}

function filterTimeZones(query: string): string[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return timeZones;
  }

  return searchableTimeZones
    .filter((timeZone) => timeZone.searchValue.includes(normalizedQuery))
    .map((timeZone) => timeZone.value);
}

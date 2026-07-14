import * as React from "react";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "#/components/ui/combobox.tsx";
import { supportedTimeZones } from "#/i18n/time-zone.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";

const timeZones = supportedTimeZones();
const searchableTimeZones = timeZones.map((value) => ({
  value,
  searchValue: value.toLowerCase(),
}));
const resultLimit = 60;

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
  const [inputValue, setInputValue] = React.useState(value);
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
      limit={resultLimit}
      value={value}
      onInputValueChange={setInputValue}
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
        <ComboboxList>
          {(timeZone) => (
            <ComboboxItem key={timeZone} value={timeZone}>
              {timeZone}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

function filterTimeZones(query: string): string[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return timeZones.slice(0, resultLimit);
  }

  return searchableTimeZones
    .filter((timeZone) => timeZone.searchValue.includes(normalizedQuery))
    .map((timeZone) => timeZone.value)
    .slice(0, resultLimit);
}

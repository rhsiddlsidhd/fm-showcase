import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { IMPERIAL, isImperial, METRIC, type Units } from "../model/units";
import { GHOST_BUTTON_CLASS } from "./buttonStyle";
import {
  MENU_ITEM_CLASS,
  MENU_LABEL_CLASS,
  MENU_PANEL_CLASS,
} from "./menuStyle";

const CHECKABLE_ITEM_CLASS = `${MENU_ITEM_CLASS} data-checked:bg-accent`;

const UnitGroup = <K extends keyof Units>({
  label,
  unit,
  units,
  onChange,
  options,
}: {
  label: string;
  unit: K;
  units: Units;
  onChange: (units: Units) => void;
  options: [value: Units[K], text: string][];
}) => (
  <DropdownMenuGroup>
    <DropdownMenuLabel className={MENU_LABEL_CLASS}>{label}</DropdownMenuLabel>
    <DropdownMenuRadioGroup
      value={units[unit]}
      onValueChange={(value) => onChange({ ...units, [unit]: value })}
    >
      {options.map(([optionValue, text]) => (
        <DropdownMenuRadioItem
          key={optionValue}
          value={optionValue}
          className={CHECKABLE_ITEM_CLASS}
          closeOnClick
        >
          {text}
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  </DropdownMenuGroup>
);

export const UnitsMenu = ({
  units,
  onChange,
}: {
  units: Units;
  onChange: (units: Units) => void;
}) => {
  const imperial = isImperial(units);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            className={`${GHOST_BUTTON_CLASS} bg-card flex gap-2.5 rounded-lg px-4 py-3`}
          />
        }
      >
        <img src="/weather-app/images/icon-units.svg" alt="" />
        Units
        <img src="/weather-app/images/icon-dropdown.svg" alt="" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={MENU_PANEL_CLASS}>
        <DropdownMenuItem
          className={CHECKABLE_ITEM_CLASS}
          onClick={() => onChange(imperial ? METRIC : IMPERIAL)}
        >
          {imperial ? "Switch to Metric" : "Switch to Imperial"}
        </DropdownMenuItem>
        <UnitGroup
          label="Temperature"
          unit="temperature"
          units={units}
          onChange={onChange}
          options={[
            ["celsius", "Celsius (°C)"],
            ["fahrenheit", "Fahrenheit (°F)"],
          ]}
        />
        <DropdownMenuSeparator />
        <UnitGroup
          label="Wind Speed"
          unit="wind"
          units={units}
          onChange={onChange}
          options={[
            ["kmh", "km/h"],
            ["mph", "mph"],
          ]}
        />
        <DropdownMenuSeparator />
        <UnitGroup
          label="Precipitation"
          unit="precipitation"
          units={units}
          onChange={onChange}
          options={[
            ["mm", "Millimeters (mm)"],
            ["in", "Inches (in)"],
          ]}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

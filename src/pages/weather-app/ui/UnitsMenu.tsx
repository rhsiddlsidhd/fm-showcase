import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { IMPERIAL, isImperial, METRIC, type Units } from "../model/units";
import { ICON_DROPDOWN, ICON_UNITS } from "./assets";
import { GhostButton } from "./BareButton";
import { MenuItem, MenuLabel, MenuPanel, MenuRadioItem } from "./Menu";

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
    <MenuLabel>{label}</MenuLabel>
    <DropdownMenuRadioGroup
      value={units[unit]}
      onValueChange={(value) => onChange({ ...units, [unit]: value })}
    >
      {options.map(([optionValue, text]) => (
        <MenuRadioItem key={optionValue} value={optionValue} closeOnClick>
          {text}
        </MenuRadioItem>
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
          <GhostButton className="bg-card flex gap-2.5 rounded-lg px-4 py-3" />
        }
      >
        <img src={ICON_UNITS} alt="" />
        Units
        <img src={ICON_DROPDOWN} alt="" />
      </DropdownMenuTrigger>
      <MenuPanel align="end">
        <MenuItem onClick={() => onChange(imperial ? METRIC : IMPERIAL)}>
          {imperial ? "Switch to Metric" : "Switch to Imperial"}
        </MenuItem>
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
      </MenuPanel>
    </DropdownMenu>
  );
};

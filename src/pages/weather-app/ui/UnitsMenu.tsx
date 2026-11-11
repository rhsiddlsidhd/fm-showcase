import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { IMPERIAL, isImperial, METRIC, type Units } from "../model/units";

const ITEM_RING = "focus:ring-2 focus:ring-ring";

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
      <DropdownMenuTrigger>
        <img src="/weather-app/images/icon-units.svg" alt="" />
        Units
        <img src="/weather-app/images/icon-dropdown.svg" alt="" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          className={ITEM_RING}
          onClick={() => onChange(imperial ? METRIC : IMPERIAL)}
        >
          {imperial ? "Switch to Metric" : "Switch to Imperial"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={units.temperature}
          onValueChange={(value) =>
            onChange({ ...units, temperature: value as Units["temperature"] })
          }
        >
          <DropdownMenuRadioItem value="celsius" className={ITEM_RING}>
            Celsius (°C)
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="fahrenheit" className={ITEM_RING}>
            Fahrenheit (°F)
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={units.wind}
          onValueChange={(value) =>
            onChange({ ...units, wind: value as Units["wind"] })
          }
        >
          <DropdownMenuRadioItem value="kmh" className={ITEM_RING}>
            km/h
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="mph" className={ITEM_RING}>
            mph
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={units.precipitation}
          onValueChange={(value) =>
            onChange({
              ...units,
              precipitation: value as Units["precipitation"],
            })
          }
        >
          <DropdownMenuRadioItem value="mm" className={ITEM_RING}>
            Millimeters (mm)
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="in" className={ITEM_RING}>
            Inches (in)
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

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

const ITEM_RING = "focus:ring-2 focus:ring-ring";
const ITEM_CLASS = `${ITEM_RING} px-2 py-2.5 text-(length:--weather-app-text-body) data-checked:bg-accent`;
const LABEL_CLASS = "px-2 pt-1.5 text-sm text-muted-foreground";

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
      <DropdownMenuTrigger className="bg-card hover:bg-accent focus-visible:ring-ring flex items-center gap-2.5 rounded-lg px-4 py-3 focus-visible:ring-2">
        <img src="/weather-app/images/icon-units.svg" alt="" />
        Units
        <img src="/weather-app/images/icon-dropdown.svg" alt="" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="theme-weather-app bg-popover w-56 p-2"
      >
        <DropdownMenuItem
          className={ITEM_CLASS}
          onClick={() => onChange(imperial ? METRIC : IMPERIAL)}
        >
          {imperial ? "Switch to Metric" : "Switch to Imperial"}
        </DropdownMenuItem>
        <DropdownMenuGroup>
          <DropdownMenuLabel className={LABEL_CLASS}>
            Temperature
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={units.temperature}
            onValueChange={(value) =>
              onChange({ ...units, temperature: value as Units["temperature"] })
            }
          >
            <DropdownMenuRadioItem
              value="celsius"
              className={ITEM_CLASS}
              closeOnClick
            >
              Celsius (°C)
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem
              value="fahrenheit"
              className={ITEM_CLASS}
              closeOnClick
            >
              Fahrenheit (°F)
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className={LABEL_CLASS}>
            Wind Speed
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={units.wind}
            onValueChange={(value) =>
              onChange({ ...units, wind: value as Units["wind"] })
            }
          >
            <DropdownMenuRadioItem
              value="kmh"
              className={ITEM_CLASS}
              closeOnClick
            >
              km/h
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem
              value="mph"
              className={ITEM_CLASS}
              closeOnClick
            >
              mph
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className={LABEL_CLASS}>
            Precipitation
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={units.precipitation}
            onValueChange={(value) =>
              onChange({
                ...units,
                precipitation: value as Units["precipitation"],
              })
            }
          >
            <DropdownMenuRadioItem
              value="mm"
              className={ITEM_CLASS}
              closeOnClick
            >
              Millimeters (mm)
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem
              value="in"
              className={ITEM_CLASS}
              closeOnClick
            >
              Inches (in)
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

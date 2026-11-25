import type { ComponentProps } from "react";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioItem,
} from "@/shared/ui/dropdown-menu";

// body로 렌더링되어 테마 범위 밖이라 범위 클래스와 글자 기본값을 다시 넘긴다(docs/ui/theme.md#portal).
export const MenuPanel = ({
  className = "",
  ...props
}: ComponentProps<typeof DropdownMenuContent>) => (
  <DropdownMenuContent
    className={`theme-weather-app dark w-56 bg-popover p-2 font-sans text-base ${className}`}
    {...props}
  />
);

export const MenuItem = ({
  className = "",
  ...props
}: ComponentProps<typeof DropdownMenuItem>) => (
  <DropdownMenuItem
    className={`px-2 py-2.5 text-base focus:ring-2 focus:ring-ring ${className}`}
    {...props}
  />
);

export const MenuRadioItem = ({
  className = "",
  ...props
}: ComponentProps<typeof DropdownMenuRadioItem>) => (
  <DropdownMenuRadioItem
    className={`px-2 py-2.5 text-base focus:ring-2 focus:ring-ring data-checked:bg-accent ${className}`}
    {...props}
  />
);

export const MenuLabel = ({
  className = "",
  ...props
}: ComponentProps<typeof DropdownMenuLabel>) => (
  <DropdownMenuLabel
    className={`px-2 pt-1.5 text-sm text-muted-foreground ${className}`}
    {...props}
  />
);

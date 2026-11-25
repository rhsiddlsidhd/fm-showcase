import type { ComponentProps } from "react";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioItem,
} from "@/shared/ui/dropdown-menu";

// Base UI의 className은 상태 함수도 받지만, 여기서는 템플릿 문자열에 끼우므로 문자열만 받는다.

// body로 렌더링되어 테마 범위 밖이라 범위 클래스와 글자 기본값을 다시 넘긴다(docs/ui/theme.md#portal).
export const MenuPanel = ({
  className = "",
  ...props
}: Omit<ComponentProps<typeof DropdownMenuContent>, "className"> & {
  className?: string;
}) => (
  <DropdownMenuContent
    className={`theme-weather-app dark w-56 bg-popover p-2 font-sans text-base ${className}`}
    {...props}
  />
);

export const MenuItem = ({
  className = "",
  ...props
}: Omit<ComponentProps<typeof DropdownMenuItem>, "className"> & {
  className?: string;
}) => (
  <DropdownMenuItem
    className={`px-2 py-2.5 text-base focus:ring-2 focus:ring-ring ${className}`}
    {...props}
  />
);

export const MenuRadioItem = ({
  className = "",
  ...props
}: Omit<ComponentProps<typeof DropdownMenuRadioItem>, "className"> & {
  className?: string;
}) => (
  <DropdownMenuRadioItem
    className={`px-2 py-2.5 text-base focus:ring-2 focus:ring-ring data-checked:bg-accent ${className}`}
    {...props}
  />
);

export const MenuLabel = ({
  className = "",
  ...props
}: Omit<ComponentProps<typeof DropdownMenuLabel>, "className"> & {
  className?: string;
}) => (
  <DropdownMenuLabel
    className={`px-2 pt-1.5 text-sm text-muted-foreground ${className}`}
    {...props}
  />
);

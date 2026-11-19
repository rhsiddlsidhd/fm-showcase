import type { ComponentProps } from "react";

export const Cell = ({ className = "", ...props }: ComponentProps<"li">) => (
  <li
    className={`border-border bg-card rounded-xl border ${className}`}
    {...props}
  />
);

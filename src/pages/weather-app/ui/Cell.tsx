import type { ComponentProps } from "react";

export const Cell = ({ className = "", ...props }: ComponentProps<"li">) => (
  <li
    className={`rounded-xl border border-border bg-card ${className}`}
    {...props}
  />
);

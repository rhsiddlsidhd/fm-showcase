export const CELL_CLASS = "rounded-xl border border-border bg-card";
export const SUBTLE_TEXT_CLASS =
  "text-(length:--weather-app-text-body) text-(--weather-app-text-subtle)";

export const PlaceholderItem = ({
  testId,
  className,
}: {
  testId: string;
  className: string;
}) => <li data-testid={testId} className={className} />;

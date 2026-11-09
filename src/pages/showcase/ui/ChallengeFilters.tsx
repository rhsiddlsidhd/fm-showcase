import { useId } from "react";

import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";

import { DIFFICULTIES } from "../model/challenge";
import type { FilterSelection, Stack } from "../model/challenge";

export type ToggleHandler = <G extends keyof FilterSelection>(
  group: G,
  value: FilterSelection[G][number],
  checked: boolean,
) => void;

export const RESET_BUTTON_CLASS =
  "h-auto min-h-(--showcase-control-min-height) self-start rounded-(--showcase-button-radius) border-(length:--showcase-border-width) border-border px-(--showcase-chip-inline-padding) py-(--showcase-chip-block-padding) text-(length:--showcase-label-size) leading-(--showcase-label-leading) font-(--showcase-label-weight) hover:bg-accent hover:text-accent-foreground focus-visible:border-border focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:ring-0 focus-visible:outline-(length:--showcase-focus-width) focus-visible:outline-offset-(--showcase-focus-offset) focus-visible:outline-ring";

interface ChallengeFiltersProps {
  stackOptions: readonly Stack[];
  selection: FilterSelection;
  onToggle: ToggleHandler;
  showReset: boolean;
  onReset: () => void;
}

interface FilterChipProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

const FilterChip = ({ label, checked, onCheckedChange }: FilterChipProps) => {
  const id = useId();
  return (
    <span
      data-checked={checked || undefined}
      className="border-border bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground has-focus-visible:bg-accent has-focus-visible:text-accent-foreground has-focus-visible:outline-ring data-checked:bg-primary data-checked:text-primary-foreground data-checked:hover:bg-primary data-checked:hover:text-primary-foreground data-checked:has-focus-visible:bg-primary data-checked:has-focus-visible:text-primary-foreground relative inline-flex min-h-(--showcase-control-min-height) items-center gap-(--showcase-check-gap) rounded-(--showcase-chip-radius) border-(length:--showcase-border-width) px-(--showcase-chip-inline-padding) py-(--showcase-chip-block-padding) text-(length:--showcase-label-size) leading-(--showcase-label-leading) font-(--showcase-label-weight) has-focus-visible:outline-(length:--showcase-focus-width) has-focus-visible:outline-offset-(--showcase-focus-offset)"
    >
      <Checkbox
        id={id}
        nativeButton
        render={<button type="button" />}
        className="border-input data-checked:border-primary-foreground data-checked:bg-primary data-checked:text-primary-foreground size-(--showcase-check-size) focus-visible:ring-0"
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
      <label htmlFor={id} className="after:absolute after:inset-0">
        {label}
      </label>
    </span>
  );
};

export const ChallengeFilters = ({
  stackOptions,
  selection,
  onToggle,
  showReset,
  onReset,
}: ChallengeFiltersProps) => (
  <div className="flex flex-col gap-(--showcase-filter-group-gap)">
    <fieldset className="flex flex-wrap gap-(--showcase-option-gap)">
      <legend className="w-full text-(length:--showcase-label-size) leading-(--showcase-label-leading) font-(--showcase-label-weight)">
        난이도
      </legend>
      {DIFFICULTIES.map((difficulty) => (
        <FilterChip
          key={difficulty}
          label={difficulty}
          checked={selection.difficulty.includes(difficulty)}
          onCheckedChange={(checked) =>
            onToggle("difficulty", difficulty, checked)
          }
        />
      ))}
    </fieldset>
    <fieldset className="flex flex-wrap gap-(--showcase-option-gap)">
      <legend className="w-full text-(length:--showcase-label-size) leading-(--showcase-label-leading) font-(--showcase-label-weight)">
        사용 기술
      </legend>
      {stackOptions.map((stack) => (
        <FilterChip
          key={stack}
          label={stack}
          checked={selection.stack.includes(stack)}
          onCheckedChange={(checked) => onToggle("stack", stack, checked)}
        />
      ))}
    </fieldset>
    {showReset && (
      <Button
        type="button"
        variant="secondary"
        onClick={onReset}
        className={RESET_BUTTON_CLASS}
      >
        필터 초기화
      </Button>
    )}
  </div>
);

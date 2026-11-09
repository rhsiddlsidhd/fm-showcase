import { useId } from "react";

import { Checkbox } from "@/shared/ui/checkbox";

import { DIFFICULTIES } from "../model/challenge";
import type { FilterSelection, Stack } from "../model/challenge";

export type ToggleHandler = <G extends keyof FilterSelection>(
  group: G,
  value: FilterSelection[G][number],
  checked: boolean,
) => void;

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
    <span className="relative inline-flex items-center gap-2 rounded-full border px-3 py-1">
      <Checkbox
        id={id}
        nativeButton
        render={<button type="button" />}
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
  <div>
    <fieldset>
      <legend>난이도</legend>
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
    <fieldset>
      <legend>사용 기술</legend>
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
      <button type="button" onClick={onReset}>
        필터 초기화
      </button>
    )}
  </div>
);

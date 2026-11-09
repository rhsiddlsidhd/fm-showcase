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
        <label key={difficulty}>
          <input
            type="checkbox"
            value={difficulty}
            checked={selection.difficulty.includes(difficulty)}
            onChange={(event) =>
              onToggle("difficulty", difficulty, event.target.checked)
            }
          />
          {difficulty}
        </label>
      ))}
    </fieldset>
    <fieldset>
      <legend>사용 기술</legend>
      {stackOptions.map((stack) => (
        <label key={stack}>
          <input
            type="checkbox"
            value={stack}
            checked={selection.stack.includes(stack)}
            onChange={(event) => onToggle("stack", stack, event.target.checked)}
          />
          {stack}
        </label>
      ))}
    </fieldset>
    {showReset && (
      <button type="button" onClick={onReset}>
        필터 초기화
      </button>
    )}
  </div>
);

import { DIFFICULTIES } from "../model/challenge";
import type { FilterSelection, Stack } from "../model/challenge";

interface FilterPanelProps {
  stackOptions: readonly Stack[];
  selection: FilterSelection;
  onChange: (selection: FilterSelection) => void;
}

const toggle = <T extends string>(
  values: readonly T[],
  value: T,
  checked: boolean,
): T[] =>
  checked ? [...values, value] : values.filter((item) => item !== value);

export const FilterPanel = ({
  stackOptions,
  selection,
  onChange,
}: FilterPanelProps) => (
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
              onChange({
                ...selection,
                difficulty: toggle(
                  selection.difficulty,
                  difficulty,
                  event.target.checked,
                ),
              })
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
            onChange={(event) =>
              onChange({
                ...selection,
                stack: toggle(selection.stack, stack, event.target.checked),
              })
            }
          />
          {stack}
        </label>
      ))}
    </fieldset>
  </div>
);

import { DIFFICULTIES } from "../model/challenge";
import type { Stack } from "../model/challenge";

interface FilterPanelProps {
  stackOptions: readonly Stack[];
}

export const FilterPanel = ({ stackOptions }: FilterPanelProps) => (
  <div>
    <fieldset>
      <legend>난이도</legend>
      {DIFFICULTIES.map((difficulty) => (
        <label key={difficulty}>
          <input type="checkbox" value={difficulty} />
          {difficulty}
        </label>
      ))}
    </fieldset>
    <fieldset>
      <legend>사용 기술</legend>
      {stackOptions.map((stack) => (
        <label key={stack}>
          <input type="checkbox" value={stack} />
          {stack}
        </label>
      ))}
    </fieldset>
  </div>
);

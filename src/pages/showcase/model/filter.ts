import type { Challenge, FilterSelection } from "./challenge";

export function filterChallenges(
  challenges: Challenge[],
  selection: FilterSelection,
): Challenge[] {
  return challenges.filter(
    (challenge) =>
      (selection.difficulty.length === 0 ||
        selection.difficulty.includes(challenge.difficulty)) &&
      (selection.stack.length === 0 ||
        challenge.stack.some((s) => selection.stack.includes(s))),
  );
}

import type { Challenge, FilterSelection } from "./challenge";

export function filterChallenges(
  challenges: Challenge[],
  selection: FilterSelection,
): Challenge[] {
  return challenges.filter((challenge) => {
    const matchesDifficulty =
      selection.difficulty.length === 0 ||
      selection.difficulty.includes(challenge.difficulty);
    const matchesStack =
      selection.stack.length === 0 ||
      challenge.stack.some((stack) => selection.stack.includes(stack));
    return matchesDifficulty && matchesStack;
  });
}

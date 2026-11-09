import { STACKS } from "./challenge";
import type { Challenge, Stack } from "./challenge";

export function getStackOptions(challenges: readonly Challenge[]): Stack[] {
  const used = new Set(challenges.flatMap((challenge) => challenge.stack));
  return STACKS.filter((stack) => used.has(stack));
}

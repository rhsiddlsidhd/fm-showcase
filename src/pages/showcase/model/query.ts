import {
  DIFFICULTIES,
  STACKS,
  type Difficulty,
  type FilterSelection,
  type Stack,
} from "./challenge";

function readAllowed<T extends string>(
  params: URLSearchParams,
  key: string,
  allowed: readonly T[],
): T[] {
  const values = params
    .getAll(key)
    .filter((value): value is T =>
      (allowed as readonly string[]).includes(value),
    );
  return [...new Set(values)];
}

export function parseSelection(params: URLSearchParams): FilterSelection {
  return {
    difficulty: readAllowed<Difficulty>(params, "difficulty", DIFFICULTIES),
    stack: readAllowed<Stack>(params, "stack", STACKS),
  };
}

export function toSearchParams(selection: FilterSelection): URLSearchParams {
  const params = new URLSearchParams();
  for (const difficulty of new Set(selection.difficulty)) {
    params.append("difficulty", difficulty);
  }
  for (const stack of new Set(selection.stack)) {
    params.append("stack", stack);
  }
  return params;
}

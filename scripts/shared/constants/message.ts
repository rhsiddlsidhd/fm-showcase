import { PREFIX_PATTERN } from "./git.ts";

// Discord가 한 메시지에 허용하는 길이다.
export const MAX_LENGTH = 2000;
export const TITLE_PREFIX = new RegExp(
  `^(?:${PREFIX_PATTERN})(?:\\([^)]*\\))?!?:\\s*`,
);

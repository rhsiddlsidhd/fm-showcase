export const DIFFICULTIES = [
  "Newbie",
  "Junior",
  "Intermediate",
  "Advanced",
  "Guru",
] as const;

export const STACKS = [
  "HTML",
  "CSS",
  "JavaScript",
  "TypeScript",
  "React",
  "Tailwind CSS",
] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];
export type Stack = (typeof STACKS)[number];

export interface Challenge {
  slug: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  stack: Stack[];
}

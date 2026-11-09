// E2E 전용 가상 등록 목록(검증 문서의 A~D). 앱 코드를 import하지 않는다.
// vite.config.ts가 mode e2e 빌드에서만 운영 등록 목록 대신 이 파일을 쓴다.
export const challenges = [
  {
    slug: "e2e-showcase-a",
    title: "가상 챌린지 가",
    description: "가 챌린지의 설명입니다.",
    difficulty: "Newbie",
    stack: ["HTML", "CSS"],
  },
  {
    slug: "e2e-showcase-b",
    title: "가상 챌린지 나",
    description: "나 챌린지의 설명입니다.",
    difficulty: "Junior",
    stack: ["HTML", "CSS", "JavaScript"],
  },
  {
    slug: "e2e-showcase-c",
    title: "가상 챌린지 다",
    description: "다 챌린지의 설명입니다.",
    difficulty: "Intermediate",
    stack: ["TypeScript", "React", "Tailwind CSS"],
  },
  {
    slug: "e2e-showcase-d",
    title: "가상 챌린지 라",
    description: "라 챌린지의 설명입니다.",
    difficulty: "Newbie",
    stack: ["CSS", "JavaScript"],
  },
] as const;

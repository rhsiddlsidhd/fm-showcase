import type { Challenge } from "./model/challenge";
import { ShowcaseController } from "./ui/ShowcaseController";

const challenges: readonly Challenge[] = [];

export const ShowcasePage = () => (
  <main className="p-8">
    <h1 className="text-2xl font-bold">Frontend Mentor 챌린지</h1>
    <ShowcaseController challenges={challenges} />
  </main>
);

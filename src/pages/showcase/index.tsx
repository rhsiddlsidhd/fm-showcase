import { CHALLENGES } from "./model/challenge";
import { ShowcaseController } from "./ui/ShowcaseController";

export const ShowcasePage = () => (
  <main className="p-8">
    <h1 className="text-2xl font-bold">Frontend Mentor 챌린지</h1>
    <ShowcaseController challenges={CHALLENGES} />
  </main>
);

import "@fontsource-variable/noto-sans-kr";
import "./ui/theme.css";
import { challenges } from "./model/challenges";
import { ChallengeRail } from "./ui/ChallengeRail";

export const ShowcasePage = () => (
  <main className="theme-showcase dark flex min-h-dvh items-center bg-background bg-(image:--page-background-image) bg-fixed font-sans text-base text-foreground">
    <div className="mx-auto flex w-full max-w-304 flex-col gap-8 px-[clamp(1rem,4vw,3rem)] py-[clamp(2rem,6vw,4rem)]">
      <ChallengeRail challenges={challenges} />
    </div>
  </main>
);

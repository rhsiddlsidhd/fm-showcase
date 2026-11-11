import "@fontsource-variable/noto-sans-kr";
import "./ui/theme.css";
import { challenges } from "./model/challenges";
import { ChallengeRail } from "./ui/ChallengeRail";

export const ShowcasePage = () => (
  <main className="theme-showcase bg-background text-foreground flex min-h-dvh items-center bg-[image:var(--showcase-background-image)] bg-fixed">
    <div className="mx-auto flex w-full max-w-[var(--showcase-content-max-width)] flex-col gap-[var(--showcase-section-gap)] px-[var(--showcase-page-inline-padding)] py-[var(--showcase-page-block-padding)]">
      <ChallengeRail challenges={challenges} />
    </div>
  </main>
);

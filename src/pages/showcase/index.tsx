import "@fontsource-variable/noto-sans-kr";
import "./ui/theme.css";
import { challenges } from "./model/challenges";
import { ShowcaseController } from "./ui/ShowcaseController";

export const ShowcasePage = () => (
  <main className="theme-showcase bg-background text-foreground min-h-screen bg-[image:var(--showcase-background-image)] bg-fixed">
    <div className="mx-auto flex w-full max-w-[var(--showcase-content-max-width)] flex-col gap-[var(--showcase-section-gap)] px-[var(--showcase-page-inline-padding)] py-[var(--showcase-page-block-padding)]">
      <h1 className="font-heading text-[length:var(--showcase-heading-size)] leading-[var(--showcase-heading-leading)] font-[var(--showcase-heading-weight)] tracking-[var(--showcase-heading-tracking)]">
        Frontend Mentor 챌린지
      </h1>
      <ShowcaseController challenges={challenges} />
    </div>
  </main>
);

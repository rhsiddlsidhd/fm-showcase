import { useEffect, useRef } from "react";
import { Button } from "@/shared/ui/button";

export const ErrorScreen = ({ onRetry }: { onRetry: () => void }) => {
  const retryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    retryRef.current?.focus();
  }, []);

  return (
    <section className="flex flex-col items-center gap-6 pt-10 text-center">
      <img
        src="/weather-app/images/icon-error.svg"
        alt=""
        className="size-12"
      />
      <div role="alert" className="flex flex-col items-center gap-6">
        <h2 className="font-heading text-5xl font-bold">
          Something went wrong
        </h2>
        <p className="max-w-xl text-(length:--weather-app-text-body) text-(--weather-app-text-subtle)">
          We couldn&apos;t connect to the server (API error). Please try again
          in a few moments.
        </p>
      </div>
      <Button
        ref={retryRef}
        type="button"
        onClick={onRetry}
        className="bg-card hover:bg-accent focus-visible:ring-ring flex h-auto justify-start gap-2.5 rounded-lg border-0 bg-clip-border px-4 py-3 text-[length:inherit] leading-[inherit] font-normal whitespace-normal text-inherit select-text focus-visible:ring-2 focus-visible:[outline-style:auto] active:not-aria-[haspopup]:translate-y-0"
      >
        <img src="/weather-app/images/icon-retry.svg" alt="" />
        Retry
      </Button>
    </section>
  );
};

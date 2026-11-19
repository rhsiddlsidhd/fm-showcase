import { useEffect, useRef } from "react";
import { ICON_ERROR, ICON_RETRY } from "./assets";
import { GhostButton } from "./BareButton";

export const ErrorScreen = ({ onRetry }: { onRetry: () => void }) => {
  const retryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    retryRef.current?.focus();
  }, []);

  return (
    <section className="flex flex-col items-center gap-6 pt-10 text-center">
      <img src={ICON_ERROR} alt="" className="size-12" />
      <div role="alert" className="flex flex-col items-center gap-6">
        <h2 className="font-heading text-5xl font-bold">
          Something went wrong
        </h2>
        <p className="max-w-xl text-base text-(--subtle-text)">
          We couldn&apos;t connect to the server (API error). Please try again
          in a few moments.
        </p>
      </div>
      <GhostButton
        ref={retryRef}
        type="button"
        onClick={onRetry}
        className="bg-card flex gap-2.5 rounded-lg px-4 py-3"
      >
        <img src={ICON_RETRY} alt="" />
        Retry
      </GhostButton>
    </section>
  );
};

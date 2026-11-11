export const ErrorScreen = ({ onRetry }: { onRetry: () => void }) => (
  <section className="flex flex-col items-center gap-6 pt-10 text-center">
    <img src="/weather-app/images/icon-error.svg" alt="" className="size-12" />
    <div role="alert" className="flex flex-col items-center gap-6">
      <h2 className="font-heading text-5xl font-bold">Something went wrong</h2>
      <p className="max-w-xl text-(length:--weather-app-text-body) text-(--weather-app-text-subtle)">
        We couldn&apos;t connect to the server (API error). Please try again in
        a few moments.
      </p>
    </div>
    <button
      type="button"
      onClick={onRetry}
      className="bg-card hover:bg-accent focus-visible:ring-ring flex items-center gap-2.5 rounded-lg px-4 py-3 focus-visible:ring-2"
    >
      <img src="/weather-app/images/icon-retry.svg" alt="" />
      Retry
    </button>
  </section>
);

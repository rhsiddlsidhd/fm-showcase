export const ErrorScreen = ({ onRetry }: { onRetry: () => void }) => (
  <section>
    <img src="/weather-app/images/icon-error.svg" alt="" />
    <div role="alert">
      <h2>Something went wrong</h2>
      <p>
        We couldn&apos;t connect to the server (API error). Please try again in
        a few moments.
      </p>
    </div>
    <button type="button" onClick={onRetry}>
      <img src="/weather-app/images/icon-retry.svg" alt="" />
      Retry
    </button>
  </section>
);

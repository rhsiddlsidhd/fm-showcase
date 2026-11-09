interface ResultSummaryProps {
  countText: string;
  announcement: string;
}

export const ResultSummary = ({
  countText,
  announcement,
}: ResultSummaryProps) => (
  <>
    <p>{countText}</p>
    <div role="status" className="sr-only">
      {announcement}
    </div>
  </>
);

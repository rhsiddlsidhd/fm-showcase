interface ResultSummaryProps {
  visibleCount: number;
  announcement: string;
}

export const ResultSummary = ({
  visibleCount,
  announcement,
}: ResultSummaryProps) => (
  <>
    <p>{visibleCount}개의 챌린지</p>
    <div role="status" className="sr-only">
      {announcement}
    </div>
  </>
);

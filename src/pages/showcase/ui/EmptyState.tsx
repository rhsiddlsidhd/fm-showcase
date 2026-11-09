type EmptyStateProps =
  { kind: "unregistered" } | { kind: "no-results"; onReset: () => void };

export const EmptyState = (props: EmptyStateProps) => {
  if (props.kind === "unregistered") {
    return <p>아직 등록된 챌린지가 없습니다.</p>;
  }
  return (
    <>
      <p>조건에 맞는 챌린지가 없습니다.</p>
      <button type="button" onClick={props.onReset}>
        필터 초기화
      </button>
    </>
  );
};

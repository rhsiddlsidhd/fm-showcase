import { Button } from "@/shared/ui/button";

import { RESET_BUTTON_CLASS } from "./ChallengeFilters";

type EmptyStateProps =
  { kind: "unregistered" } | { kind: "no-results"; onReset: () => void };

export const EmptyState = (props: EmptyStateProps) => {
  if (props.kind === "unregistered") {
    return (
      <p className="text-foreground text-(length:--showcase-body-size) leading-(--showcase-body-leading)">
        아직 등록된 챌린지가 없습니다.
      </p>
    );
  }
  return (
    <>
      <p className="text-foreground text-(length:--showcase-body-size) leading-(--showcase-body-leading)">
        조건에 맞는 챌린지가 없습니다.
      </p>
      <Button
        type="button"
        variant="secondary"
        onClick={props.onReset}
        className={RESET_BUTTON_CLASS}
      >
        필터 초기화
      </Button>
    </>
  );
};

import type { ComponentProps } from "react";
import { Button } from "@/shared/ui/button";

// shadcn Button의 크기·글자·눌림 기본값을 되돌려, 원본 디자인의 값을 className으로만 정한다.
// 리셋 클래스를 className 뒤에 둔다. 글자 크기 클래스가 leading 앞에 와야 병합 시 leading이 살아남는다.
export const BareButton = ({
  className = "",
  ...props
}: ComponentProps<typeof Button>) => (
  <Button
    className={`${className} focus-visible:ring-ring h-auto border-0 bg-clip-border leading-[inherit] font-normal whitespace-normal select-text focus-visible:ring-2 focus-visible:[outline-style:auto] active:not-aria-[haspopup]:translate-y-0`}
    {...props}
  />
);

export const GhostButton = ({
  className = "",
  ...props
}: ComponentProps<typeof Button>) => (
  <BareButton
    className={`hover:bg-accent justify-start text-[length:inherit] text-inherit ${className}`}
    {...props}
  />
);

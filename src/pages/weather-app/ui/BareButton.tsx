import type { ComponentProps } from "react";
import { Button } from "@/shared/ui/button";

// Base UI의 className은 상태 함수도 받지만, 여기서는 템플릿 문자열에 끼우므로 문자열만 받는다.
// shadcn Button의 크기·글자·눌림 기본값을 되돌려, 원본 디자인의 값을 className으로만 정한다.
// 리셋 클래스를 className 뒤에 둔다. 글자 크기 클래스가 leading 앞에 와야 병합 시 leading이 살아남는다.
export const BareButton = ({
  className = "",
  ...props
}: Omit<ComponentProps<typeof Button>, "className"> & {
  className?: string;
}) => (
  <Button
    className={`${className} h-auto border-0 bg-clip-border leading-[inherit] font-normal whitespace-normal select-text focus-visible:ring-2 focus-visible:ring-ring focus-visible:[outline-style:auto] active:not-aria-[haspopup]:translate-y-0`}
    {...props}
  />
);

export const GhostButton = ({
  className = "",
  ...props
}: Omit<ComponentProps<typeof Button>, "className"> & {
  className?: string;
}) => (
  <BareButton
    className={`justify-start text-[length:inherit] text-inherit hover:bg-accent ${className}`}
    {...props}
  />
);

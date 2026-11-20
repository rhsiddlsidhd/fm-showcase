import type { ComponentProps } from "react";
import { Button } from "@/shared/ui/button";

// shadcn Button의 모서리·테두리·전환·눌림 기본값을 되돌려, 원본 디자인의 값을 className으로만 정한다.
export const BareButton = ({
  className = "",
  ...props
}: Omit<ComponentProps<typeof Button>, "className"> & {
  // Base UI는 함수 className도 받지만, 문자열에 이어 붙이므로 문자열만 받는다.
  className?: string;
}) => (
  <Button
    className={`${className} cursor-pointer rounded-none border-0 transition-none active:not-aria-[haspopup]:translate-y-0`}
    {...props}
  />
);

import { motion, useReducedMotion } from "motion/react";
import { UNIT_FADE } from "./motion";

// 단위가 바뀌어 숫자가 교체될 때 짧게 페이드한다. 움직임 줄이기에서는 교체만 한다.
export const UnitValue = ({
  value,
  className,
}: {
  value: string;
  className?: string;
}) => {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <span className={className}>{value}</span>;
  return (
    <motion.span
      key={value}
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={UNIT_FADE.transition}
    >
      {value}
    </motion.span>
  );
};

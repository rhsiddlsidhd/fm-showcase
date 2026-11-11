import { motion, useReducedMotion } from "motion/react";
import { LOADING_DOT } from "./motion";

const DOTS = [0, 1, 2];
const DOT_CLASS = "size-2.5 rounded-full bg-foreground";

export const LoadingDots = () => {
  const reduceMotion = useReducedMotion();
  return (
    <div className="flex gap-2">
      {DOTS.map((dot) =>
        reduceMotion ? (
          <span key={dot} data-testid="loading-dot" className={DOT_CLASS} />
        ) : (
          <motion.span
            key={dot}
            data-testid="loading-dot"
            className={DOT_CLASS}
            animate={{ y: [0, LOADING_DOT.liftY, 0] }}
            transition={{
              ...LOADING_DOT.transition,
              delay: dot * LOADING_DOT.staggerSeconds,
            }}
          />
        ),
      )}
    </div>
  );
};

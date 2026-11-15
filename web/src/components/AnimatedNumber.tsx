"use client";

import { useEffect, useRef } from "react";
import { useInView, animate } from "motion/react";

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  formatCommas?: boolean;
  className?: string;
  duration?: number;
  delay?: number;
}

export function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  formatCommas = false,
  className = "",
  duration = 1.3,
  delay = 0,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.2 });

  useEffect(() => {
    if (!ref.current) return;

    if (isInView) {
      const controls = animate(0, value, {
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
        onUpdate(latest) {
          if (ref.current) {
            const rounded = Math.round(latest);
            const formatted = formatCommas ? rounded.toLocaleString() : rounded.toString();
            ref.current.textContent = `${prefix}${formatted}${suffix}`;
          }
        },
      });
      return () => controls.stop();
    } else {
      if (ref.current) {
        ref.current.textContent = `${prefix}0${suffix}`;
      }
    }
  }, [isInView, value, prefix, suffix, formatCommas, duration, delay]);

  return (
    <span ref={ref} className={className}>
      {prefix}{formatCommas ? value.toLocaleString() : value}{suffix}
    </span>
  );
}

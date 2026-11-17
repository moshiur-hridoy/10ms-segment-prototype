"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Lab `class` v50 (P144): on phones "যেখানে থেমেছিলে" floats at the bottom of the paper's page instead of
 * sitting above the syllabus. Scrolling down (reading the list) slides it away; scrolling up brings it back,
 * and it always shows near the top. From tablet width (`md`) it stays in place above the syllabus, full width (P144 fix, 14 Nov).
 */
export function FloatingResume({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const last = useRef(0);

  useEffect(() => {
    last.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - last.current;
      if (y < 80) setHidden(false);
      else if (dy > 6) setHidden(true);
      else if (dy < -6) setHidden(false);
      if (Math.abs(dy) > 6) last.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div
        className={cn(
          "fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 mx-auto max-w-md rounded-full shadow-pop transition-[translate,opacity] duration-(--motion-base) ease-standard md:static md:inset-auto md:z-auto md:max-w-none md:shadow-none md:transition-none",
          hidden && "pointer-events-none translate-y-[calc(100%+1.5rem)] opacity-0 md:pointer-events-auto md:translate-y-0 md:opacity-100",
        )}
      >
        {children}
      </div>
      {/* Room at the end of the page on phones, so the floating strip never covers the last chapter. */}
      <div aria-hidden className="order-last h-16 md:hidden" />
    </>
  );
}

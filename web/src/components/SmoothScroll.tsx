"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

export function SmoothScroll({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Reset scroll to top on page navigation
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  useEffect(() => {
    // Avoid running if window is missing or on touch devices
    if (typeof window === "undefined" || "ontouchstart" in window || navigator.maxTouchPoints > 0) {
      window.scrollTo(0, 0);
      return;
    }

    const lenis = new Lenis({
      duration: 0.9,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      syncTouch: false,
      autoResize: true,
    });

    // Reset scroll to top immediately on navigation
    lenis.scrollTo(0, { immediate: true });
    window.scrollTo(0, 0);

    let animationFrameId: number;

    function raf(time: number) {
      lenis.raf(time);
      animationFrameId = requestAnimationFrame(raf);
    }

    animationFrameId = requestAnimationFrame(raf);

    // Call resize on content changes
    const resizeObserver = new ResizeObserver(() => {
      lenis.resize();
    });
    
    if (document.body) {
      resizeObserver.observe(document.body);
    }

    // Global listener for link clicks
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (target && target.getAttribute("href")?.startsWith("/")) {
        const href = target.getAttribute("href") || "";
        if (!href.includes("#")) {
          lenis.scrollTo(0, { immediate: true });
          window.scrollTo(0, 0);
        }
      }
    };
    document.addEventListener("click", handleLinkClick);

    // Force resize immediately on route change
    lenis.resize();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      document.removeEventListener("click", handleLinkClick);
      lenis.destroy();
    };
  }, [pathname]);

  return <>{children}</>;
}

"use client";

import { useEffect, useRef } from "react";

export function useHeroScroll() {
  const heroSceneRef = useRef<HTMLElement>(null);
  const heroPanelRef = useRef<HTMLDivElement>(null);
  const heroVisualRef = useRef<HTMLDivElement>(null);

  // SCROLL FADE
  // Only the image, artwork and hero copy fade.
  // The battery finder stays sharp and fully visible.
  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;

      const scene = heroSceneRef.current;
      const panel = heroPanelRef.current;
      const visual = heroVisualRef.current;

      if (!scene || !panel || !visual) return;

      const travel = Math.max(
        1,
        scene.offsetHeight - panel.offsetHeight
      );

      const scrolled = Math.max(
        0,
        -scene.getBoundingClientRect().top
      );

      // Start fading shortly after scrolling begins.
      const start = Math.min(50, travel * 0.1);

      // Finish while the finder is near viewport centre,
      // before the sticky hero reaches its boundary.
      const end = Math.max(
        start + 100,
        Math.min(
          travel * 0.64,
          window.innerHeight * 0.36
        )
      );

      const progress = Math.max(
        0,
        Math.min(
          1,
          (scrolled - start) / (end - start)
        )
      );

      // Smoothstep easing prevents a harsh transition.
      const eased =
        progress * progress * (3 - 2 * progress);

      // Unlike the old 82% overlay,
      // this reaches complete transparency.
      visual.style.opacity = String(1 - eased);
    };

    const onScroll = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", onScroll, {
      passive: true,
    });

    window.addEventListener("resize", onScroll);

    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);

      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);
  return { heroSceneRef, heroPanelRef, heroVisualRef };
}

import { useEffect, useRef, useState } from "react";
import type { AnimationItem } from "lottie-web";

/** The supported SVG-only player excludes expression evaluation and eval. */
export default function LightAnimation({
  animationData,
  loop = false,
  onComplete,
}: {
  animationData: object;
  loop?: boolean;
  onComplete?: () => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const completion = useRef(onComplete);
  completion.current = onComplete;
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let disposed = false;
    let animation: AnimationItem | undefined;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => {
      if (!animation) return;
      if (preference.matches) animation.goToAndStop(0, true);
      else animation.play();
    };
    preference.addEventListener("change", updateMotion);
    void import("lottie-web/build/player/lottie_light")
      .then(({ default: player }) => {
        if (disposed || !container.current) return;
        animation = player.loadAnimation({
          container: container.current,
          renderer: "svg",
          loop,
          autoplay: !preference.matches,
          animationData: structuredClone(animationData),
        });
        animation.addEventListener("complete", () => completion.current?.());
        animation.addEventListener("DOMLoaded", updateMotion);
        updateMotion();
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });
    return () => {
      disposed = true;
      preference.removeEventListener("change", updateMotion);
      animation?.destroy();
    };
  }, [animationData, loop]);
  return (
    <div
      ref={container}
      aria-hidden="true"
      className="h-full w-full"
      data-spark-animation="light-svg"
    >
      {failed && (
        <span className="flex h-full items-center justify-center text-3xl">
          ✦
        </span>
      )}
    </div>
  );
}

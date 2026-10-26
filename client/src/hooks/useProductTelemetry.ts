import { useEffect, useRef, useState } from "react";
import { createTelemetrySdk, type TelemetrySdk } from "@/lib/telemetry/sdk";
import {
  observedProductTransitions,
  type ProductTelemetryFrame,
} from "@/lib/productTelemetryTransitions";

/** Analytics owns no game clock, state, save queue or writer lease. */
export function useProductTelemetry(
  frame: ProductTelemetryFrame | null,
): TelemetrySdk | null {
  const [telemetry, setTelemetry] = useState<TelemetrySdk | null>(null);
  const previous = useRef<ProductTelemetryFrame | null>(null);
  useEffect(() => {
    const sdk = createTelemetrySdk();
    setTelemetry(sdk);
    const reconcile = () => {
      void sdk
        .reconcilePrivacy()
        .then(() => sdk.flush())
        .catch(() => {});
    };
    const visible = () => {
      if (document.visibilityState === "visible") reconcile();
    };
    const changed = (event: StorageEvent) => {
      void sdk
        .handleStorageChange(event)
        .then(reconcile)
        .catch(() => {});
    };
    // Poll only due records; exponential retry timestamps remain authoritative.
    const timer = window.setInterval(reconcile, 5_000);
    window.addEventListener("online", reconcile);
    window.addEventListener("focus", reconcile);
    window.addEventListener("storage", changed);
    document.addEventListener("visibilitychange", visible);
    reconcile();
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("online", reconcile);
      window.removeEventListener("focus", reconcile);
      window.removeEventListener("storage", changed);
      document.removeEventListener("visibilitychange", visible);
      void sdk.close();
    };
  }, []);
  useEffect(() => {
    const before = previous.current;
    previous.current = frame;
    if (!telemetry || !frame) return;
    for (const intent of observedProductTransitions(before, frame))
      void telemetry.capture(
        { runId: frame.runId, rulesetVersion: frame.rulesetVersion },
        intent,
      );
  }, [
    telemetry,
    frame?.runId,
    frame?.rulesetVersion,
    frame?.writable,
    frame?.activeTick,
    frame?.status,
    frame?.era,
    frame?.nonTrainingSpend,
    frame?.emergencyInterventions,
    frame?.debriefViewed,
  ]);
  return telemetry;
}

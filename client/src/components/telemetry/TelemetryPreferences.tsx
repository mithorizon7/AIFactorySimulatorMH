import { useCallback, useEffect, useState } from "react";
import type { TelemetryPreference, TelemetrySdk } from "@/lib/telemetry/sdk";

export interface TelemetryPreferencesProps {
  telemetry: Pick<
    TelemetrySdk,
    "preference" | "reconcilePrivacy" | "setConsent"
  >;
  onPreferenceChange?: (preference: TelemetryPreference) => void;
}

/**
 * An opt-in control only. It has no access to a game snapshot, player identity,
 * assessment answers, or any endpoint beyond the SDK's fixed same-origin path.
 */
export function TelemetryPreferences({
  telemetry,
  onPreferenceChange,
}: TelemetryPreferencesProps) {
  const [preference, setPreference] = useState(() => telemetry.preference());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let current = true;
    void telemetry
      .reconcilePrivacy()
      .then((next) => {
        if (current) setPreference(next);
      })
      .catch(() => {
        // Privacy reconciliation is best effort and must never break the game UI.
      });
    const refresh = () => {
      void telemetry
        .reconcilePrivacy()
        .then((next) => {
          if (current) setPreference(next);
        })
        .catch(() => {});
    };
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      current = false;
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [telemetry]);

  const updatePreference = useCallback(
    async (enabled: boolean) => {
      setSaving(true);
      try {
        const next = await telemetry.setConsent(enabled ? "yes" : "no");
        setPreference(next);
        onPreferenceChange?.(next);
      } catch {
        setPreference(telemetry.preference());
      } finally {
        setSaving(false);
      }
    },
    [onPreferenceChange, telemetry],
  );

  const controlId = "ai-factory-analytics-consent";
  return (
    <section aria-labelledby={`${controlId}-heading`}>
      <h2
        className="mb-2 text-base font-semibold text-white"
        id={`${controlId}-heading`}
      >
        Optional product analytics
      </h2>
      <p>
        Help us understand whether core game milestones work. This sends only
        anonymous, allowlisted product events—not names, answers, commands, or
        saved game data.
      </p>
      {preference.globalPrivacyControl ? (
        <p role="status">
          Your browser&apos;s Global Privacy Control is active, so optional
          analytics stays off and any queued analytics is removed.
        </p>
      ) : null}
      <label
        className="my-2 inline-flex min-h-11 items-center gap-3"
        htmlFor={controlId}
      >
        <input
          className="h-11 w-11 shrink-0 accent-teal-500"
          id={controlId}
          type="checkbox"
          checked={preference.enabled}
          disabled={saving || preference.globalPrivacyControl}
          onChange={(event) => void updatePreference(event.target.checked)}
        />
        Share optional anonymous product analytics
      </label>
      <p aria-live="polite">
        {preference.enabled
          ? "You allow optional analytics when the service is available. You can turn it off at any time."
          : "Optional analytics is off. Gameplay and saves work the same either way."}
      </p>
      {preference.persistenceError ? (
        <p role="alert">
          Analytics is off for this tab, but your browser could not save the
          choice. It may revert after reloading. Use your browser&apos;s privacy
          controls or clear this site&apos;s saved analytics preference to keep
          analytics off across reloads.
        </p>
      ) : null}
      <p className="mt-2">
        No research responses are collected here. The product-event retention
        limit is 90 days once collection is activated. Hosting and proxy access
        logs may contain IP addresses; the provider&apos;s actual retention
        policy is not yet verified.
      </p>
    </section>
  );
}

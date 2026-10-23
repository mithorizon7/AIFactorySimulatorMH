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
    return () => {
      current = false;
    };
  }, [telemetry]);

  const updatePreference = useCallback(
    async (enabled: boolean) => {
      setSaving(true);
      try {
        const next = await telemetry.setConsent(enabled ? "yes" : "no");
        setPreference(next);
        onPreferenceChange?.(next);
      } finally {
        setSaving(false);
      }
    },
    [onPreferenceChange, telemetry],
  );

  const controlId = "ai-factory-analytics-consent";
  return (
    <section aria-labelledby={`${controlId}-heading`}>
      <h2 id={`${controlId}-heading`}>Optional product analytics</h2>
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
      <label htmlFor={controlId}>
        <input
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
          ? "Optional analytics is on. You can turn it off at any time."
          : "Optional analytics is off. Gameplay and saves work the same either way."}
      </p>
    </section>
  );
}

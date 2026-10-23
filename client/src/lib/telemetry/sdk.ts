import { z } from "zod";
import {
  TELEMETRY_SCHEMA_VERSION,
  telemetryEventSchema,
  type OutboxRecord,
  type TelemetryEvent,
  type TelemetryIntent,
} from "@shared/telemetry/contracts";
import { SUPPORTED_RULESET_VERSIONS } from "@shared/version";
import {
  TelemetryOutbox,
  type TelemetryIndexedDbFactory,
  type TelemetryOutboxLike,
} from "./outbox";

export const ANALYTICS_CONSENT_KEY = "ai-factory.analytics-consent";
export const TELEMETRY_VERSION_ENDPOINT = "/api/version";
export const TELEMETRY_EVENTS_ENDPOINT = "/api/v1/events";

export type AnalyticsConsent = "yes" | "no";

export interface TelemetryPreference {
  consent: AnalyticsConsent;
  globalPrivacyControl: boolean;
  enabled: boolean;
}

export interface TelemetryCaptureContext {
  runId: string;
  rulesetVersion: (typeof SUPPORTED_RULESET_VERSIONS)[number];
}

export interface TelemetryResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}

export type TelemetryNetwork = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<TelemetryResponse>;

export type TelemetryStorage = Pick<
  Storage,
  "getItem" | "setItem" | "removeItem"
>;

const captureContextSchema = z
  .object({
    runId: z.string().uuid(),
    rulesetVersion: z.enum(SUPPORTED_RULESET_VERSIONS),
  })
  .strict();
const intentShapeSchema = z
  .object({ type: z.string(), properties: z.unknown() })
  .strict();
const buildShaSchema = z
  .object({
    data: z
      .object({ buildSha: z.string().regex(/^[0-9a-f]{40}$/) })
      .passthrough(),
  })
  .passthrough();
const directAcknowledgementSchema = z
  .object({ acceptedEventIds: z.array(z.string().uuid()) })
  .strict();
const envelopedAcknowledgementSchema = z
  .object({
    data: z
      .object({ acceptedEventIds: z.array(z.string().uuid()) })
      .passthrough(),
  })
  .passthrough();

function defaultStorage(): TelemetryStorage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function defaultGpc(): boolean {
  return (
    typeof navigator !== "undefined" &&
    (navigator as Navigator & { globalPrivacyControl?: boolean })
      .globalPrivacyControl === true
  );
}

function sameIds(left: readonly string[], right: readonly string[]): boolean {
  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();
  return (
    sortedLeft.length === sortedRight.length &&
    sortedLeft.every((id, index) => id === sortedRight[index])
  );
}

function acknowledgedIds(value: unknown): string[] | null {
  const direct = directAcknowledgementSchema.safeParse(value);
  if (direct.success) return direct.data.acceptedEventIds;
  const enveloped = envelopedAcknowledgementSchema.safeParse(value);
  return enveloped.success ? enveloped.data.data.acceptedEventIds : null;
}

export interface TelemetrySdkOptions {
  clock?: () => number;
  randomUuid?: () => string;
  network?: TelemetryNetwork;
  storage?: TelemetryStorage;
  globalPrivacyControl?: () => boolean;
  indexedDbFactory?: TelemetryIndexedDbFactory;
  outboxFactory?: () => Promise<TelemetryOutboxLike | null>;
  clearExistingOutbox?: () => Promise<void>;
  versionFetcher?: () => Promise<string | null>;
}

/**
 * Optional, failure-isolated telemetry. It accepts only a closed intent and a
 * minimal run context; snapshots, commands, assessment answers and free text
 * have no API path into this class.
 */
export class TelemetrySdk {
  private outbox: TelemetryOutboxLike | null | undefined;
  private openingOutbox: Promise<TelemetryOutboxLike | null> | undefined;
  private flushing: Promise<void> | undefined;
  private readonly clock: () => number;
  private readonly randomUuid: () => string;
  private readonly network: TelemetryNetwork | undefined;
  private readonly storage: TelemetryStorage | undefined;
  private readonly globalPrivacyControl: () => boolean;
  private readonly indexedDbFactory: TelemetryIndexedDbFactory | undefined;
  private readonly outboxFactory: () => Promise<TelemetryOutboxLike | null>;
  private readonly clearExistingOutbox: () => Promise<void>;
  private readonly versionFetcher: () => Promise<string | null>;
  private privacyReconciliation: Promise<void> | undefined;

  constructor(options: TelemetrySdkOptions = {}) {
    this.clock = options.clock ?? Date.now;
    this.randomUuid = options.randomUuid ?? (() => crypto.randomUUID());
    this.network = options.network ?? (globalThis.fetch as TelemetryNetwork);
    this.storage = options.storage ?? defaultStorage();
    this.globalPrivacyControl = options.globalPrivacyControl ?? defaultGpc;
    this.indexedDbFactory = options.indexedDbFactory;
    this.outboxFactory =
      options.outboxFactory ??
      (() =>
        TelemetryOutbox.open({
          factory: this.indexedDbFactory,
          now: this.clock,
        }));
    this.clearExistingOutbox =
      options.clearExistingOutbox ??
      (() =>
        TelemetryOutbox.clearExisting({
          factory: this.indexedDbFactory,
          now: this.clock,
        }));
    this.versionFetcher =
      options.versionFetcher ?? (() => this.fetchBuildSha());
    // A prior opt-in may have left a v2 queue behind. The SDK never creates
    // game storage here; clearExistingOutbox only opens an already-known v2 DB.
    void this.reconcilePrivacy();
  }

  preference(): TelemetryPreference {
    const globalPrivacyControl = this.readGlobalPrivacyControl();
    let consent: AnalyticsConsent = "no";
    try {
      if (this.storage?.getItem(ANALYTICS_CONSENT_KEY) === "yes")
        consent = "yes";
    } catch {
      // Storage failures fail closed: opt-in cannot be inferred or retained.
    }
    return {
      consent,
      globalPrivacyControl,
      enabled: consent === "yes" && !globalPrivacyControl,
    };
  }

  async setConsent(consent: AnalyticsConsent): Promise<TelemetryPreference> {
    try {
      this.storage?.setItem(ANALYTICS_CONSENT_KEY, consent);
    } catch {
      // A non-persistent opt-in is not an opt-in. The returned preference stays off.
      await this.schedulePrivacyPurge();
      return this.preference();
    }
    const preference = this.preference();
    // Storage may be unavailable or silently fail. Treat an unobservable opt-in
    // as off and remove any queue rather than leaving a stale prior opt-in.
    if (!preference.enabled) await this.schedulePrivacyPurge();
    return preference;
  }

  /** Rechecks opt-in/GPC and clears any existing v2 queue when analytics is off. */
  async reconcilePrivacy(): Promise<TelemetryPreference> {
    const preference = this.preference();
    if (!preference.enabled) await this.schedulePrivacyPurge();
    return preference;
  }

  /** Safe for game observers to call and intentionally never rejects. */
  async capture(
    context: TelemetryCaptureContext,
    intent: TelemetryIntent,
  ): Promise<void> {
    try {
      // Do not enqueue a newly opted-in event until an older opt-out/GPC purge
      // that was already in progress has completed.
      await this.privacyReconciliation;
      if (!this.preference().enabled) {
        void this.schedulePrivacyPurge();
        return;
      }
      const parsedContext = captureContextSchema.safeParse(context);
      const parsedIntent = intentShapeSchema.safeParse(intent);
      if (!parsedContext.success || !parsedIntent.success) return;
      const buildSha = await this.versionFetcher();
      if (!buildSha || !this.preference().enabled) return;
      const event = telemetryEventSchema.safeParse({
        schemaVersion: TELEMETRY_SCHEMA_VERSION,
        eventId: this.randomUuid(),
        runId: parsedContext.data.runId,
        buildSha,
        rulesetVersion: parsedContext.data.rulesetVersion,
        occurredAt: new Date(this.clock()).toISOString(),
        ...parsedIntent.data,
      });
      if (!event.success || !this.preference().enabled) return;
      const outbox = await this.getOutbox();
      if (!outbox || !this.preference().enabled) return;
      await outbox.enqueue(event.data);
      void this.flush();
    } catch {
      // Analytics is never allowed to interrupt gameplay or reveal diagnostics.
    }
  }

  /** Attempts one bounded batch and intentionally never rejects. */
  flush(): Promise<void> {
    if (!this.flushing) {
      this.flushing = this.flushSafely().finally(() => {
        this.flushing = undefined;
      });
    }
    return this.flushing;
  }

  async close(): Promise<void> {
    try {
      this.outbox?.close();
    } catch {
      // Closing optional analytics cannot affect the game lifecycle.
    } finally {
      this.outbox = null;
    }
  }

  private async fetchBuildSha(): Promise<string | null> {
    if (!this.network) return null;
    try {
      const response = await this.network(TELEMETRY_VERSION_ENDPOINT, {
        method: "GET",
        mode: "same-origin",
        credentials: "omit",
        cache: "no-store",
        redirect: "error",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) return null;
      const parsed = buildShaSchema.safeParse(await response.json());
      return parsed.success ? parsed.data.data.buildSha : null;
    } catch {
      return null;
    }
  }

  private readGlobalPrivacyControl(): boolean {
    try {
      return this.globalPrivacyControl();
    } catch {
      // If a browser privacy signal cannot be read, opt out rather than guess.
      return true;
    }
  }

  private async getOutbox(): Promise<TelemetryOutboxLike | null> {
    if (this.outbox !== undefined) return this.outbox;
    if (!this.openingOutbox) {
      this.openingOutbox = this.outboxFactory()
        .catch(() => null)
        .finally(() => {
          this.openingOutbox = undefined;
        });
    }
    const opened = await this.openingOutbox;
    if (opened) this.outbox = opened;
    return opened;
  }

  private async purge(): Promise<void> {
    try {
      if (this.outbox) {
        await this.outbox.clear();
        return;
      }
      // Never upgrade v1 merely to opt out. This is a v2-only cleanup path.
      await this.clearExistingOutbox();
    } catch {
      // Opt-out remains recorded even if browser storage is temporarily unavailable.
    }
  }

  private schedulePrivacyPurge(): Promise<void> {
    if (!this.privacyReconciliation) {
      this.privacyReconciliation = this.purge().finally(() => {
        this.privacyReconciliation = undefined;
      });
    }
    return this.privacyReconciliation;
  }

  private async flushSafely(): Promise<void> {
    try {
      if (!this.preference().enabled) {
        await this.schedulePrivacyPurge();
        return;
      }
      const outbox = await this.getOutbox();
      if (!outbox || !this.network || !this.preference().enabled) return;
      const records = await outbox.due();
      if (!records.length) return;
      if (!this.preference().enabled) {
        await this.schedulePrivacyPurge();
        return;
      }
      const events = records.map((record) => record.event);
      let response: TelemetryResponse;
      try {
        response = await this.network(TELEMETRY_EVENTS_ENDPOINT, {
          method: "POST",
          mode: "same-origin",
          credentials: "omit",
          redirect: "error",
          cache: "no-store",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ events }),
        });
      } catch {
        if (this.preference().enabled)
          await outbox.recordFailure(
            records.map((record) => record.event.eventId),
          );
        else await this.schedulePrivacyPurge();
        return;
      }
      if (!this.preference().enabled) {
        await this.schedulePrivacyPurge();
        return;
      }
      if (!response.ok || response.status !== 202) {
        await outbox.recordFailure(
          records.map((record) => record.event.eventId),
        );
        return;
      }
      const accepted = acknowledgedIds(await response.json());
      const sent = events.map((event) => event.eventId);
      if (!accepted || !sameIds(accepted, sent)) {
        await outbox.recordFailure(sent);
        return;
      }
      await outbox.markDelivered(sent);
    } catch {
      // A malformed response, IndexedDB error or network failure is non-blocking.
    }
  }
}

export function createTelemetrySdk(
  options: TelemetrySdkOptions = {},
): TelemetrySdk {
  return new TelemetrySdk(options);
}

export type { OutboxRecord, TelemetryEvent, TelemetryIntent };

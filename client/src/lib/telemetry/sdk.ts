import { z } from "@shared/validation";
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
  persistenceError?: boolean;
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
      .object({
        buildSha: z.string().regex(/^[0-9a-f]{40}$/),
        telemetry: z.enum(["not_configured", "ready", "degraded"]).optional(),
      })
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
  executingBuildSha?: string | null;
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
  private closed = false;
  private privacyEpoch = 0;
  private revokedInMemory = false;
  private consentPersistenceError = false;
  private requests = new Set<AbortController>();
  private readonly executingBuildSha: string | null;
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
    const executingBuildSha: unknown =
      options.executingBuildSha ?? import.meta.env.VITE_APP_BUILD_SHA;
    this.executingBuildSha =
      typeof executingBuildSha === "string" &&
      /^[a-f0-9]{40}$/.test(executingBuildSha)
        ? executingBuildSha
        : null;
    this.clock = options.clock ?? Date.now;
    this.randomUuid = options.randomUuid ?? (() => crypto.randomUUID());
    // Native browser fetch requires its Window receiver. Storing the unbound
    // method and invoking it as this.network() fails only in real browsers.
    this.network =
      options.network ??
      (typeof globalThis.fetch === "function"
        ? (input, init) => globalThis.fetch(input, init)
        : undefined);
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
      if (
        !this.revokedInMemory &&
        this.storage?.getItem(ANALYTICS_CONSENT_KEY) === "yes"
      )
        consent = "yes";
    } catch {
      // Storage failures fail closed: opt-in cannot be inferred or retained.
    }
    return {
      consent,
      globalPrivacyControl,
      enabled: consent === "yes" && !globalPrivacyControl,
      ...(this.consentPersistenceError ? { persistenceError: true } : {}),
    };
  }

  async setConsent(consent: AnalyticsConsent): Promise<TelemetryPreference> {
    // Explicit revocation takes effect synchronously, even if storage rejects
    // the write or a prior opted-in capture is awaiting network/storage work.
    this.privacyEpoch++;
    this.revokedInMemory = true;
    try {
      if (!this.storage) throw new Error("Consent storage unavailable");
      this.storage.setItem(ANALYTICS_CONSENT_KEY, consent);
      if (this.storage.getItem(ANALYTICS_CONSENT_KEY) !== consent)
        throw new Error("Consent storage did not retain choice");
      this.consentPersistenceError = false;
      this.revokedInMemory = consent !== "yes";
    } catch {
      // A non-persistent opt-in is not an opt-in. The returned preference stays off.
      this.consentPersistenceError = true;
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

  /** Process the event value as well as current storage, preserving a rapid
   * cross-tab revocation even when another explicit opt-in has already followed. */
  async handleStorageChange(
    event: Pick<StorageEvent, "key" | "newValue">,
  ): Promise<void> {
    if (event.key !== null && event.key !== ANALYTICS_CONSENT_KEY) return;
    if (event.newValue !== "yes") await this.schedulePrivacyPurge();
    else this.revokedInMemory = false;
    await this.reconcilePrivacy();
  }

  /** Safe for game observers to call and intentionally never rejects. */
  async capture(
    context: TelemetryCaptureContext,
    intent: TelemetryIntent,
  ): Promise<void> {
    try {
      if (this.closed || !this.executingBuildSha) return;
      const epoch = this.privacyEpoch;
      const occurredAt = new Date(this.clock()).toISOString();
      // Do not enqueue a newly opted-in event until an older opt-out/GPC purge
      // that was already in progress has completed.
      await this.privacyReconciliation;
      if (!this.privacyCurrent(epoch)) {
        if (!this.preference().enabled) void this.schedulePrivacyPurge();
        return;
      }
      const parsedContext = captureContextSchema.safeParse(context);
      const parsedIntent = intentShapeSchema.safeParse(intent);
      if (!parsedContext.success || !parsedIntent.success) return;
      const buildSha = await this.versionFetcher();
      if (
        !this.privacyCurrent(epoch) ||
        buildSha !== this.executingBuildSha ||
        !this.preference().enabled
      )
        return;
      const event = telemetryEventSchema.safeParse({
        schemaVersion: TELEMETRY_SCHEMA_VERSION,
        eventId: this.randomUuid(),
        runId: parsedContext.data.runId,
        buildSha,
        rulesetVersion: parsedContext.data.rulesetVersion,
        occurredAt,
        ...parsedIntent.data,
      });
      if (!event.success || !this.privacyCurrent(epoch)) return;
      const outbox = await this.getOutbox();
      if (!outbox || !this.privacyCurrent(epoch)) return;
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
    this.closed = true;
    for (const controller of Array.from(this.requests)) controller.abort();
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
      const response = await this.request(TELEMETRY_VERSION_ENDPOINT, {
        method: "GET",
        mode: "same-origin",
        credentials: "omit",
        cache: "no-store",
        redirect: "error",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) return null;
      const parsed = buildShaSchema.safeParse(await response.json());
      return parsed.success && parsed.data.data.telemetry !== "not_configured"
        ? parsed.data.data.buildSha
        : null;
    } catch {
      return null;
    }
  }

  private async request(
    input: RequestInfo | URL,
    init: RequestInit,
  ): Promise<TelemetryResponse> {
    if (this.closed || !this.network)
      throw new Error("Optional analytics closed");
    const controller = new AbortController();
    this.requests.add(controller);
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await this.network(input, {
        ...init,
        signal: controller.signal,
      });
      // Keep cancellation active through the response body, not just headers.
      // A stalled body must neither pin a capture nor strand the retry loop.
      const body = await response.json();
      return {
        ok: response.ok,
        status: response.status,
        json: async () => body,
      };
    } finally {
      clearTimeout(timeout);
      this.requests.delete(controller);
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
    if (this.closed) return null;
    if (this.outbox !== undefined) return this.outbox;
    if (!this.openingOutbox) {
      this.openingOutbox = this.outboxFactory()
        .catch(() => null)
        .finally(() => {
          this.openingOutbox = undefined;
        });
    }
    const opened = await this.openingOutbox;
    if (this.closed) {
      opened?.close();
      return null;
    }
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
    this.privacyEpoch++;
    for (const controller of Array.from(this.requests)) controller.abort();
    if (!this.privacyReconciliation) {
      this.privacyReconciliation = this.purge().finally(() => {
        this.privacyReconciliation = undefined;
      });
    }
    return this.privacyReconciliation;
  }

  private async flushSafely(): Promise<void> {
    try {
      if (this.closed) return;
      const epoch = this.privacyEpoch;
      if (!this.preference().enabled) {
        await this.schedulePrivacyPurge();
        return;
      }
      const outbox = await this.getOutbox();
      if (!outbox || !this.network || !this.privacyCurrent(epoch)) return;
      const records = await outbox.due();
      if (!records.length) return;
      if (!this.privacyCurrent(epoch)) return;
      const events = records.map((record) => record.event);
      let response: TelemetryResponse;
      try {
        response = await this.request(TELEMETRY_EVENTS_ENDPOINT, {
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
        if (this.privacyCurrent(epoch))
          await outbox.recordFailure(
            records.map((record) => record.event.eventId),
          );
        return;
      }
      if (!this.privacyCurrent(epoch)) return;
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

  private privacyCurrent(epoch: number): boolean {
    return (
      !this.closed && epoch === this.privacyEpoch && this.preference().enabled
    );
  }
}

export function createTelemetrySdk(
  options: TelemetrySdkOptions = {},
): TelemetrySdk {
  return new TelemetrySdk(options);
}

export type { OutboxRecord, TelemetryEvent, TelemetryIntent };

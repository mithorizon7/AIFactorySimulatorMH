import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import {
  clientTimeIsBounded,
  telemetryBatchSchema,
  type TelemetrySink,
} from "../../shared/telemetry/contracts";

export const TELEMETRY_EVENTS_PATH = "/api/v1/events";
const MAX_BODY_BYTES = 16 * 1024;
const DEFAULT_DAILY_EVENT_CAP = 5_000;
const DAY_MS = 24 * 60 * 60 * 1_000;
const MAX_CONCURRENT_REQUESTS = 20;
const MAX_REQUESTS_PER_WINDOW = 120;
const MIN_RATE_WINDOW_MS = 60_000;
const MAX_RATE_WINDOW_MS = DAY_MS;
const MIN_ALERT_COOLDOWN_MS = 1_000;
const MAX_ALERT_COOLDOWN_MS = DAY_MS;

export interface TelemetryIngressOptions {
  sink: TelemetrySink;
  origins: readonly string[];
  clock?: () => number;
  maxConcurrent?: number;
  maxRequestsPerWindow?: number;
  windowMs?: number;
  /** Per-process safety valve, not a provider-wide quota or retention control. */
  dailyEventCap?: number;
  alertCooldownMs?: number;
  onTelemetryDegraded?: () => void;
}

function boundedCount(
  value: number | undefined,
  fallback: number,
  maximum: number,
): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(Math.floor(value ?? fallback), 1), maximum);
}

function boundedDuration(
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(Math.floor(value ?? fallback), minimum), maximum);
}

function validOrigins(origins: readonly string[]): ReadonlySet<string> {
  const allowed = new Set<string>();
  for (const candidate of origins) {
    try {
      if (new URL(candidate).origin === candidate) allowed.add(candidate);
    } catch {
      // Bad deployment configuration fails closed for this optional route.
    }
  }
  return allowed;
}

function sendError(response: Response, status: number, code: string): void {
  response.setHeader("Cache-Control", "no-store");
  response.status(status).json({ error: { code } });
}

function headerIsWithinBodyLimit(request: Request): boolean {
  const header = request.get("content-length");
  if (!header) return true;
  if (!/^\d+$/.test(header)) return false;
  return Number(header) <= MAX_BODY_BYTES;
}

/**
 * Installs only the optional product-event ingress. It uses no cookies, CORS,
 * IP addresses, request-body logging, or research data path.
 */
export function installTelemetryIngress(
  app: Express,
  options: TelemetryIngressOptions,
): void {
  const allowedOrigins = validOrigins(options.origins);
  const clock = options.clock ?? Date.now;
  const maxConcurrent = boundedCount(
    options.maxConcurrent,
    4,
    MAX_CONCURRENT_REQUESTS,
  );
  const maxRequestsPerWindow = boundedCount(
    options.maxRequestsPerWindow,
    MAX_REQUESTS_PER_WINDOW,
    MAX_REQUESTS_PER_WINDOW,
  );
  // A shorter configurable window would silently weaken the sustained rate cap.
  const windowMs = boundedDuration(
    options.windowMs,
    60_000,
    MIN_RATE_WINDOW_MS,
    MAX_RATE_WINDOW_MS,
  );
  const dailyEventCap = boundedCount(
    options.dailyEventCap,
    DEFAULT_DAILY_EVENT_CAP,
    DEFAULT_DAILY_EVENT_CAP,
  );
  const alertCooldownMs = boundedDuration(
    options.alertCooldownMs,
    60_000,
    MIN_ALERT_COOLDOWN_MS,
    MAX_ALERT_COOLDOWN_MS,
  );
  let active = 0;
  let windowRequests: number[] = [];
  let dailyEvents: Array<{ time: number; count: number }> = [];
  let nextAlertAt = 0;

  const notifyDegraded = () => {
    const now = clock();
    if (now < nextAlertAt) return;
    nextAlertAt = now + alertCooldownMs;
    try {
      options.onTelemetryDegraded?.();
    } catch {
      // Alerting is observational; it must not change telemetry or core health.
    }
  };

  const permitRequest = (eventCount: number): "allowed" | "rate" | "daily" => {
    const now = clock();
    windowRequests = windowRequests.filter((time) => time > now - windowMs);
    dailyEvents = dailyEvents.filter((entry) => entry.time > now - DAY_MS);
    if (windowRequests.length >= maxRequestsPerWindow) return "rate";
    const eventsToday = dailyEvents.reduce(
      (total, entry) => total + entry.count,
      0,
    );
    if (eventsToday + eventCount > dailyEventCap) return "daily";
    windowRequests.push(now);
    dailyEvents.push({ time: now, count: eventCount });
    return "allowed";
  };

  const preflight = (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    response.setHeader("Cache-Control", "no-store");
    // Global Privacy Control must short-circuit before parsing or retaining a body.
    if (request.get("sec-gpc") === "1") {
      response.status(204).end();
      return;
    }
    if (!headerIsWithinBodyLimit(request)) {
      sendError(response, 413, "TELEMETRY_PAYLOAD_TOO_LARGE");
      return;
    }
    if (request.is("application/json") !== "application/json") {
      sendError(response, 415, "TELEMETRY_CONTENT_TYPE_REQUIRED");
      return;
    }
    if (!allowedOrigins.has(request.get("origin") ?? "")) {
      sendError(response, 403, "TELEMETRY_ORIGIN_FORBIDDEN");
      return;
    }
    if (request.get("sec-fetch-site")?.toLowerCase() !== "same-origin") {
      sendError(response, 403, "TELEMETRY_FETCH_METADATA_REQUIRED");
      return;
    }
    const mode = request.get("sec-fetch-mode")?.toLowerCase();
    const destination = request.get("sec-fetch-dest")?.toLowerCase();
    if (
      (mode !== undefined && !["cors", "same-origin"].includes(mode)) ||
      (destination !== undefined && destination !== "empty")
    ) {
      sendError(response, 403, "TELEMETRY_FETCH_METADATA_REQUIRED");
      return;
    }
    next();
  };

  const receive = async (request: Request, response: Response) => {
    const parsed = telemetryBatchSchema.safeParse(request.body);
    if (!parsed.success) {
      sendError(response, 400, "INVALID_TELEMETRY_EVENT");
      return;
    }
    if (
      new Set(parsed.data.events.map((event) => event.eventId)).size !==
      parsed.data.events.length
    ) {
      sendError(response, 400, "DUPLICATE_TELEMETRY_EVENT");
      return;
    }
    const receivedAt = clock();
    if (
      !parsed.data.events.every((event) =>
        clientTimeIsBounded(event.occurredAt, receivedAt),
      )
    ) {
      sendError(response, 400, "INVALID_TELEMETRY_TIME");
      return;
    }
    const allowance =
      active >= maxConcurrent
        ? "rate"
        : permitRequest(parsed.data.events.length);
    if (allowance !== "allowed") {
      response.setHeader(
        "Retry-After",
        allowance === "daily" ? "86400" : String(Math.ceil(windowMs / 1_000)),
      );
      sendError(
        response,
        429,
        allowance === "daily"
          ? "TELEMETRY_DAILY_CAP_REACHED"
          : "TELEMETRY_RATE_LIMITED",
      );
      return;
    }
    active += 1;
    try {
      await options.sink.accept(parsed.data.events, new Date(receivedAt));
      response.status(202).json({
        data: {
          acceptedEventIds: parsed.data.events.map((event) => event.eventId),
        },
      });
    } catch {
      // The telemetry sink is optional. Treat every sink error as telemetry
      // degradation, but never let it become a core application failure.
      notifyDegraded();
      sendError(response, 503, "TELEMETRY_UNAVAILABLE");
    } finally {
      active -= 1;
    }
  };

  app.post(
    TELEMETRY_EVENTS_PATH,
    preflight,
    express.json({
      limit: MAX_BODY_BYTES,
      inflate: false,
      strict: true,
      type: "application/json",
    }),
    (request, response) => {
      void receive(request, response);
    },
  );
}

export const telemetryIngressInternals = {
  validOrigins,
  headerIsWithinBodyLimit,
  boundedCount,
  boundedDuration,
};

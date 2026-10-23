import {
  OUTBOX_DATABASE_VERSION,
  OUTBOX_MAX_AGE_MS,
  OUTBOX_MAX_EVENTS,
  OUTBOX_STORE,
  outboxRecordSchema,
  telemetryEventSchema,
  type OutboxRecord,
  type TelemetryEvent,
} from "@shared/telemetry/contracts";

/** This name and the v1 stores are owned by the local-game persistence contract. */
export const GAME_DATABASE_NAME = "ai-factory";
export const OUTBOX_MAX_ATTEMPTS = 16;
export const OUTBOX_RETRY_BASE_MS = 1_000;
export const OUTBOX_RETRY_MAX_MS = 5 * 60_000;
const MAX_BATCH_SIZE = 20;

type DatabaseInfo = { name?: string; version?: number };
export type TelemetryIndexedDbFactory = IDBFactory & {
  databases?: () => Promise<DatabaseInfo[]>;
};

export interface TelemetryOutboxLike {
  enqueue(event: TelemetryEvent): Promise<boolean>;
  due(limit?: number): Promise<OutboxRecord[]>;
  markDelivered(eventIds: readonly string[]): Promise<void>;
  recordFailure(eventIds: readonly string[]): Promise<void>;
  clear(): Promise<void>;
  size(): Promise<number>;
  close(): void;
}

export class TelemetryOutboxLayoutError extends Error {
  constructor(message = "Telemetry storage has an unsupported layout.") {
    super(message);
    this.name = "TelemetryOutboxLayoutError";
  }
}

export class TelemetryOutboxUnavailableError extends Error {
  constructor(
    message = "Telemetry storage is not ready; analytics remains optional.",
  ) {
    super(message);
    this.name = "TelemetryOutboxUnavailableError";
  }
}

type StoreSpecification = {
  keyPath: string | string[];
  indexes: readonly string[];
};

const V1_STORES: Record<string, StoreSpecification> = {
  runs: { keyPath: "runId", indexes: ["status", "savedAt", "rulesetVersion"] },
  recoveryBackups: { keyPath: "backupId", indexes: ["runId", "createdAt"] },
  meta: { keyPath: "key", indexes: [] },
  completedRuns: { keyPath: "runId", indexes: [] },
  completedSnapshots: { keyPath: "runId", indexes: [] },
  personalBests: { keyPath: ["rulesetVersion", "metric"], indexes: [] },
};

const V2_STORES: Record<string, StoreSpecification> = {
  ...V1_STORES,
  [OUTBOX_STORE]: {
    keyPath: "event.eventId",
    indexes: ["queuedAt", "nextAttemptAt"],
  },
};

function request<T>(operation: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    operation.onsuccess = () => resolve(operation.result);
    operation.onerror = () => reject(operation.error);
  });
}

function transactionCompleted(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () =>
      reject(
        transaction.error ??
          new Error("Telemetry storage transaction aborted."),
      );
  });
}

function keyPathMatches(
  actual: IDBObjectStore["keyPath"],
  expected: string | string[],
): boolean {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function hasExactLayout(
  database: IDBDatabase,
  expected: Record<string, StoreSpecification>,
  activeTransaction?: IDBTransaction | null,
): boolean {
  const names = Array.from(database.objectStoreNames).sort();
  if (JSON.stringify(names) !== JSON.stringify(Object.keys(expected).sort()))
    return false;

  // During onupgradeneeded, IndexedDB forbids opening a second transaction;
  // inspect through the versionchange transaction that is already in flight.
  const transaction =
    activeTransaction ?? database.transaction(names, "readonly");
  return names.every((name) => {
    const store = transaction.objectStore(name);
    const specification = expected[name];
    if (
      !specification ||
      store.autoIncrement ||
      !keyPathMatches(store.keyPath, specification.keyPath) ||
      JSON.stringify(Array.from(store.indexNames).sort()) !==
        JSON.stringify([...specification.indexes].sort())
    )
      return false;
    return specification.indexes.every((indexName) => {
      const index = store.index(indexName);
      return index.keyPath === indexName && !index.unique && !index.multiEntry;
    });
  });
}

function compareRecords(left: OutboxRecord, right: OutboxRecord): number {
  return (
    left.queuedAt - right.queuedAt ||
    left.event.eventId.localeCompare(right.event.eventId)
  );
}

function retryDelay(attempt: number): number {
  const exponent = Math.min(Math.max(attempt - 1, 0), OUTBOX_MAX_ATTEMPTS - 1);
  return Math.min(OUTBOX_RETRY_MAX_MS, OUTBOX_RETRY_BASE_MS * 2 ** exponent);
}

function asOutboxRecord(value: unknown): OutboxRecord | null {
  const parsed = outboxRecordSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

async function openExistingDatabase(
  factory: TelemetryIndexedDbFactory,
  name: string,
): Promise<IDBDatabase | null> {
  const opening = factory.open(name);
  let creationAttempted = false;
  opening.onupgradeneeded = () => {
    // The telemetry SDK must never initialize an empty game database.
    creationAttempted = true;
    opening.transaction?.abort();
  };
  return new Promise((resolve, reject) => {
    opening.onsuccess = () => {
      if (creationAttempted) {
        opening.result.close();
        resolve(null);
      } else {
        resolve(opening.result);
      }
    };
    opening.onerror = () => {
      if (creationAttempted) resolve(null);
      else reject(opening.error);
    };
    opening.onblocked = () =>
      reject(
        new TelemetryOutboxUnavailableError(
          "Another tab is updating local storage; telemetry will retry later.",
        ),
      );
  });
}

async function upgradeKnownV1(
  factory: TelemetryIndexedDbFactory,
  name: string,
): Promise<IDBDatabase> {
  const opening = factory.open(name, OUTBOX_DATABASE_VERSION);
  let acceptedUpgrade = false;
  opening.onupgradeneeded = (event) => {
    const change = event as IDBVersionChangeEvent;
    const database = opening.result;
    if (
      change.oldVersion !== 1 ||
      change.newVersion !== OUTBOX_DATABASE_VERSION ||
      !hasExactLayout(database, V1_STORES, opening.transaction)
    ) {
      opening.transaction?.abort();
      return;
    }
    const outbox = database.createObjectStore(OUTBOX_STORE, {
      keyPath: "event.eventId",
      autoIncrement: false,
    });
    outbox.createIndex("queuedAt", "queuedAt", {
      unique: false,
      multiEntry: false,
    });
    outbox.createIndex("nextAttemptAt", "nextAttemptAt", {
      unique: false,
      multiEntry: false,
    });
    acceptedUpgrade = true;
  };
  return new Promise((resolve, reject) => {
    opening.onsuccess = () => {
      if (!acceptedUpgrade || !hasExactLayout(opening.result, V2_STORES)) {
        opening.result.close();
        reject(new TelemetryOutboxLayoutError());
        return;
      }
      resolve(opening.result);
    };
    opening.onerror = () =>
      reject(
        new TelemetryOutboxLayoutError(
          "Telemetry storage could not be upgraded from the known v1 layout.",
        ),
      );
    opening.onblocked = () =>
      reject(
        new TelemetryOutboxUnavailableError(
          "Another tab must close its storage connection before analytics can start.",
        ),
      );
  });
}

/**
 * A deliberately narrow v1→v2 upgrade. It only runs after the game database
 * exists, recognizes every v1 store exactly, and creates the additive outbox.
 */
export class TelemetryOutbox implements TelemetryOutboxLike {
  private constructor(
    private readonly database: IDBDatabase,
    private readonly now: () => number,
  ) {
    database.onversionchange = () => database.close();
  }

  static async open(
    options: {
      factory?: TelemetryIndexedDbFactory;
      now?: () => number;
      databaseName?: string;
    } = {},
  ): Promise<TelemetryOutbox | null> {
    const factory =
      options.factory ?? (globalThis.indexedDB as TelemetryIndexedDbFactory);
    const name = options.databaseName ?? GAME_DATABASE_NAME;
    if (!factory?.databases) return null;

    const existing = await factory.databases();
    if (!existing.some((database) => database.name === name)) return null;

    const database = await openExistingDatabase(factory, name);
    if (!database) return null;
    if (database.version === OUTBOX_DATABASE_VERSION) {
      if (!hasExactLayout(database, V2_STORES)) {
        database.close();
        throw new TelemetryOutboxLayoutError();
      }
      return new TelemetryOutbox(database, options.now ?? Date.now);
    }
    if (database.version !== 1 || !hasExactLayout(database, V1_STORES)) {
      database.close();
      throw new TelemetryOutboxLayoutError();
    }
    database.close();
    return new TelemetryOutbox(
      await upgradeKnownV1(factory, name),
      options.now ?? Date.now,
    );
  }

  /** Clears an already-created v2 outbox without upgrading v1 game storage. */
  static async clearExisting(
    options: {
      factory?: TelemetryIndexedDbFactory;
      now?: () => number;
      databaseName?: string;
    } = {},
  ): Promise<void> {
    const factory =
      options.factory ?? (globalThis.indexedDB as TelemetryIndexedDbFactory);
    const name = options.databaseName ?? GAME_DATABASE_NAME;
    if (!factory?.databases) return;
    const known = await factory.databases();
    if (!known.some((database) => database.name === name)) return;
    const database = await openExistingDatabase(factory, name);
    if (!database) return;
    try {
      if (
        database.version === OUTBOX_DATABASE_VERSION &&
        hasExactLayout(database, V2_STORES)
      )
        await new TelemetryOutbox(database, options.now ?? Date.now).clear();
    } finally {
      database.close();
    }
  }

  private async readRecords(): Promise<OutboxRecord[]> {
    const transaction = this.database.transaction(OUTBOX_STORE, "readonly");
    const done = transactionCompleted(transaction);
    const values = await request(
      transaction.objectStore(OUTBOX_STORE).getAll(),
    );
    await done;
    return values
      .map(asOutboxRecord)
      .filter((record): record is OutboxRecord => record !== null);
  }

  private async removeExpired(now = this.now()): Promise<void> {
    const transaction = this.database.transaction(OUTBOX_STORE, "readwrite");
    const done = transactionCompleted(transaction);
    const store = transaction.objectStore(OUTBOX_STORE);
    const records = (await request(store.getAll()))
      .map(asOutboxRecord)
      .filter((record): record is OutboxRecord => record !== null);
    for (const record of records)
      if (record.queuedAt < now - OUTBOX_MAX_AGE_MS)
        store.delete(record.event.eventId);
    await done;
  }

  async enqueue(event: TelemetryEvent): Promise<boolean> {
    const parsedEvent = telemetryEventSchema.parse(event);
    const now = this.now();
    const transaction = this.database.transaction(OUTBOX_STORE, "readwrite");
    const done = transactionCompleted(transaction);
    const store = transaction.objectStore(OUTBOX_STORE);
    const existing = await request(store.get(parsedEvent.eventId));
    if (asOutboxRecord(existing)) {
      await done;
      return false;
    }
    if (existing) store.delete(parsedEvent.eventId);

    const records = (await request(store.getAll()))
      .map(asOutboxRecord)
      .filter((record): record is OutboxRecord => record !== null);
    const active = records
      .filter((record) => record.queuedAt >= now - OUTBOX_MAX_AGE_MS)
      .sort(compareRecords);
    for (const expired of records.filter(
      (record) => record.queuedAt < now - OUTBOX_MAX_AGE_MS,
    ))
      store.delete(expired.event.eventId);
    while (active.length >= OUTBOX_MAX_EVENTS) {
      const oldest = active.shift();
      if (oldest) store.delete(oldest.event.eventId);
    }
    store.put({
      event: parsedEvent,
      queuedAt: now,
      attempts: 0,
      nextAttemptAt: now,
    } satisfies OutboxRecord);
    await done;
    return true;
  }

  async due(limit = MAX_BATCH_SIZE): Promise<OutboxRecord[]> {
    const now = this.now();
    await this.removeExpired(now);
    const boundedLimit = Math.min(
      Math.max(Math.floor(limit), 1),
      MAX_BATCH_SIZE,
    );
    return (await this.readRecords())
      .filter(
        (record) =>
          record.queuedAt >= now - OUTBOX_MAX_AGE_MS &&
          record.nextAttemptAt <= now &&
          record.attempts < OUTBOX_MAX_ATTEMPTS,
      )
      .sort(
        (left, right) =>
          left.nextAttemptAt - right.nextAttemptAt ||
          compareRecords(left, right),
      )
      .slice(0, boundedLimit);
  }

  async markDelivered(eventIds: readonly string[]): Promise<void> {
    if (!eventIds.length) return;
    const transaction = this.database.transaction(OUTBOX_STORE, "readwrite");
    const done = transactionCompleted(transaction);
    const store = transaction.objectStore(OUTBOX_STORE);
    for (const eventId of eventIds) store.delete(eventId);
    await done;
  }

  async recordFailure(eventIds: readonly string[]): Promise<void> {
    if (!eventIds.length) return;
    const now = this.now();
    const transaction = this.database.transaction(OUTBOX_STORE, "readwrite");
    const done = transactionCompleted(transaction);
    const store = transaction.objectStore(OUTBOX_STORE);
    for (const eventId of eventIds) {
      const record = asOutboxRecord(await request(store.get(eventId)));
      if (!record) continue;
      const attempts = record.attempts + 1;
      if (attempts >= OUTBOX_MAX_ATTEMPTS) {
        store.delete(eventId);
        continue;
      }
      store.put({
        ...record,
        attempts,
        nextAttemptAt: now + retryDelay(attempts),
      } satisfies OutboxRecord);
    }
    await done;
  }

  async clear(): Promise<void> {
    const transaction = this.database.transaction(OUTBOX_STORE, "readwrite");
    const done = transactionCompleted(transaction);
    transaction.objectStore(OUTBOX_STORE).clear();
    await done;
  }

  async size(): Promise<number> {
    await this.removeExpired();
    const transaction = this.database.transaction(OUTBOX_STORE, "readonly");
    const done = transactionCompleted(transaction);
    const count = await request(transaction.objectStore(OUTBOX_STORE).count());
    await done;
    return count;
  }

  close(): void {
    this.database.close();
  }
}

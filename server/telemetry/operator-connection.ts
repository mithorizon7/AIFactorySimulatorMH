import path from "node:path";
import type { ClientConfig } from "pg";

/** Canonical driver configuration: never pass a URL with overriding options. */
export function operatorConnectionConfiguration(
  connectionString: string,
  localOnly = false,
): ClientConfig {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error("Invalid database connection configuration");
  }
  if (!["postgres:", "postgresql:"].includes(url.protocol))
    throw new Error("Unsupported database protocol");
  for (const key of Array.from(url.searchParams.keys())) {
    if (
      !["host", "port"].includes(key) ||
      url.searchParams.getAll(key).length !== 1
    )
      throw new Error("Database URL overrides are not permitted");
  }
  const host = decodeURIComponent(
    url.searchParams.get("host") ?? url.hostname,
  ).replace(/^\[|\]$/g, "");
  const socket = host.startsWith("/");
  // Only this task's explicitly isolated test socket family is plaintext.
  const privateSocket =
    socket &&
    path.normalize(host) === host &&
    /^\/private\/tmp\/aifactory-c-pg-[A-Za-z0-9_-]+$/.test(host);
  const loopback = ["localhost", "127.0.0.1", "::1"].includes(host);
  if (
    !host ||
    (!socket && !/^[A-Za-z0-9.:-]+$/.test(host)) ||
    (socket && !privateSocket)
  )
    throw new Error("Database host is not supported");
  const local = loopback || privateSocket;
  if (localOnly && !local)
    throw new Error("Database qualification refuses nonlocal targets");
  const portText = url.searchParams.get("port") ?? (url.port || "5432");
  const port = Number(portText);
  if (
    !/^\d+$/.test(portText) ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  )
    throw new Error("Invalid database port");
  const user = decodeURIComponent(url.username);
  const database = decodeURIComponent(url.pathname.slice(1));
  if (
    !/^[A-Za-z0-9_.-]{1,63}$/.test(user) ||
    !/^[A-Za-z0-9_.-]{1,63}$/.test(database)
  )
    throw new Error("An explicit supported database and user are required");
  return {
    host,
    port,
    user,
    database,
    password: decodeURIComponent(url.password),
    ssl: local ? false : { rejectUnauthorized: true },
    connectionTimeoutMillis: 5000,
    statement_timeout: 15000,
    application_name: "aifactory-data-operator",
  };
}

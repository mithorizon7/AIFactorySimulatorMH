import { expect, it } from "vitest";
import { operatorConnectionConfiguration } from "../../../server/telemetry/operator-connection";
it("classifies the effective driver host, never the overridden URL authority", () => {
  const url =
    "postgresql://synthetic@localhost/disposable?host=example.invalid";
  expect(() => operatorConnectionConfiguration(url, true)).toThrow("nonlocal");
  expect(operatorConnectionConfiguration(url)).toMatchObject({
    host: "example.invalid",
    ssl: { rejectUnauthorized: true },
  });
  expect(
    operatorConnectionConfiguration(
      "postgresql://synthetic@example.invalid/disposable?host=127.0.0.1",
      true,
    ),
  ).toMatchObject({ host: "127.0.0.1", ssl: false });
  expect(
    operatorConnectionConfiguration(
      "postgresql://synthetic@localhost/disposable?host=/private/tmp/aifactory-c-pg-contract&port=55432",
      true,
    ),
  ).toMatchObject({
    host: "/private/tmp/aifactory-c-pg-contract",
    port: 55432,
    ssl: false,
  });
});
it("rejects URL overrides, ambiguous parameters and socket traversal before driver construction", () => {
  for (const suffix of [
    "?sslmode=disable",
    "?sslcert=/private/file",
    "?password=override",
    "?options=override",
    "?host=a&host=b",
    "?port=0",
    "?port=65536",
    "?host=/private/tmp/aifactory-c-pg-test/../../private",
    "?host=/var/run/postgresql",
  ]) {
    expect(() =>
      operatorConnectionConfiguration(
        `postgresql://synthetic@localhost/disposable${suffix}`,
        true,
      ),
    ).toThrow();
  }
  expect(() =>
    operatorConnectionConfiguration(
      "https://synthetic@localhost/disposable",
      true,
    ),
  ).toThrow();
});

import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "../../../shared/validation";

describe("CSP-safe validation bootstrap", () => {
  it("disables code generation before creating strict schemas", () => {
    expect(z.config().jitless).toBe(true);
    const schema = z.object({ count: z.number().int().nonnegative() }).strict();
    expect(schema.parse({ count: 1 })).toEqual({ count: 1 });
    expect(schema.safeParse({ count: 1, private: "rejected" }).success).toBe(
      false,
    );
  });

  it("routes every application Zod import through the configured bootstrap", () => {
    const root = path.resolve(import.meta.dirname, "../../..");
    const bypasses: string[] = [];
    function inspect(directory: string) {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) inspect(file);
        else if (
          /\.tsx?$/.test(file) &&
          file !== path.join(root, "shared/validation.ts")
        ) {
          if (
            /from\s+["']zod(?:\/[^"']*)?["']/.test(readFileSync(file, "utf8"))
          )
            bypasses.push(path.relative(root, file));
        }
      }
    }
    for (const directory of ["shared", "server", "client/src"])
      inspect(path.join(root, directory));
    expect(bypasses).toEqual([]);
  });
});

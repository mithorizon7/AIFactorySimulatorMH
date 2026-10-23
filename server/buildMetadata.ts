import fs from "node:fs";
import path from "node:path";

export interface BuildMetadata {
  buildSha: string | null;
  builtAt: string | null;
}

const shaPattern = /^[a-f0-9]{40}(?:[a-f0-9]{24})?$/i;

export function isCommitSha(value: unknown): value is string {
  return typeof value === "string" && shaPattern.test(value);
}

export function readBuildMetadata(
  metadataPath = path.resolve(process.cwd(), "dist/build-meta.json"),
): BuildMetadata {
  try {
    const parsed = JSON.parse(fs.readFileSync(metadataPath, "utf8")) as {
      buildSha?: unknown;
      builtAt?: unknown;
    };
    return {
      buildSha: isCommitSha(parsed.buildSha) ? parsed.buildSha : null,
      builtAt: typeof parsed.builtAt === "string" ? parsed.builtAt : null,
    };
  } catch {
    return { buildSha: null, builtAt: null };
  }
}

import { writeFileSync } from "node:fs";

// Deliberately omit titles, errors, logs, URLs, attachments and raw reporter data.
// A compromised response/assertion must not become a public Actions artifact.
export default class CanaryReporter {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.other = 0;
  }
  onTestEnd(_test, result) {
    if (result.status === "passed") this.passed += 1;
    else if (["failed", "timedOut"].includes(result.status)) this.failed += 1;
    else this.other += 1;
  }
  onEnd(result) {
    const status =
      this.failed > 0
        ? "failed"
        : result.status === "passed" && this.passed === 2 && this.other === 0
          ? "passed"
          : "inconclusive";
    writeFileSync(
      process.env.CANARY_BROWSER_REPORT,
      JSON.stringify({
        status,
        passed: this.passed,
        failed: this.failed,
        other: this.other,
      }),
    );
  }
}

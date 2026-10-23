import AxeBuilder from "@axe-core/playwright";
import {
  expect,
  test,
  type ConsoleMessage,
  type Page,
  type Request,
} from "@playwright/test";

const allowedConsoleErrors = new Set<string>();

function failOnBrowserRegressions(page: Page) {
  const errors: string[] = [];
  const retiredCalls: string[] = [];

  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message: ConsoleMessage) => {
    if (
      message.type() === "error" &&
      !allowedConsoleErrors.has(message.text())
    ) {
      errors.push(`console.error: ${message.text()}`);
    }
  });
  page.on("request", (request: Request) => {
    const pathname = new URL(request.url()).pathname;
    if (/^\/api\/(game-state|leaderboard|ranking(?:\/|$))/.test(pathname)) {
      retiredCalls.push(`${request.method()} ${pathname}`);
    }
  });

  return {
    assertClean() {
      expect(errors, "unexpected browser errors").toEqual([]);
      expect(retiredCalls, "browser called a retired global API").toEqual([]);
    },
  };
}

async function freshPage(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.addEventListener("securitypolicyviolation", (event) => {
      console.error(
        `CSP violation: ${event.violatedDirective} blocked ${event.blockedURI || "inline"}`,
      );
    });
  });
  await page.goto("/");
}

test("critical keyboard flow remains usable without console, CSP, or retired-API errors", async ({
  page,
}) => {
  const guard = failOnBrowserRegressions(page);
  await freshPage(page);

  const dialog = page.getByRole("dialog", { name: "Welcome to AI Factory!" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Skip Tutorial" }).focus();
  await page.keyboard.press("Enter");

  await page.getByTestId("button-start-game").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("button-pause-game")).toBeVisible();

  await page.getByRole("tab", { name: "Training" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("training-tab")).toBeVisible();

  await page.getByTestId("button-pause-game").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("button-start-game")).toContainText("Resume");

  await page.getByTestId("button-reset-game").focus();
  await page.keyboard.press("Enter");
  const resetDialog = page.getByRole("alertdialog");
  await expect(resetDialog).toBeVisible();
  await resetDialog.getByRole("button", { name: "Cancel" }).focus();
  await page.keyboard.press("Enter");
  await expect(resetDialog).toBeHidden();

  guard.assertClean();
});

test("fresh-game surface has no serious or critical axe findings", async ({
  page,
}) => {
  await freshPage(page);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Skip Tutorial" })
    .click();

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const blocking = results.violations.filter(
    (violation) =>
      violation.impact === "serious" || violation.impact === "critical",
  );

  expect(
    blocking.map(({ id, impact, nodes }) => ({
      id,
      impact,
      nodes: nodes.map((node) => ({
        target: node.target,
        html: node.html,
        failureSummary: node.failureSummary,
      })),
    })),
  ).toEqual([]);
});

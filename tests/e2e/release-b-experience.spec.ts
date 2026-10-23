import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const width of [390, 1440]) {
  test(`B lab surfaces stay readable and non-blocking at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1024 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto("/");
    await page.screenshot({
      path: testInfo.outputPath(`welcome-${width}.png`),
      fullPage: true,
    });
    await page.getByRole("button", { name: "Open my lab" }).click();
    await expect(page.getByTestId("button-start-game")).toBeFocused();
    await expect(page.getByTestId("financial-overview")).toContainText(
      "$1,000",
    );
    for (const tab of [
      "Dashboard",
      "Training",
      "Resources",
      "Economy",
      "Journey",
    ]) {
      await page.getByRole("tab", { name: tab, exact: true }).click();
      await expect(
        page.getByRole("tab", { name: tab, exact: true }),
      ).toHaveAttribute("data-state", "active");
      await expect(page.getByTestId("run-goal")).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(overflow, `${tab} page overflow at ${width}`).toBe(false);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(
        results.violations
          .filter(
            (item) => item.impact === "serious" || item.impact === "critical",
          )
          .map((item) => ({
            id: item.id,
            nodes: item.nodes.map((node) => node.target),
          })),
      ).toEqual([]);
      await page.screenshot({
        path: testInfo.outputPath(`${tab.toLowerCase()}-${width}.png`),
        fullPage: true,
      });
    }
    await page.getByRole("tab", { name: "Journey", exact: true }).focus();
    await page.keyboard.press("ArrowLeft");
    await expect(
      page.getByRole("tab", { name: "Economy", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("heading", { name: "Financial Dashboard" }),
    ).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test("compact header and objective do not overflow at 320px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open my lab" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(page.getByTestId("run-goal")).toBeVisible();
});

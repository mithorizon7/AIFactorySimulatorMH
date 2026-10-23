import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function openLab(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Open my lab" }).click();
  await expect(page.getByTestId("button-start-game")).toBeFocused();
}

async function assertReflowAndTargets(page: Page) {
  const defects = await page.evaluate(() => {
    const small = [
      ...document.querySelectorAll<HTMLElement>(
        'main button, main input, main summary, main a[href], main [role="tab"]',
      ),
    ]
      .filter(
        (element) =>
          element.getClientRects().length &&
          getComputedStyle(element).visibility !== "hidden",
      )
      .map((element) => ({
        name:
          element.getAttribute("aria-label") ??
          element.textContent?.trim().slice(0, 70),
        width: element.getBoundingClientRect().width,
        height: element.getBoundingClientRect().height,
      }))
      .filter((rect) => rect.width < 43.9 || rect.height < 43.9);
    return {
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      small,
    };
  });
  expect(defects).toEqual({ overflow: false, small: [] });
}

test("keyboard skip, dialog containment and focus restoration remain usable", async ({
  page,
}) => {
  await page.goto("/");
  const welcome = page.getByRole("dialog");
  await expect(welcome).toBeVisible();
  for (let step = 0; step < 8; step++) {
    await page.keyboard.press("Tab");
    expect(
      await welcome.evaluate((element) =>
        element.contains(document.activeElement),
      ),
    ).toBe(true);
  }
  await page.getByRole("button", { name: "Open my lab" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("button-start-game")).toBeFocused();
  const skip = page.getByRole("link", { name: "Skip to lab content" });
  await expect(skip).not.toBeInViewport();
  await skip.focus();
  await expect(skip).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("main", { name: "AI Factory lab" }),
  ).toBeFocused();
  const reset = page.getByRole("button", { name: "Reset", exact: true });
  await reset.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  for (let step = 0; step < 6; step++) {
    await page.keyboard.press(step % 2 ? "Shift+Tab" : "Tab");
    expect(
      await dialog.evaluate((element) =>
        element.contains(document.activeElement),
      ),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(reset).toBeFocused();
});

test("all lab surfaces reflow at 100%, 200% and 400% desktop-equivalent widths with 44px targets", async ({
  page,
}, testInfo) => {
  await openLab(page);
  // 1280px desktop / 2 / 4 models browser zoom's effective CSS layout viewport.
  // This is reflow evidence, not a claim that OS browser-chrome zoom was automated.
  for (const width of [1280, 640, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const tab of [
      "Dashboard",
      "Training",
      "Resources",
      "Economy",
      "Journey",
    ]) {
      await page.getByRole("tab", { name: tab, exact: true }).click();
      await assertReflowAndTargets(page);
      if (tab === "Resources") {
        const views = page.getByRole("tablist", {
          name: "Resource synergy views",
        });
        for (const name of [
          "Model Capability",
          "Compute",
          "Data",
          "Algorithm",
        ]) {
          await views.getByRole("tab", { name, exact: true }).click();
          await assertReflowAndTargets(page);
        }
        if (width === 320)
          await page.screenshot({
            path: testInfo.outputPath("resources-400-percent-equivalent.png"),
            fullPage: true,
          });
      }
    }
  }
  await page.getByRole("tab", { name: "Journey", exact: true }).click();
  await page.getByText("Sources and review", { exact: true }).first().click();
  await assertReflowAndTargets(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  await assertReflowAndTargets(page);
  await page.screenshot({
    path: testInfo.outputPath("journey-200-percent-text.png"),
    fullPage: true,
  });
});

test("narrow rendered surfaces have no serious or critical axe findings", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await openLab(page);
  for (const tab of [
    "Dashboard",
    "Training",
    "Resources",
    "Economy",
    "Journey",
  ]) {
    await page.getByRole("tab", { name: tab, exact: true }).click();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      results.violations
        .filter(
          (item) => item.impact === "serious" || item.impact === "critical",
        )
        .map((item) => ({
          id: item.id,
          targets: item.nodes.map((node) => node.target),
        })),
    ).toEqual([]);
  }
});

test("startup fetches no lazy character graph and Spark uses expression-free motion-aware SVG", async ({
  page,
}, testInfo) => {
  const scripts: string[] = [];
  const errors: string[] = [];
  page.on("response", (response) => {
    if (response.request().resourceType() === "script")
      scripts.push(response.url());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openLab(page);
  await page.waitForLoadState("networkidle");
  expect(scripts.some((url) => /SparkTest|lottie/i.test(url))).toBe(false);
  await testInfo.attach("initial-script-requests", {
    body: JSON.stringify(scripts, null, 2),
    contentType: "application/json",
  });
  await page.goto("/spark-test");
  const svg = page.locator('[data-spark-animation="light-svg"] svg').first();
  await expect(svg).toBeVisible();
  await page.waitForTimeout(150);
  const before = await svg.evaluate((element) => element.outerHTML);
  await page.waitForTimeout(250);
  expect(await svg.evaluate((element) => element.outerHTML)).toBe(before);
  expect(scripts.some((url) => /lottie_light/.test(url))).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath("spark-reduced-motion.png"),
    fullPage: true,
  });
});

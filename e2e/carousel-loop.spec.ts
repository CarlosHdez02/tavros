import { expect, test, type Page } from "@playwright/test";

/** Minimal API payload: 4 slides, 1s each — full loop in seconds for E2E */
function mockCarouselPayload() {
  const all = [
    {
      id: 1,
      type: "table",
      title: "T1",
      description: "",
      youtubeLink: null,
      durationSeconds: 1,
    },
    {
      id: 2,
      type: "video",
      title: "V1",
      description: "",
      youtubeLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      durationSeconds: 1,
    },
    {
      id: 3,
      type: "video",
      title: "V2",
      description: "",
      youtubeLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      durationSeconds: 1,
    },
    {
      id: 4,
      type: "table",
      title: "T2",
      description: "",
      youtubeLink: null,
      durationSeconds: 1,
    },
  ];
  return {
    success: true,
    data: {
      table: all.filter((r) => r.type === "table"),
      videos: all.filter((r) => r.type === "video"),
      gallery: [] as unknown[],
      all,
    },
  };
}

async function assertNoNaNUndefinedInDom(page: Page) {
  const bodyText = await page.locator("body").innerText();
  expect(bodyText, "DOM must not expose NaN").not.toMatch(/\bNaN\b/);
  expect(bodyText, "DOM must not expose undefined").not.toMatch(/\bundefined\b/);
}

async function assertCarouselIndexIsValid(page: Page) {
  const root = page.getByTestId("carousel-root");
  const lenStr = await root.getAttribute("data-carousel-length");
  const idxStr = await root.getAttribute("data-carousel-index");
  expect(lenStr, "data-carousel-length must be present").toBeTruthy();
  expect(idxStr, "data-carousel-index must be present").toBeTruthy();
  expect(Number.isNaN(Number(lenStr))).toBe(false);
  expect(Number.isNaN(Number(idxStr))).toBe(false);
  const len = Number(lenStr);
  const idx = Number(idxStr);
  expect(len).toBeGreaterThan(0);
  expect(idx).toBeGreaterThanOrEqual(0);
  expect(idx).toBeLessThan(len);
}

test.describe("Carousel loop — zero-crash E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/videos", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockCarouselPayload()),
      });
    });
  });

  test("navigates full list and cycles last → first index (0-based) without crash", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });

    await page.goto("/");

    await page.getByTestId("carousel-root").waitFor({ state: "visible", timeout: 30_000 });
    await assertCarouselIndexIsValid(page);
    await assertNoNaNUndefinedInDom(page);

    const root = page.getByTestId("carousel-root");
    const next = page.getByRole("button", { name: "Next slide" });

    const len = Number(await root.getAttribute("data-carousel-length"));
    expect(len).toBe(4);

    await expect(root).toHaveAttribute("data-carousel-index", "0");

    for (let step = 0; step < len; step++) {
      await assertCarouselIndexIsValid(page);
      await assertNoNaNUndefinedInDom(page);
      if (step < len - 1) {
        await next.click();
      }
    }

    await expect(root).toHaveAttribute("data-carousel-index", String(len - 1));

    // Cyclic: next from last → first slide (index 0)
    await next.click();
    await expect(root).toHaveAttribute("data-carousel-index", "0");
    await assertCarouselIndexIsValid(page);
    await assertNoNaNUndefinedInDom(page);

    for (let step = 0; step < len; step++) {
      await assertCarouselIndexIsValid(page);
      if (step < len - 1) await next.click();
    }
    await expect(root).toHaveAttribute("data-carousel-index", String(len - 1));
    await next.click();
    await expect(root).toHaveAttribute("data-carousel-index", "0");

    expect(pageErrors, "No uncaught page errors").toEqual([]);
  });

  test("Previous from first wraps to last index", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("carousel-root").waitFor({ state: "visible", timeout: 30_000 });

    const root = page.getByTestId("carousel-root");
    const prev = page.getByRole("button", { name: "Previous slide" });
    const len = Number(await root.getAttribute("data-carousel-length"));

    await expect(root).toHaveAttribute("data-carousel-index", "0");
    await prev.click();
    await expect(root).toHaveAttribute("data-carousel-index", String(len - 1));
    await assertCarouselIndexIsValid(page);
  });
});

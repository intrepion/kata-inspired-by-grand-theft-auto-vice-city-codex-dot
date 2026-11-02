"use strict";
const { chromium } = require("playwright");
const { mkdir, readFile, writeFile, readdir } = require("node:fs/promises");
const { createHash } = require("node:crypto");
const path = require("node:path");
(async () => {
  const output = process.env.CAPTURE_OUTPUT || "/tmp/harbor-captures",
    site = process.env.CAPTURE_SITE || "capture-site";
  await mkdir(output, { recursive: true });
  const inputs = {};
  for (const f of [
    "index.html",
    ...(await readdir(path.join(site, "assets"))).map((x) => "assets/" + x),
  ])
    inputs[f] = createHash("sha256")
      .update(await readFile(path.join(site, f)))
      .digest("hex");
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.LOCAL_CHROME
      ? { executablePath: process.env.LOCAL_CHROME }
      : {}),
    args: [
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 1000 },
      deviceScaleFactor: 1,
      locale: "en-US",
      reducedMotion: "reduce",
    });
    await page.goto("http://127.0.0.1:4281/", {
      waitUntil: "domcontentloaded",
    });
    await page.getByRole("button", { name: /STEP INTO THE STREETS/ }).click();
    await page.keyboard.down("w");
    await page.waitForFunction(
      () =>
        Number(
          document.querySelector("#proximity")?.textContent?.match(/\d+/)?.[0],
        ) <= 2,
      null,
      { timeout: 60000 },
    );
    await page.keyboard.up("w");
    await page.keyboard.press("e");
    await page
      .getByText("02 / CLEAR THE YARD", { exact: true })
      .waitFor({ timeout: 20000 });
    await page.screenshot({
      path: path.join(output, "harbor-01.png"),
      animations: "disabled",
      timeout: 120000,
    });
    await page.keyboard.down("w");
    await page.waitForFunction(
      () =>
        Number(
          document.querySelector("#proximity")?.textContent?.match(/\d+/)?.[0],
        ) <= 29,
      null,
      { timeout: 60000 },
    );
    await page.keyboard.up("w");
    await page.keyboard.down("l");
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(output, "harbor-02.png"),
      animations: "disabled",
      timeout: 120000,
    });
    await page.keyboard.up("l");
    await writeFile(
      path.join(output, "capture.json"),
      JSON.stringify(
        {
          schemaVersion: 1,
          workflowCommit: process.env.GITHUB_SHA || null,
          sourceCommit: process.env.GAME_SOURCE_COMMIT || null,
          runId: process.env.GITHUB_RUN_ID || null,
          url: "http://127.0.0.1:4281/",
          inputs,
          browser: browser.version(),
          viewport: { width: 1280, height: 1000 },
          screenshots: ["harbor-01.png", "harbor-02.png"],
        },
        null,
        2,
      ) + "\n",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

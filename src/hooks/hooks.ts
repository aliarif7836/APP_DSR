import {
  BeforeAll,
  Before,
  After,
  AfterAll,
  setDefaultTimeout,
  ITestCaseHookParameter,
} from '@cucumber/cucumber';
import { chromium, firefox, webkit, Browser } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { CustomWorld } from '../world/custom-world';
import { config } from '../config/env';

setDefaultTimeout(60 * 1000);

let browser: Browser;

const launchers = { chromium, firefox, webkit };

BeforeAll(async () => {
  browser = await launchers[config.browser].launch({ headless: config.headless });
});

Before(async function (this: CustomWorld) {
  this.browser = browser;
  // baseURL comes from .env, so page.goto('/') resolves against it everywhere.
  this.context = await browser.newContext({
    baseURL: config.baseUrl,
    viewport: config.viewport,
  });
  this.page = await this.context.newPage();
});

After(async function (this: CustomWorld, scenario: ITestCaseHookParameter) {
  // Screenshot EVERY scenario (pass or fail): embedded in the HTML report
  // AND saved as a dated .png under screenshots/ so runs can be reviewed
  // without opening the report — the script runs too fast to watch live.
  if (this.page) {
    try {
      const image = await this.page.screenshot({ fullPage: true });
      this.attach(image, 'image/png');

      const status = (scenario.result?.status || 'unknown').toLowerCase();
      const name = scenario.pickle.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      const stamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace('T', '_')
        .replace(/:/g, '-');
      mkdirSync('screenshots', { recursive: true });
      writeFileSync(join('screenshots', `${stamp}_${name}_${status}.png`), image);
    } catch {
      // Page may already be closed; skip screenshot
    }
  }
  await this.page?.close().catch(() => {});
  await this.context?.close().catch(() => {});
});

AfterAll(async () => {
  await browser?.close();
});

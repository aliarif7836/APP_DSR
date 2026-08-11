import { World, IWorldOptions, setWorldConstructor } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DsrPage } from '../pages/DsrPage';

/**
 * The World is the per-scenario `this` context. It carries the Playwright
 * browser/context/page plus a cache of page objects — same pattern as the
 * PVR suite.
 */
export class CustomWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;

  // Page-object cache (populated lazily inside the step definitions)
  loginPage!: LoginPage;
  dsrPage!: DsrPage;

  constructor(options: IWorldOptions) {
    super(options);
  }
}

setWorldConstructor(CustomWorld);

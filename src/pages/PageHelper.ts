import { Page } from '@playwright/test';

/**
 * Base class every page object extends: a thin, reusable wrapper around
 * common Playwright actions so the page objects stay readable.
 */
export class PageHelper {
  constructor(protected page: Page) {}

  async goto(path = '/'): Promise<void> {
    // Relative path resolves against baseURL from .env
    await this.page.goto(path);
  }

  async waitForSelector(selector: string, timeout = 5000): Promise<void> {
    await this.page.waitForSelector(selector, { timeout });
  }

  async click(selector: string): Promise<void> {
    await this.page.click(selector);
  }

  async fill(selector: string, value: string): Promise<void> {
    await this.page.fill(selector, value);
  }

  async getText(selector: string): Promise<string> {
    return (await this.page.locator(selector).textContent()) || '';
  }

  async isVisible(selector: string): Promise<boolean> {
    return this.page.locator(selector).isVisible();
  }
}

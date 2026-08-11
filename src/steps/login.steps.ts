import { Given, When, Then } from '@cucumber/cucumber';
import { CustomWorld } from '../world/custom-world';
import { LoginPage } from '../pages/LoginPage';
import { config } from '../config/env';

Given('User is on the dashboard login page', async function (this: CustomWorld) {
  this.loginPage = new LoginPage(this.page);
  await this.loginPage.navigate();
  await this.loginPage.assertLoginPageVisible();
});

When(
  'User logs in with credentials from env',
  async function (this: CustomWorld) {
    // Credentials come from .env (ADMIN_EMAIL / ADMIN_PASSWORD) so they can
    // be rotated without touching code.
    await this.loginPage.login(config.adminEmail, config.adminPassword);
  }
);

When(
  'User logs in with email {string} and password {string}',
  async function (this: CustomWorld, email: string, password: string) {
    await this.loginPage.login(email, password);
  }
);

Then('User should land on the admin dashboard', async function (this: CustomWorld) {
  await this.loginPage.assertLoggedIn();
});

/**
 * Composite step used as Background by other features (e.g. DSR):
 * navigate + login + verify in one line.
 */
Given('User is logged in to the dashboard', async function (this: CustomWorld) {
  this.loginPage = new LoginPage(this.page);
  await this.loginPage.navigate();
  await this.loginPage.login(config.adminEmail, config.adminPassword);
  await this.loginPage.assertLoggedIn();
});

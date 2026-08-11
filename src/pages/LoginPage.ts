import { expect } from '@playwright/test';
import { PageHelper } from './PageHelper';

/**
 * Login page of the Appinventiv HR dashboard.
 *
 * Verified against the live site (2026-07-30):
 *  - The credentials form (#hrm-form) is HIDDEN by default; you must click
 *    the "Login with Credentials" button (.credLoginBtn) to reveal it.
 *  - Email input:    #iusername
 *  - Password input: #ipassword
 *  - Submit button:  #hrm-form button[type="submit"] (text "Login")
 */
export class LoginPage extends PageHelper {
  private elements = {
    credLoginToggle: 'button.credLoginBtn',
    loginForm: '#hrm-form',
    emailInput: '#iusername',
    passwordInput: '#ipassword',
    loginButton: '#hrm-form button[type="submit"]',
    forgotPasswordLink: 'a:has-text("Forgot password?")',
  };

  /** Open the site; unauthenticated users land on the login screen. */
  async navigate(): Promise<void> {
    await this.goto('/admin/dashboard');
    await this.page.waitForLoadState('domcontentloaded');
    await this.autoDismissProfilePopup();
  }

  /**
   * The "Update Your Experience" reminder pops up on every fresh session
   * (each test run uses a clean browser context, so the site never remembers
   * a dismissal). This handler clicks "Maybe Later" WHENEVER the popup
   * appears — Playwright checks for it automatically before each action.
   */
  private async autoDismissProfilePopup(): Promise<void> {
    const popupTitle = this.page.getByText('Update Your Experience');
    await this.page.addLocatorHandler(popupTitle, async () => {
      await this.page
        .locator('button:has-text("Maybe Later"), a:has-text("Maybe Later"), input[value="Maybe Later"]')
        .first()
        .click();
    });
  }

  /** Reveal the email/password form (hidden behind the toggle button). */
  async openCredentialsForm(): Promise<void> {
    const form = this.page.locator(this.elements.loginForm);
    if (!(await form.isVisible())) {
      await this.click(this.elements.credLoginToggle);
      await expect(form).toBeVisible();
    }
  }

  async login(email: string, password: string): Promise<void> {
    await this.openCredentialsForm();
    await this.fill(this.elements.emailInput, email);
    await this.fill(this.elements.passwordInput, password);
    await this.click(this.elements.loginButton);
  }

  /** Successful login redirects to /admin/dashboard. */
  async assertLoggedIn(): Promise<void> {
    // waitUntil: 'domcontentloaded' — the dashboard keeps loading widgets for
    // a long time, so waiting for the full 'load' event times out even though
    // login succeeded. DOM-ready is enough to continue.
    await this.page.waitForURL('**/admin/dashboard**', {
      timeout: 30000,
      waitUntil: 'domcontentloaded',
    });
  }

  async assertLoginPageVisible(): Promise<void> {
    await expect(this.page.locator(this.elements.credLoginToggle)).toBeVisible();
  }
}

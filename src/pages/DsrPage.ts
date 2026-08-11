import { expect } from '@playwright/test';
import { PageHelper } from './PageHelper';

/**
 * DSR (Daily Status Report) section: side menu "DSR" -> "My DSR" -> "+Add".
 *
 * IMPORTANT: the selectors below are text-based BEST GUESSES — the DSR pages
 * sit behind login, so they could not be inspected directly. If a click
 * fails, log in manually, open DevTools on the side menu / My DSR page and
 * replace these with the real ids/classes (prefer an id or stable class).
 */
export class DsrPage extends PageHelper {
  private elements = {
    // The "DSR" item in the left side menu (may be a collapsible parent).
    // TODO: confirm against the live DOM after login.
    dsrMenu: 'aside a:has-text("DSR"), .sidebar a:has-text("DSR"), nav a:has-text("DSR"), li:has-text("DSR") > a',
    // The "My DSR" sub-menu entry revealed after expanding DSR.
    // TODO: confirm against the live DOM after login.
    myDsrMenu: 'a:has-text("My DSR")',
    // The "+Add" button on the My DSR page.
    // TODO: confirm against the live DOM after login.
    addButton: 'a:has-text("+Add"), a:has-text("+ Add"), button:has-text("+Add"), button:has-text("+ Add"), a:has-text("Add"), button:has-text("Add")',
    // Something that proves the Add form/modal opened (heading, form, modal).
    // TODO: replace with the real form/modal selector.
    addFormMarker: '.modal.show, form, h1:has-text("Add"), h2:has-text("Add"), h3:has-text("Add")',
  };

  /** Expand the DSR menu in the sidebar. */
  async openDsrMenu(): Promise<void> {
    await this.page.locator(this.elements.dsrMenu).first().click();
  }

  /** Click "My DSR" and wait for the page to settle. */
  async openMyDsr(): Promise<void> {
    await this.page.locator(this.elements.myDsrMenu).first().click();
    // 'networkidle' can hang forever on dashboards that poll APIs constantly;
    // DOM-ready is enough before looking for the +Add button.
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Click the +Add button to open the new-DSR form. */
  async clickAdd(): Promise<void> {
    await this.page.locator(this.elements.addButton).first().click();
  }

  /** Assert that the Add DSR form/modal is visible. */
  async assertAddFormVisible(): Promise<void> {
    await expect(this.page.locator(this.elements.addFormMarker).first()).toBeVisible({
      timeout: 10000,
    });
  }

  // ──────────────────────────────────────────────────────────────
  // "Create New DSR" form
  // Selectors are best guesses from the form screenshot — the page sits
  // behind login. If a step fails, Inspect the element and fix the selector.
  // ──────────────────────────────────────────────────────────────
  private formElements = {
    // Custom dropdown showing placeholder "Project". TODO: confirm.
    projectDropdown: '.select2-selection, [placeholder="Project"], .dropdown:has-text("Project"), div:has(> input[placeholder="Project"])',
    // An option in the opened dropdown list, by visible text.
    projectOption: (name: string) =>
      `.select2-results__option:has-text("${name}"), li:has-text("${name}"), [role="option"]:has-text("${name}")`,
    dateInput: 'input[placeholder="Date"]',
    // "Today" cell in common datepicker libraries (bootstrap, flatpickr,
    // material, or anything that sets aria-current="date").
    datepickerToday: '.datepicker td.today, .flatpickr-day.today, .day.today, td.today, .react-datepicker__day--today, [aria-current="date"], .mat-calendar-body-today',
    estimatedHourInput: 'input[placeholder="Estimated Hour"]',
    aiToolsYes: 'label:has-text("YES"), input[type="radio"][value="yes" i]',
    aiToolsNo: 'label:has-text("NO"), input[type="radio"][value="no" i]',
    // Rich-text editor body (Quill / Summernote / generic contenteditable).
    descriptionEditor: '.ql-editor, .note-editable, [contenteditable="true"]',
    // Bottom submit button — the solid blue "Add" under the form.
    // NOTE: the top-right "+ Add" also contains the word "Add", which is why
    // matching must be on the EXACT accessible name "Add", not a substring.
    submitButton: 'button[type="submit"], input[type="submit"]',
    submitButtonFallback: 'button:has-text("Add"), input[type="submit"][value="Add" i], a:has-text("Add")',
  };

  /** Today's date as DD-MM-YYYY. TODO: adjust if the site expects another format. */
  private todayString(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
  }

  /** Open the Project dropdown and pick the given project by name. */
  async selectProject(name: string): Promise<void> {
    await this.page.locator(this.formElements.projectDropdown).first().click();
    await this.page.locator(this.formElements.projectOption(name)).first().click();
  }

  /**
   * Select today's date. Layered strategy:
   *  1. Click the input to open the datepicker.
   *  2. Click a cell explicitly marked "today" by the library.
   *  3. Else click the cell whose text equals today's day number
   *     (skipping prev/next-month spillover cells).
   *  4. Else force the value via JS (input is readonly).
   *  5. Verify the input actually holds a value — fail loudly if not.
   */
  async selectTodayDate(): Promise<void> {
    const input = this.page.locator(this.formElements.dateInput).first();
    await input.click();

    // Strategy 1: a cell the library itself marks as "today"
    const todayCell = this.page.locator(this.formElements.datepickerToday).first();
    let picked = false;
    try {
      await todayCell.waitFor({ state: 'visible', timeout: 3000 });
      await todayCell.click();
      picked = true;
    } catch {
      /* fall through to strategy 2 */
    }

    // Strategy 2: any visible calendar cell showing today's day number.
    // :not(.old)/:not(.new) etc. skip the greyed prev/next-month cells that
    // repeat the same number.
    if (!picked) {
      const dayNum = String(new Date().getDate());
      const genericCell = this.page
        .locator(
          'td.day:not(.old):not(.new), .flatpickr-day:not(.prevMonthDay):not(.nextMonthDay), [class*="calendar"] td:not(.old):not(.new), [class*="datepicker"] td:not(.old):not(.new)'
        )
        .filter({ hasText: new RegExp(`^${dayNum}$`) })
        .first();
      if (await genericCell.isVisible().catch(() => false)) {
        await genericCell.click();
        picked = true;
      }
    }

    // Strategy 3: force the value (readonly input) and hope the app reads it.
    if (!picked) {
      await input.evaluate((node: HTMLInputElement, dateString: string) => {
        node.value = dateString;
        node.dispatchEvent(new Event('input', { bubbles: true }));
        node.dispatchEvent(new Event('change', { bubbles: true }));
      }, this.todayString());
      await this.page.keyboard.press('Escape'); // close any open picker
    }

    // Verify: did ANY of the strategies land a value in the field?
    const value = (await input.inputValue().catch(() => '')) || '';
    if (!value.trim()) {
      throw new Error(
        'Date was NOT selected — none of the datepicker strategies matched this site.\n' +
          'To fix: open the form manually, click the Date field, right-click the ' +
          'calendar that opens -> Inspect -> copy its HTML, and share it so the ' +
          'real "today" selector can be added to DsrPage.formElements.datepickerToday.'
      );
    }
  }

  async fillEstimatedHours(hours: string): Promise<void> {
    const input = this.page.locator(this.formElements.estimatedHourInput).first();
    // Use evaluate since the input is marked readonly
    await input.evaluate((node: HTMLInputElement, val: string) => {
      node.value = val;
      node.dispatchEvent(new Event('input', { bubbles: true }));
      node.dispatchEvent(new Event('change', { bubbles: true }));
    }, hours);
  }

  async answerAiToolsQuestion(usedAiTools: boolean): Promise<void> {
    const selector = usedAiTools ? this.formElements.aiToolsYes : this.formElements.aiToolsNo;
    await this.page.locator(selector).first().click();
  }

  /**
   * Type the description into the rich-text editor.
   *
   * WHY NOT .fill(): on a contenteditable, fill() writes the text straight
   * into the DOM. The pixels look right, but the app never sees a real
   * keystroke, so its own state / hidden input stays empty — and validation
   * then rejects the form with "The description must contain at least 50
   * characters" even though the box is visibly full of text.
   *
   * pressSequentially sends genuine key events, which the editor's change
   * handlers pick up. Blurring afterwards flushes the value to the form.
   */
  async fillDescription(text: string): Promise<void> {
    const editor = this.page.locator(this.formElements.descriptionEditor).first();
    await editor.click();

    // Clear anything already there (re-runs, autosaved drafts).
    await this.page.keyboard.press('Control+A');
    await this.page.keyboard.press('Delete');

    await editor.pressSequentially(text, { delay: 5 });

    // Blur so the editor fires change/blur and syncs to the underlying field.
    await this.page.keyboard.press('Tab');
    await this.page.waitForTimeout(300);

    // Verify the text really landed — fail here with a clear reason rather
    // than letting the site reject the submit with a confusing message.
    const typed = (await editor.innerText().catch(() => '')).trim();
    if (typed.length < 50) {
      throw new Error(
        `Description did not reach the editor (only ${typed.length} characters ` +
          `registered, the site requires 50+).\n` +
          `The editor selector may be pointing at the wrong element: ` +
          `${this.formElements.descriptionEditor}`
      );
    }
  }

  /** Fill every field of the Create New DSR form in one go. */
  async fillDsrForm(data: {
    project: string;
    estimatedHours: string;
    usedAiTools: boolean;
    description: string;
  }): Promise<void> {
    await this.selectProject(data.project);
    await this.selectTodayDate();
    await this.fillEstimatedHours(data.estimatedHours);
    await this.answerAiToolsQuestion(data.usedAiTools);
    await this.fillDescription(data.description);
  }

  /**
   * Click the bottom blue "Add" (submit) button of the Create New DSR form.
   *
   * The tricky part is that the page has TWO things saying "Add":
   *   - the outlined "+ Add" at the top right (opens/collapses the form)
   *   - the solid blue "Add" at the bottom (actually submits)
   * A plain :has-text("Add") matches both, and the old .last() fallback could
   * land on neither. So candidates are tried in order of confidence, matching
   * on the EXACT accessible name where possible.
   */
  private submitCandidates() {
    return [
      // 1. A real submit control inside the form.
      this.page.locator(`form ${this.formElements.submitButton}`),
      // 2. Any submit control on the page.
      this.page.locator(this.formElements.submitButton),
      // 3. Button whose accessible name is exactly "Add" — "+ Add" won't match.
      this.page.getByRole('button', { name: /^\s*Add\s*$/ }),
      // 4. Last resort: any "Add"-ish control, last one on the page.
      this.page.locator(this.formElements.submitButtonFallback).last(),
    ];
  }

  async submitDsrForm(): Promise<void> {
    for (const candidate of this.submitCandidates()) {
      const button = candidate.first();

      // Must exist AND be visible — an off-screen button still needs scrolling.
      if (!(await button.count().catch(() => 0))) continue;
      await button.scrollIntoViewIfNeeded().catch(() => {});
      if (!(await button.isVisible().catch(() => false))) continue;
      if (!(await button.isEnabled().catch(() => false))) continue;

      try {
        await button.click({ timeout: 5000 });
      } catch {
        // Overlay/animation intercepted the click — go straight at the element.
        await button.click({ force: true, timeout: 5000 }).catch(async () => {
          await button.evaluate((node: HTMLElement) => node.click());
        });
      }

      // Give the app a moment to POST and re-render.
      await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      await this.page.waitForTimeout(1500);

      if (await this.isSubmitted()) return;
      // Otherwise fall through and try the next candidate.
    }

    throw new Error(
      'Could not submit the DSR form — the blue "Add" button was never ' +
        'successfully clicked, or the form did not clear afterwards.\n' +
        'To fix: open the form manually, right-click the blue Add button -> ' +
        'Inspect, and paste its HTML so an exact selector can replace ' +
        'DsrPage.formElements.submitButton.'
    );
  }

  /**
   * Did the submit actually go through? After a successful save the app
   * resets the form, so an empty description editor is the signal. A visible
   * success toast counts too, in case the form is left populated.
   */
  private async isSubmitted(): Promise<boolean> {
    const toast = this.page.locator(
      '.toast, .swal2-popup, .alert-success, [class*="toast"], [role="alert"]'
    );
    if (await toast.first().isVisible().catch(() => false)) return true;

    const editorText = await this.page
      .locator(this.formElements.descriptionEditor)
      .first()
      .innerText()
      .catch(() => 'unknown');
    return editorText.trim() === '';
  }
}

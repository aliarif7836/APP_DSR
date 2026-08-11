import { When, Then } from '@cucumber/cucumber';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { CustomWorld } from '../world/custom-world';
import { DsrPage } from '../pages/DsrPage';
import { config } from '../config/env';

/**
 * Read today's DSR text from the description file (dsr-description.txt).
 * Lines starting with # are treated as comments and skipped, so the file
 * can carry instructions for whoever edits it each morning.
 */
function readDsrDescription(): string {
  const filePath = resolve(process.cwd(), config.dsr.descriptionFile);
  let raw: string;
  try {
    raw = readFileSync(filePath, 'utf-8');
  } catch {
    throw new Error(
      `DSR description file not found: ${filePath}\n` +
        `Create it and write today's work points inside (see .env DSR_DESCRIPTION_FILE).`
    );
  }
  const text = raw
    .split('\n')
    .filter((line) => !line.trim().startsWith('#'))
    .join('\n')
    .trim();
  if (!text) {
    throw new Error(
      `Your DSR description is empty! Open ${config.dsr.descriptionFile} ` +
        `and write what you worked on today, then re-run.`
    );
  }
  return text;
}

When('User clicks on DSR in the side menu', async function (this: CustomWorld) {
  this.dsrPage = new DsrPage(this.page);
  await this.dsrPage.openDsrMenu();
});

When('User clicks on My DSR', async function (this: CustomWorld) {
  await this.dsrPage.openMyDsr();
});

When('User clicks on the Add button', async function (this: CustomWorld) {
  await this.dsrPage.clickAdd();
});

Then('The Add DSR form should be visible', async function (this: CustomWorld) {
  await this.dsrPage.assertAddFormVisible();
});

When("User fills today's DSR form", async function (this: CustomWorld) {
  // Project / hours / AI answer come from .env; description from the
  // daily-edited text file. Nothing is hardcoded here.
  await this.dsrPage.fillDsrForm({
    project: config.dsr.project,
    estimatedHours: config.dsr.estimatedHours,
    usedAiTools: config.dsr.usedAiTools,
    description: readDsrDescription(),
  });
});

When('User submits the DSR form', async function (this: CustomWorld) {
  await this.dsrPage.submitDsrForm();
});

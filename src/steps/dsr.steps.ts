import { When, Then } from '@cucumber/cucumber';
import { CustomWorld } from '../world/custom-world';
import { DsrPage } from '../pages/DsrPage';
import { config, readDsrDescription } from '../config/env';

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

import * as dotenv from 'dotenv';

dotenv.config();

export type BrowserName = 'chromium' | 'firefox' | 'webkit';

export const config = {
  // The base URL is read once here and reused across every page object,
  // so switching environments is a one-line change in .env.
  baseUrl: process.env.BASE_URL || 'https://dashboard.appinventiv.com',
  adminEmail: process.env.ADMIN_EMAIL || 'arif.ali@appinventiv.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'Aa@9716219442',
  // DSR form values — change these in .env whenever your project/hours change.
  dsr: {
    project: process.env.DSR_PROJECT || 'Whataburger',
    estimatedHours: process.env.DSR_ESTIMATED_HOURS || '8:30',
    usedAiTools: (process.env.DSR_USED_AI_TOOLS || 'yes').toLowerCase() === 'yes',
    descriptionFile: process.env.DSR_DESCRIPTION_FILE || 'dsr-description.txt',
  },
  browser: (process.env.BROWSER || 'chromium') as BrowserName,
  headless: process.env.HEADLESS !== 'false',
  viewport: {
    width: parseInt(process.env.VIEWPORT_WIDTH || '1920', 10),
    height: parseInt(process.env.VIEWPORT_HEIGHT || '1080', 10),
  },
};

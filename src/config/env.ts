import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';

dotenv.config();

export type BrowserName = 'chromium' | 'firefox' | 'webkit';

/**
 * Read a required setting. Credentials are NEVER hardcoded here — in local
 * runs they come from `.env` (gitignored), in CI from GitHub repository
 * secrets. Missing values fail loudly at startup rather than half-way
 * through a browser session.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
        `  • Local run: copy .env.example to .env and fill it in.\n` +
        `  • CI run:    add ${name} as a GitHub repository secret.`
    );
  }
  return value.trim();
}

/**
 * Today's DSR text. Two sources, in priority order:
 *   1. DSR_DESCRIPTION env var  — used by CI / manual workflow_dispatch.
 *   2. dsr-description.txt file — used for local runs, edited each morning.
 * Lines starting with # are comments and are stripped from both.
 */
export function readDsrDescription(): string {
  const inline = process.env.DSR_DESCRIPTION;
  const raw = inline && inline.trim() ? inline : readDescriptionFile();

  const text = raw
    .split('\n')
    .filter((line) => !line.trim().startsWith('#'))
    .join('\n')
    .trim();

  if (!text) {
    throw new Error(
      `Your DSR description is empty. Either set the DSR_DESCRIPTION ` +
        `environment variable, or write today's work points into ` +
        `${config.dsr.descriptionFile}.`
    );
  }
  if (text.length < 50) {
    throw new Error(
      `DSR description is only ${text.length} characters — the site requires 50+.`
    );
  }
  return text;
}

function readDescriptionFile(): string {
  const filePath = resolve(process.cwd(), config.dsr.descriptionFile);
  try {
    return readFileSync(filePath, 'utf-8');
  } catch {
    throw new Error(
      `DSR description file not found: ${filePath}\n` +
        `Create it and write today's work points inside, or set DSR_DESCRIPTION.`
    );
  }
}

export const config = {
  // The base URL is read once here and reused across every page object,
  // so switching environments is a one-line change in .env.
  baseUrl: process.env.BASE_URL || 'https://dashboard.appinventiv.com',
  // Getters, not values: a missing secret should fail when a run actually
  // tries to log in — not at import time, which would also break `npm run dry`
  // and any tooling that merely loads this module.
  get adminEmail(): string {
    return required('ADMIN_EMAIL');
  },
  get adminPassword(): string {
    return required('ADMIN_PASSWORD');
  },
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

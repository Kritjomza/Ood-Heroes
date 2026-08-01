import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

test.describe('Phase 4 persistent player journey', () => {
  test.skip(!process.env.SUPABASE_URL, 'Requires the local Supabase environment.');

  test('creates a Guest, restores progression, and exposes all collection screens', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Odd Tower' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Play as Guest' })).toBeVisible();
    await capture(page, test.info().project.name, '01-auth');
    await page.getByLabel('Hero name').fill(`Odd E2E ${Date.now().toString().slice(-5)}`);
    await page.getByRole('button', { name: 'Play as Guest' }).click();
    await expect(page.getByRole('heading', { name: /Odd E2E/u })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByLabel('Currencies').getByText(/300$/u)).toBeVisible();
    await capture(page, test.info().project.name, '02-home');

    await page.getByRole('button', { name: /Collection/u }).click();
    await expect(page.getByRole('heading', { name: 'Hero Collection' })).toBeVisible();
    await expect(page.getByRole('button', { name: /, owned$/u })).toHaveCount(1);
    await capture(page, test.info().project.name, '03-collection');
    await page.getByRole('button', { name: 'Back' }).click();

    await page.getByRole('button', { name: /Summon/u }).click();
    await capture(page, test.info().project.name, '04-summon');
    await page
      .getByRole('button', { name: /Summon/u })
      .first()
      .click();
    await expect(page.getByText(/A new Hero joined|Duplicate/u)).toBeVisible({ timeout: 10_000 });
    await capture(page, test.info().project.name, '05-summon-result');
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByLabel('Currencies').getByText(/200$/u)).toBeVisible();

    await page.reload();
    await expect(page.getByLabel('Currencies').getByText(/200$/u)).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole('button', { name: /Team/u }).click();
    await expect(page.getByRole('heading', { name: 'Team Builder' })).toBeVisible();
    await capture(page, test.info().project.name, '06-team');
  });

  test('creates, signs out, and signs back into a permanent account', async ({ page }) => {
    const stamp = `${Date.now()}-${test.info().project.name}`;
    const email = `odd-permanent-${stamp}@example.test`;
    const password = 'OddTower!42';
    const displayName = `Email ${Date.now().toString().slice(-5)}`;

    await page.goto('/');
    await page.getByRole('button', { name: 'Create account', exact: true }).click();
    await page.getByLabel('Hero name').fill(displayName);
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Create Account', exact: true }).click();
    await expect(page.getByRole('heading', { name: displayName })).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole('button', { name: /Account/u }).click();
    await expect(page.getByText('Progress is protected by your Supabase account.')).toBeVisible();
    await page.getByRole('button', { name: 'Sign Out' }).click();
    await expect(page.getByRole('heading', { name: 'Odd Tower' })).toBeVisible();

    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page.getByRole('heading', { name: displayName })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('protects a Guest without replacing progression', async ({ page }) => {
    const stamp = `${Date.now()}-${test.info().project.name}`;
    const email = `odd-upgrade-${stamp}@example.test`;
    const password = 'OddTower!42';
    const displayName = `Upgrade ${Date.now().toString().slice(-5)}`;

    await page.goto('/');
    await page.getByLabel('Hero name').fill(displayName);
    await page.getByRole('button', { name: 'Play as Guest' }).click();
    await expect(page.getByRole('heading', { name: displayName })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByLabel('Currencies').getByText(/300$/u)).toBeVisible();

    await page.getByRole('button', { name: /Account/u }).click();
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Protect Progress', exact: true }).click();
    await expect(page.getByText(/Progress is protected|Your progress stays attached/u)).toBeVisible(
      {
        timeout: 15_000,
      },
    );

    await page.reload();
    await expect(page.getByRole('heading', { name: displayName })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByLabel('Currencies').getByText(/300$/u)).toBeVisible();
    await page.getByRole('button', { name: /Collection/u }).click();
    await expect(page.getByRole('button', { name: /, owned$/u })).toHaveCount(1);
  });
});

async function capture(page: import('@playwright/test').Page, project: string, name: string) {
  if (process.env.CAPTURE_PHASE4 !== '1') return;
  await mkdir('docs/assets/mockup-screens', { recursive: true });
  await page.screenshot({
    path: `docs/assets/mockup-screens/${project}-${name}.png`,
    fullPage: true,
  });
}

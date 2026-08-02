import { expect, test, type Page } from '@playwright/test';

async function openLocalPrototype(page: Page) {
  const guest = page.getByRole('button', { name: 'Play as Guest' });
  if (await guest.isVisible()) await guest.click();
  await page.getByRole('button', { name: 'Play Local Prototype' }).click();
}

test('loads one playable canvas and supports keyboard and Auto Hunt override', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await openLocalPrototype(page);
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page.getByTestId('hud')).toBeVisible();
  await page.getByRole('button', { name: /auto hunt/i }).click();
  await expect(page.getByRole('button', { name: /auto hunt/i })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  if (testInfo.project.name === 'chromium') {
    const position = page.getByTestId('position');
    const before = await position.textContent();
    await page.keyboard.down('d');
    await expect.poll(() => position.textContent()).not.toBe(before);
    await page.keyboard.up('d');
    await expect(page.getByRole('button', { name: /auto hunt/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  }
  expect(errors).toEqual([]);
});
test('reload keeps one canvas and mobile controls avoid the primary actions', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await openLocalPrototype(page);
  await page.reload();
  await openLocalPrototype(page);
  await expect(page.locator('canvas')).toHaveCount(1);
  if (testInfo.project.name === 'mobile-landscape') {
    const joystick = page.getByLabel('Movement joystick'),
      actions = page.locator('.actions');
    await expect(joystick).toBeVisible();
    const j = await joystick.boundingBox(),
      a = await actions.boundingBox();
    expect(j && a).toBeTruthy();
    expect(j!.x + j!.width < a!.x).toBe(true);
  }
});

import { expect, test } from '@playwright/test';

async function openCombatLobby(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Online Shared Combat Sandbox' }).click();
}

test('online room renders the shared authoritative monster set and toggles server Auto Hunt', async ({
  page,
}) => {
  await openCombatLobby(page);
  await page.getByLabel('Display name').fill('Combatant');
  await page.getByRole('button', { name: 'Create Room' }).click();
  await expect(page.getByTestId('online-hud')).toBeVisible();
  await expect
    .poll(async () => Number(await page.locator('#game-root').getAttribute('data-monster-count')))
    .toBeGreaterThanOrEqual(34);
  await expect.poll(() => page.locator('#game-root').getAttribute('data-monster-ids')).not.toBe('');
  await page.getByRole('button', { name: 'Auto Hunt' }).click();
  await expect(page.getByRole('button', { name: 'Auto Hunt' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('button', { name: 'Auto Hunt' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('status', { name: 'Combat status' })).not.toContainText(
    'Manual control',
  );
});

test('two players observe the same monsters and both earn contribution rewards without Last Hit dependency', async ({
  browser,
}) => {
  test.setTimeout(90_000);
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();
  await openCombatLobby(pageA);
  await pageA.getByLabel('Display name').fill('Alpha');
  await pageA.getByRole('button', { name: 'Create Room' }).click();
  const roomText = await pageA.getByText(/^Room [A-Z2-9]{6}$/u).textContent();
  const roomCode = roomText!.replace('Room ', '');
  await openCombatLobby(pageB);
  await pageB.getByLabel('Display name').fill('Bravo');
  await pageB.getByLabel('Room code').fill(roomCode);
  await pageB.getByRole('button', { name: 'Join Room' }).click();
  await expect(pageA.getByTestId('player-count')).toHaveText('2 / 10');
  await expect
    .poll(() => pageA.locator('#game-root').getAttribute('data-monster-ids'))
    .not.toBe('');
  await expect
    .poll(() => pageB.locator('#game-root').getAttribute('data-monster-ids'))
    .not.toBe('');
  expect(await pageA.locator('#game-root').getAttribute('data-monster-ids')).toBe(
    await pageB.locator('#game-root').getAttribute('data-monster-ids'),
  );
  await pageA.getByRole('button', { name: 'Auto Hunt' }).click();
  await pageB.getByRole('button', { name: 'Auto Hunt' }).click();
  const gold = async (page: import('@playwright/test').Page) => {
    const value = await page
      .getByText(/Session Gold:/)
      .first()
      .textContent();
    return Number(value?.replace(/\D/gu, '') ?? 0);
  };
  await expect.poll(() => gold(pageA), { timeout: 45_000 }).toBeGreaterThan(0);
  await expect.poll(() => gold(pageB), { timeout: 45_000 }).toBeGreaterThan(0);
  await Promise.all([contextA.close(), contextB.close()]);
});

import { expect, test, type Page } from '@playwright/test';

async function openLobby(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Online Movement Sandbox' }).click();
  await expect(page.getByRole('heading', { name: 'Online Movement Sandbox' })).toBeVisible();
}

async function createRoom(page: Page, name: string) {
  await openLobby(page);
  await page.getByLabel('Display name').fill(name);
  await page.getByRole('button', { name: 'Create Room' }).click();
  await expect(page.getByTestId('online-hud')).toBeVisible();
  const text = await page.getByText(/^Room [A-Z2-9]{6}$/u).textContent();
  return text!.replace('Room ', '');
}

async function joinRoom(page: Page, name: string, code: string) {
  await openLobby(page);
  await page.getByLabel('Display name').fill(name);
  await page.getByLabel('Room code').fill(code);
  await page.getByRole('button', { name: 'Join Room' }).click();
  await expect(page.getByTestId('online-hud')).toBeVisible();
}

test('create/join, replicate movement, and isolate another room', async ({ browser }) => {
  test.setTimeout(120_000);
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const contextC = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();
  const pageC = await contextC.newPage();
  const errors: string[] = [];
  for (const page of [pageA, pageB, pageC])
    page.on('pageerror', (error) => errors.push(error.message));

  const code = await createRoom(pageA, 'Alpha');
  await joinRoom(pageB, 'Bravo', code);
  await expect(pageA.getByTestId('player-count')).toHaveText('2 / 10');
  await expect(pageB.getByTestId('player-count')).toHaveText('2 / 10');
  await expect.poll(() => pageA.locator('#game-root').getAttribute('data-remote-teams')).toBe('1');
  await expect.poll(() => pageB.locator('#game-root').getAttribute('data-remote-teams')).toBe('1');

  const localBefore = await pageA.locator('#game-root').getAttribute('data-local-position');
  const remoteBefore = await pageB.locator('#game-root').getAttribute('data-remote-positions');
  await pageA.keyboard.down('d');
  await expect
    .poll(() => pageA.locator('#game-root').getAttribute('data-local-position'))
    .not.toBe(localBefore);
  await expect
    .poll(() => pageB.locator('#game-root').getAttribute('data-remote-positions'))
    .not.toBe(remoteBefore);
  await pageA.keyboard.up('d');

  await pageB.keyboard.down('w');
  const seenByA = await pageA.locator('#game-root').getAttribute('data-remote-positions');
  await expect
    .poll(() => pageA.locator('#game-root').getAttribute('data-remote-positions'))
    .not.toBe(seenByA);
  await pageB.keyboard.up('w');

  await createRoom(pageC, 'Charlie');
  await expect(pageC.getByTestId('player-count')).toHaveText('1 / 10');
  await expect.poll(() => pageC.locator('#game-root').getAttribute('data-remote-teams')).toBe('0');
  await expect(pageA.getByTestId('player-count')).toHaveText('2 / 10');
  expect(errors).toEqual([]);
  await Promise.all([contextA.close(), contextB.close(), contextC.close()]);
});

test('unknown code is rejected without creating a room', async ({ page }) => {
  await openLobby(page);
  await page.getByLabel('Display name').fill('Lost');
  await page.getByLabel('Room code').fill('ZZZ999');
  await page.getByRole('button', { name: 'Join Room' }).click();
  await expect(page.getByRole('alert')).toContainText('could not be found');
  await expect(page.locator('canvas')).toHaveCount(0);
});

test('temporary network loss reconnects the same player without duplication', async ({
  browser,
}) => {
  test.setTimeout(90_000);
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();
  const code = await createRoom(pageA, 'Anchor');
  await joinRoom(pageB, 'Returner', code);
  await expect(pageA.getByTestId('player-count')).toHaveText('2 / 10');

  await contextB.setOffline(true);
  await expect(pageB.getByRole('status')).toContainText('Reconnecting');
  await contextB.setOffline(false);
  await expect(pageB.getByText('connected', { exact: true })).toBeVisible({ timeout: 12_000 });
  await expect(pageA.getByTestId('player-count')).toHaveText('2 / 10');
  await expect.poll(() => pageA.locator('#game-root').getAttribute('data-remote-teams')).toBe('1');
  await Promise.all([contextA.close(), contextB.close()]);
});

test('reload is lifecycle-safe and mobile controls do not overlap Leave Room', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await createRoom(page, 'Lifecycle');
  await expect(page.locator('canvas')).toHaveCount(1);
  const fps = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let frames = 0;
        const startedAt = performance.now();
        const frame = (now: number) => {
          frames += 1;
          if (now - startedAt >= 2_000) resolve((frames * 1_000) / (now - startedAt));
          else requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      }),
  );
  console.log(`[${testInfo.project.name}] online render cadence: ${fps.toFixed(1)} FPS`);
  expect(fps).toBeGreaterThanOrEqual(30);
  if (testInfo.project.name === 'mobile-landscape') {
    const joystick = await page.getByLabel('Movement joystick').boundingBox();
    const leave = await page.getByRole('button', { name: 'Leave Room' }).boundingBox();
    expect(joystick && leave).toBeTruthy();
    expect(joystick!.x + joystick!.width < leave!.x).toBe(true);
    const before = await page.locator('#game-root').getAttribute('data-local-position');
    await page.mouse.move(joystick!.x + joystick!.width * 0.8, joystick!.y + joystick!.height / 2);
    await page.mouse.down();
    await expect
      .poll(() => page.locator('#game-root').getAttribute('data-local-position'))
      .not.toBe(before);
    await page.mouse.up();
  }
  await page.getByRole('button', { name: 'Leave Room' }).click();
  await expect(page.getByRole('heading', { name: 'Online Movement Sandbox' })).toBeVisible();
  await page.getByRole('button', { name: 'Create Room' }).click();
  await expect(page.locator('canvas')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Online Movement Sandbox' })).toBeVisible();
  await page.getByRole('button', { name: 'Online Movement Sandbox' }).click();
  await page.getByRole('button', { name: 'Create Room' }).click();
  await expect(page.locator('canvas')).toHaveCount(1);
  expect(errors).toEqual([]);
});

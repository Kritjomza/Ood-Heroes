import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

async function createCombatRoom(page: Page, name: string) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Online Shared Combat Sandbox' }).click();
  await page.getByLabel('Display name').fill(name);
  await page.getByRole('button', { name: 'Create Room' }).click();
  await expect(page.getByTestId('online-hud')).toBeVisible();
  const roomText = await page.getByText(/^Room [A-Z2-9]{6}$/u).textContent();
  return roomText!.replace('Room ', '');
}

async function joinCombatRoom(page: Page, name: string, code: string) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Online Shared Combat Sandbox' }).click();
  await page.getByLabel('Display name').fill(name);
  await page.getByLabel('Room code').fill(code);
  await page.getByRole('button', { name: 'Join Room' }).click();
  await expect(page.getByTestId('online-hud')).toBeVisible();
}

async function roomId(request: APIRequestContext, code: string) {
  const response = await request.get(`http://127.0.0.1:2567/rooms/${code}`);
  expect(response.ok()).toBe(true);
  return ((await response.json()) as { roomId: string }).roomId;
}

async function control(
  request: APIRequestContext,
  id: string,
  displayName: string,
  action: string,
) {
  const response = await request.post(`http://127.0.0.1:2567/test/rooms/${id}/control`, {
    data: { displayName, action },
  });
  expect(response.ok()).toBe(true);
  return response.json() as Promise<{ ok: boolean; monsterId?: string }>;
}

test('cute combat HUD, hero HP bars, tap targeting, and mobile landscape layouts stay usable', async ({
  page,
  request,
}, testInfo) => {
  const code = await createCombatRoom(page, 'Sticker');
  const id = await roomId(request, code);
  expect((await control(request, id, 'Sticker', 'tap-target')).ok).toBe(true);
  await expect(page.getByRole('region', { name: 'Team status' })).toBeVisible();
  await expect(page.getByRole('status', { name: 'Combat status' })).toBeVisible();
  await expect(page.getByText(/Session progress resets when this room ends/i)).toBeVisible();
  await expect.poll(() => page.locator('#game-root').getAttribute('data-hero-hp-bars')).toBe('3');

  await expect
    .poll(() => page.locator('#game-root').getAttribute('data-first-monster-screen'))
    .not.toBe('');
  const raw = await page.locator('#game-root').getAttribute('data-first-monster-screen');
  const point = JSON.parse(raw!) as { x: number; y: number; id: string };
  const canvasLocator = page.locator('canvas');
  const canvas = await canvasLocator.boundingBox();
  expect(canvas).not.toBeNull();
  const backingSize = await canvasLocator.evaluate((element) => ({
    width: (element as HTMLCanvasElement).width,
    height: (element as HTMLCanvasElement).height,
  }));
  const targetX = canvas!.x + point.x * (canvas!.width / backingSize.width);
  const targetY = canvas!.y + point.y * (canvas!.height / backingSize.height);
  if (testInfo.project.name === 'mobile-landscape') await page.touchscreen.tap(targetX, targetY);
  else await page.mouse.click(targetX, targetY);
  await expect(page.getByText('Target: None')).not.toBeVisible({ timeout: 5_000 });

  if (testInfo.project.name === 'mobile-landscape')
    for (const viewport of [
      { width: 915, height: 412 },
      { width: 844, height: 390 },
      { width: 740, height: 360 },
    ]) {
      await page.setViewportSize(viewport);
      const joystick = await page.getByLabel('Movement joystick').boundingBox();
      const auto = await page.getByRole('button', { name: 'Auto Hunt' }).boundingBox();
      const team = await page.getByRole('region', { name: 'Team status' }).boundingBox();
      const room = await page.getByRole('region', { name: 'Online room status' }).boundingBox();
      expect(joystick && auto && team && room).toBeTruthy();
      expect(joystick!.x + joystick!.width).toBeLessThan(auto!.x);
      expect(team!.x + team!.width).toBeLessThan(room!.x);
      expect(auto!.width).toBeGreaterThanOrEqual(48);
      expect(auto!.height).toBeGreaterThanOrEqual(48);
      expect(await page.evaluate(() => ({ x: scrollX, y: scrollY }))).toEqual({ x: 0, y: 0 });
    }
});

test('low HP Auto Hunt retreats, recovers in the Safe Zone, and resumes', async ({
  page,
  request,
}) => {
  test.setTimeout(60_000);
  const code = await createCombatRoom(page, 'Runner');
  const id = await roomId(request, code);
  expect((await control(request, id, 'Runner', 'low-hp')).ok).toBe(true);
  await page.getByRole('button', { name: 'Auto Hunt' }).click();
  await expect(page.getByRole('status', { name: 'Combat status' })).toContainText(
    'Strategic running away',
  );
  await expect(page.getByRole('status', { name: 'Combat status' })).toContainText(
    'Emergency snack break',
    { timeout: 20_000 },
  );
  await expect
    .poll(() => page.getByRole('status', { name: 'Combat status' }).textContent(), {
      timeout: 20_000,
    })
    .toMatch(/doing its best|Looking for/u);
  await expect(page.getByRole('button', { name: 'Auto Hunt' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('full team wipe shows a clear five-second overlay and returns to manual control', async ({
  page,
  request,
}) => {
  const code = await createCombatRoom(page, 'Pancake');
  const id = await roomId(request, code);
  expect((await control(request, id, 'Pancake', 'team-wipe')).ok).toBe(true);
  const overlay = page.getByRole('dialog', { name: 'Team respawn' });
  await expect(overlay).toContainText('The squad became floor decorations');
  await expect(overlay).toContainText(/Respawning in [1-5]/u);
  await expect(overlay).not.toBeVisible({ timeout: 8_000 });
  await expect(page.getByRole('button', { name: 'Auto Hunt' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
});

test('monster blocked by a wall activates bounded A-star fallback and routes around it', async ({
  page,
  request,
}) => {
  test.setTimeout(30_000);
  const code = await createCombatRoom(page, 'Navigator');
  const id = await roomId(request, code);
  const result = await control(request, id, 'Navigator', 'wall-navigation');
  expect(result.ok).toBe(true);
  await expect
    .poll(async () => {
      const response = await request.get(`http://127.0.0.1:2567/test/rooms/${id}/metrics`);
      return ((await response.json()) as { pathCalculations: number }).pathCalculations;
    })
    .toBeGreaterThan(0);
  await expect
    .poll(async () => {
      const raw = await page.locator('#game-root').getAttribute('data-monster-positions');
      const positions = JSON.parse(raw ?? '[]') as Array<[string, number, number]>;
      return positions.find(([monsterId]) => monsterId === result.monsterId)?.[1] ?? 0;
    })
    .toBeGreaterThan(608);
});

test('consented leave during lethal resolution grants one reward only to the remaining contributor', async ({
  browser,
  request,
}) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();
  const code = await createCombatRoom(pageA, 'Closer');
  await joinCombatRoom(pageB, 'Leaver', code);
  await expect(pageA.getByTestId('player-count')).toHaveText('2 / 10');
  const id = await roomId(request, code);
  expect((await control(request, id, 'Closer', 'prepare-shared-death')).ok).toBe(true);
  await pageB.getByRole('button', { name: 'Leave Room' }).click();
  await expect(pageA.getByTestId('player-count')).toHaveText('1 / 10');
  expect((await control(request, id, 'Closer', 'finish-shared-death')).ok).toBe(true);
  await expect
    .poll(async () => {
      const metrics = await request.get(`http://127.0.0.1:2567/test/rooms/${id}/metrics`);
      return ((await metrics.json()) as { rewardGrants: number }).rewardGrants;
    })
    .toBe(1);
  await Promise.all([contextA.close(), contextB.close()]);
});

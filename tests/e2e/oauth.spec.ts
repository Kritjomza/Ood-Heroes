import { expect, test } from '@playwright/test';

test('shows Google first and handles callback errors without exposing provider parameters', async ({
  page,
}) => {
  await page.goto('/');
  const actions = page.locator('.auth-card button');
  await expect(actions.first()).toHaveAccessibleName('Continue with Google');
  await expect(page.getByRole('button', { name: 'Play as Guest' })).toBeVisible();

  await page.goto(
    '/auth/callback?error=access_denied&error_code=provider_error&error_description=raw-provider-detail',
  );
  await expect(page.getByRole('heading', { name: 'The drawbridge got stuck' })).toBeVisible();
  await expect(
    page.getByText('Google could not complete sign-in. Please try again.'),
  ).toBeVisible();
  await expect(page.getByText(/raw-provider-detail/u)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Back to Login' })).toBeVisible();
});

test('rejects a reloaded Guest-link callback without a live token-free intent', async ({
  page,
}) => {
  await page.goto('/auth/link-callback');
  await expect(page.getByRole('heading', { name: 'The drawbridge got stuck' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Back to Login' })).toBeVisible();
});

import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

/**
 * Swipe gesture starting at the top of the toast (inside the viewport even when
 * the toast renders near a viewport edge) and ending at an absolute (x, y) point.
 * Uses a single-step teleport for the drag move, matching the upstream Sonner suite
 * which is what reliably triggers swipe detection across Chromium/Firefox/WebKit.
 */
async function swipeFromTop(
  page: Page,
  box: { x: number; y: number; width: number; height: number },
  toX: number,
  toY: number,
): Promise<void> {
  const startX = box.x + box.width / 2;
  const startY = box.y + 10;
  // Firefox via Playwright doesn't always honor setPointerCapture, so pointer
  // events stop reaching the toast once the cursor leaves its bounds. Run the
  // drag in two phases: an in-bounds nudge that registers the swipe direction
  // and amount on the toast, then a final move to the requested destination
  // (clamped to the viewport, which Firefox also requires).
  const viewport = page.viewportSize() ?? { width: 1280, height: 900 };
  const clampedX = Math.max(0, Math.min(viewport.width - 1, toX));
  const clampedY = Math.max(0, Math.min(viewport.height - 1, toY));
  // Choose an in-bounds intermediate point biased along the dominant swipe
  // axis so the swipe direction (x or y) is locked in from the toast's first
  // pointermove. Preserving the start coordinate on the off-axis keeps the
  // delta on that axis tiny.
  const dx = clampedX - startX;
  const dy = clampedY - startY;
  const dominantY = Math.abs(dy) >= Math.abs(dx);
  const innerX = dominantY ? startX : Math.max(box.x + 5, Math.min(box.x + box.width - 5, clampedX));
  const innerY = dominantY ? Math.max(box.y + 5, Math.min(box.y + box.height - 5, clampedY)) : startY;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(innerX, innerY);
  await page.mouse.move(clampedX, clampedY);
  await page.mouse.up();
}

test.describe('Basic functionality', () => {
  test('toast is rendered and disappears after the default timeout', async ({ page }) => {
    await page.getByTestId('default-button').click();
    await expect(page.locator('[data-sonner-toast]')).toHaveCount(1);
    await expect(page.locator('[data-sonner-toast]')).toHaveCount(0);
  });

  test('various toast types are rendered correctly', async ({ page }) => {
    await page.getByTestId('success').click();
    await expect(page.getByText('My Success Toast', { exact: true })).toHaveCount(1);

    await page.getByTestId('error').click();
    await expect(page.getByText('My Error Toast', { exact: true })).toHaveCount(1);

    await page.getByTestId('action').click();
    await expect(page.locator('[data-action]')).toHaveCount(1);
  });

  test('show correct toast content based on promise state', async ({ page }) => {
    await page.getByTestId('promise').click();
    await expect(page.getByText('Loading...')).toHaveCount(1);
    await expect(page.getByText('Loaded')).toHaveCount(1);
  });

  test('promise toast with extended configuration', async ({ page }) => {
    await page.getByTestId('extended-promise').click();
    await expect(page.getByText('Loading...')).toHaveCount(1);
    await expect(page.getByText('Sonner toast has been added')).toHaveCount(1);
    await expect(page.getByText('Custom description for the Success state')).toHaveCount(1);
    await expect(page.getByText('Global description')).toHaveCount(0);
  });

  test('promise toast with extended error configuration', async ({ page }) => {
    await page.getByTestId('extended-promise-error').click();
    await expect(page.getByText('Loading...')).toHaveCount(1);
    await expect(page.getByText('An error occurred')).toHaveCount(1);

    const retry = page.getByRole('button', { name: 'Retry' });
    await expect(retry).toHaveCount(1);
    await retry.click();
    await expect(page.getByText('An error occurred')).toHaveCount(1);
  });

  test('promise toast with Error object rejection', async ({ page }) => {
    await page.getByTestId('error-promise').click();
    await expect(page.getByText('Error Raise: Error: Not implemented')).toHaveCount(1);
  });

  test('render custom content in toast', async ({ page }) => {
    await page.getByTestId('custom').click();
    await expect(page.getByText('jsx')).toHaveCount(1);
  });

  test('toast is removed after swiping down', async ({ page }) => {
    await page.getByTestId('infinity-toast').click();
    const toast = page.locator('[data-sonner-toast]');
    const box = await toast.boundingBox();
    if (!box) throw new Error('toast not visible');
    await swipeFromTop(page, box, 0, 2000);
    await expect(toast).toHaveCount(0);
  });

  test('non-dismissible toast is not removed when dragged', async ({ page }) => {
    await page.getByTestId('non-dismissible-toast').click();
    const toast = page.locator('[data-sonner-toast]');
    const box = await toast.boundingBox();
    if (!box) throw new Error('toast not visible');
    await swipeFromTop(page, box, 0, 2000);
    await expect(toast).toHaveCount(1);
  });

  test('toast is removed after swiping up', async ({ page }) => {
    await page.goto('/?position=top-left');
    await page.getByTestId('infinity-toast').click();
    const toast = page.locator('[data-sonner-toast]');
    const box = await toast.boundingBox();
    if (!box) throw new Error('toast not visible');
    // Drag from the bottom of the toast straight up to (0, 0). Starting at
    // the toast bottom gives the gesture more vertical room before hitting
    // the viewport edge, which all three engines (Chromium/FF/WebKit)
    // can dispatch reliably.
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height - 5;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(0, 0);
    await page.mouse.up();
    await expect(toast).toHaveCount(0);
  });

  test('toast is not removed when hovered', async ({ page }) => {
    await page.getByTestId('default-button').click();
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toBeVisible();
    // Wait for mount animation to settle before measuring.
    await page.waitForTimeout(100);
    const box = await toast.boundingBox();
    if (!box) throw new Error('toast not visible');
    await page.mouse.move(box.x + box.width / 2, box.y + 10);
    await page.waitForTimeout(5000);
    await expect(toast).toBeVisible();
    await expect(toast).toHaveCount(1);
  });

  test('toast is not removed if duration is set to infinity', async ({ page }) => {
    await page.getByTestId('infinity-toast').click();
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toBeVisible();
    await page.waitForTimeout(5000);
    await expect(toast).toBeVisible();
    await expect(toast).toHaveCount(1);
  });

  test('toast is not removed when event prevented in action', async ({ page }) => {
    await page.getByTestId('action-prevent').click();
    await page.locator('[data-action]').click();
    await expect(page.locator('[data-sonner-toast]')).toHaveCount(1);
  });

  test("toast's auto close callback gets executed correctly", async ({ page }) => {
    await page.getByTestId('auto-close-toast-callback').click();
    await expect(page.getByTestId('auto-close-el')).toHaveCount(1);
  });

  test("toast's dismiss callback gets executed correctly", async ({ page }) => {
    await page.getByTestId('dismiss-toast-callback').click();
    const toast = page.locator('[data-sonner-toast]');
    await toast.waitFor({ state: 'visible' });
    const box = await toast.boundingBox();
    if (!box) throw new Error('toast not visible');
    await swipeFromTop(page, box, 0, 2000);
    await expect(toast).toHaveCount(0);
    await expect(page.getByTestId('dismiss-el')).toHaveCount(1);
  });

  test("toaster's theme should be light", async ({ page }) => {
    await page.getByTestId('infinity-toast').click();
    await expect(page.locator('sonner-toaster#toaster')).toHaveAttribute(
      'data-sonner-theme',
      'light',
    );
  });

  test("toaster's theme should be dark", async ({ page }) => {
    await page.goto('/?theme=dark');
    await page.getByTestId('infinity-toast').click();
    await expect(page.locator('sonner-toaster#toaster')).toHaveAttribute(
      'data-sonner-theme',
      'dark',
    );
  });

  test("toaster's theme should be changed", async ({ page }) => {
    await page.getByTestId('infinity-toast').click();
    await expect(page.locator('sonner-toaster#toaster')).toHaveAttribute(
      'data-sonner-theme',
      'light',
    );
    await page.getByTestId('theme-button').click();
    await expect(page.locator('sonner-toaster#toaster')).toHaveAttribute(
      'data-sonner-theme',
      'dark',
    );
  });

  test("toaster's dir prop is reflected correctly", async ({ page }) => {
    await page.goto('/?dir=rtl');
    await page.getByTestId('default-button').click();
    await expect(page.locator('sonner-toaster#toaster')).toHaveAttribute('dir', 'rtl');
  });

  test('show correct toast content when updating', async ({ page }) => {
    await page.getByTestId('update-toast').click();
    await expect(page.getByText('My Unupdated Toast', { exact: true })).toHaveCount(0);
    await expect(page.getByText('My Updated Toast', { exact: true })).toHaveCount(1);
  });

  test('should update toast content and duration after 3 seconds', async ({ page }) => {
    await page.getByTestId('update-toast-duration').click();
    const initial = page.getByText('My Unupdated Toast, Updated After 3 Seconds');
    await expect(initial).toBeVisible();
    await page.waitForTimeout(3200);
    const updated = page.getByText('My Updated Toast, Close After 1 Second');
    await expect(updated).toBeVisible();
    await expect(initial).not.toBeVisible();
    await page.waitForTimeout(1500);
    await expect(updated).not.toBeVisible();
  });

  test('string description is rendered', async ({ page }) => {
    await page.getByTestId('string-description').click();
    await expect(page.getByText('string description')).toHaveCount(1);
  });

  test('toast has aria-atomic="true"', async ({ page }) => {
    await page.getByTestId('default-button').click();
    await expect(page.locator('[data-sonner-toast]')).toHaveAttribute('aria-atomic', 'true');
  });

  test('return focus to the previously focused element on dismiss', async ({ page }) => {
    await page.getByTestId('focus-return-trigger').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-sonner-toast]')).toHaveCount(1);
    await page.locator('[data-action]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-sonner-toast]')).toHaveCount(0);
    await expect(page.getByTestId('focus-return-trigger')).toBeFocused();
  });

  test('Escape dismisses the focused toast', async ({ page }) => {
    await page.getByTestId('escape-trigger').focus();
    await page.keyboard.press('Enter');
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toHaveCount(1);
    await toast.focus();
    await page.keyboard.press('Escape');
    await expect(toast).toHaveCount(0);
    await expect(page.getByTestId('escape-trigger')).toBeFocused();
  });

  test('aria labels are custom', async ({ page }) => {
    await page.getByRole('button', { name: 'With custom ARIA labels' }).click();
    await expect(page.getByText('Toast with custom ARIA labels')).toHaveCount(1);
    await expect(page.getByLabel('Notices')).toHaveCount(1);
    await expect(page.getByLabel('Yeet the notice', { exact: true })).toHaveCount(1);
  });

  test('toast with testId renders data-testid attribute correctly', async ({ page }) => {
    await page.getByTestId('testid-toast-button').click();
    await expect(page.getByTestId('my-test-toast')).toBeVisible();
    await expect(page.getByTestId('my-test-toast')).toContainText('Toast with test ID');
  });

  test('toast without testId does not have data-testid attribute', async ({ page }) => {
    await page.getByTestId('default-button').click();
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toBeVisible();
    await expect(toast).not.toHaveAttribute('data-testid');
  });

  test('promise toast with testId maintains testId through state changes', async ({ page }) => {
    await page.getByTestId('testid-promise-toast-button').click();
    await expect(page.getByTestId('promise-test-toast')).toBeVisible();
    await expect(page.getByTestId('promise-test-toast')).toContainText('Loading...');
    await expect(page.getByTestId('promise-test-toast')).toContainText('Loaded');
  });

  test('toast with toasterId only appears in the targeted Toaster', async ({ page }) => {
    await page.getByTestId('toast-secondary').click();
    const secondary = page.locator('sonner-toaster#secondary');
    await expect(secondary.getByText('Secondary Toaster Toast')).toHaveCount(1);
    const global = page.locator('sonner-toaster#toaster');
    await expect(global.getByText('Secondary Toaster Toast')).toHaveCount(0);
  });

  test('toast without toasterId only appears in the default Toaster', async ({ page }) => {
    await page.getByTestId('toast-global').click();
    const global = page.locator('sonner-toaster#toaster');
    await expect(global.getByText('Global Toaster Toast')).toHaveCount(1);
    const secondary = page.locator('sonner-toaster#secondary');
    await expect(secondary.getByText('Global Toaster Toast')).toHaveCount(0);
  });

  test('Node description is rendered', async ({ page }) => {
    await page.getByTestId('node-description').click();
    await expect(page.getByText('This is my custom Node description')).toHaveCount(1);
  });
});

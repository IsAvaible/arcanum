import { test, expect } from '@playwright/test';

// See here how to get started:
// https://playwright.dev/docs/intro
test('visits the app root url', async ({ page }) => {
  await page.goto('/');

  // Warten Sie, bis das Element vorhanden ist, bevor der Text geprüft wird.
  await page.waitForSelector('div.greetings > h1', { timeout: 10000 }); // 10 Sekunden Timeout

  // Überprüfen Sie den Text des Elements.
  await expect(page.locator('div.greetings > h1')).toHaveText('You did it!', { timeout: 10000 });
});

import { test, expect } from '@playwright/test';

test.describe('E2E User Flow', () => {
  test('Login and navigate to Dashboard', async ({ page }) => {
    // 1. Go to Login Page
    await page.goto('/login');

    // 2. Fill Credentials (Make sure these exist in your DB)
    await page.fill('input[type="email"]', 'admin@vigil.com');
    await page.fill('input[type="password"]', 'password123');
    
    // 3. Submit
    await page.click('button[type="submit"]');

    // 4. Wait for navigation or error
    await page.waitForTimeout(5000);
    const url = page.url();
    if (url.includes('/login')) {
       await page.screenshot({ path: 'login-failure.png' });
    }
    
    // 5. Verify successful login by checking URL or dashboard element
    await expect(page).toHaveURL('/', { timeout: 30000 });
    await expect(page.locator('text=Precision Billing')).toBeVisible({ timeout: 10000 });

    // 6. Navigate to Tour Schedules
    await page.click('a[href="/tour-schedules"]');
    await expect(page).toHaveURL('/tour-schedules');

    // 6. Navigate to Quotations
    await page.click('a[href="/quotations"]');
    await expect(page).toHaveURL('/quotations');
    
    // In a full E2E, we would click 'Create Quotation', fill the form, and verify.
  });
});

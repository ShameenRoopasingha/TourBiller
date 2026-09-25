# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: user-flow.spec.ts >> E2E User Flow >> Login and navigate to Dashboard
- Location: e2e\user-flow.spec.ts:4:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected: "http://localhost:3000/tour-schedules"
Received: "http://localhost:3000/"
Timeout:  5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    13 × locator resolved to <html lang="en-GB" class="light">…</html>
       - unexpected value "http://localhost:3000/"

```

```yaml
- alert: VIGIL | Smart Travel Management System
- link "VIGIL VIGIL Smart Travel Management.":
  - /url: /
  - img "VIGIL"
  - text: VIGIL Smart Travel Management.
- list:
  - listitem:
    - link "Dashboard":
      - /url: /
  - listitem:
    - link "Vehicles":
      - /url: /vehicles
  - listitem:
    - link "Customers":
      - /url: /customers
  - listitem:
    - link "Bookings":
      - /url: /bookings
  - listitem:
    - link "Tour Schedules":
      - /url: /tour-schedules
  - listitem:
    - link "Quotations":
      - /url: /quotations
  - listitem:
    - link "Bills":
      - /url: /bills
  - listitem:
    - link "Users":
      - /url: /users
- text: T
- link "Test Admin ADMIN":
  - /url: /settings
- button "Sign out"
- text: VIGIL v0.1
- button "Toggle theme"
- link "Settings":
  - /url: /settings
- main:
  - main:
    - main:
      - heading "VIGIL Precision Billing" [level=1]
      - paragraph: Smart travel management and intelligent invoicing infrastructure for modern fleets.
      - heading "Dashboard" [level=2]
      - link "New Booking":
        - /url: /bookings/new
      - link "New Bill":
        - /url: /bills/new
      - text: Vehicle Status 0
      - paragraph: Available
      - text: "0"
      - paragraph: Occupied
      - text: Weekly Income Rs. 0.00
      - paragraph: This week
      - text: Yearly Income Rs. 0.00
      - paragraph: Total for 2026
      - text: Fleet Size 0
      - paragraph: Total vehicles
      - text: Recent Bills Latest generated vehicle hire bills.
      - paragraph: No bills found
      - paragraph: Create a new bill to get started.
      - text: Ongoing Tours Currently active vehicle bookings.
      - paragraph: No Ongoing Tours
      - paragraph: All vehicles are currently available or scheduled for future.
      - link "View All Bookings":
        - /url: /bookings
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('E2E User Flow', () => {
  4  |   test('Login and navigate to Dashboard', async ({ page }) => {
  5  |     // 1. Go to Login Page
  6  |     await page.goto('/login');
  7  | 
  8  |     // 2. Fill Credentials (Make sure these exist in your DB)
  9  |     await page.fill('input[type="email"]', 'admin@vigil.com');
  10 |     await page.fill('input[type="password"]', 'password123');
  11 |     
  12 |     // 3. Submit
  13 |     await page.click('button[type="submit"]');
  14 | 
  15 |     // 4. Wait for navigation or error
  16 |     await page.waitForTimeout(5000);
  17 |     const url = page.url();
  18 |     if (url.includes('/login')) {
  19 |        await page.screenshot({ path: 'login-failure.png' });
  20 |     }
  21 |     
  22 |     // 5. Verify successful login by checking URL or dashboard element
  23 |     await expect(page).toHaveURL('/', { timeout: 30000 });
  24 |     await expect(page.locator('text=Precision Billing')).toBeVisible({ timeout: 10000 });
  25 | 
  26 |     // 6. Navigate to Tour Schedules
  27 |     await page.click('a[href="/tour-schedules"]');
> 28 |     await expect(page).toHaveURL('/tour-schedules');
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  29 | 
  30 |     // 6. Navigate to Quotations
  31 |     await page.click('a[href="/quotations"]');
  32 |     await expect(page).toHaveURL('/quotations');
  33 |     
  34 |     // In a full E2E, we would click 'Create Quotation', fill the form, and verify.
  35 |   });
  36 | });
  37 | 
```
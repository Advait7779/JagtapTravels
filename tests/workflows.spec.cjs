const { test, expect } = require('@playwright/test');
test('public site, setup, vehicle service, documents, billing and mobile navigation', async ({
  page,
}, testInfo) => {
  test.setTimeout(120000);
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /Explore Maharashtra With Supreme Comfort/ }),
  ).toBeVisible();
  await page.waitForFunction(() =>
    [...document.images].every((image) => image.complete && image.naturalWidth > 0),
  );
  expect(
    await page
      .locator('img')
      .evaluateAll((images) =>
        images
          .filter((image) => image.naturalWidth === 0)
          .map((image) => image.getAttribute('src')),
      ),
  ).toEqual([]);
  await page.getByRole('button', { name: 'Staff CRM Login', exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.getByLabel('Setup code').fill('test-browser-setup-code-2026-only');
  await page.getByLabel('Full name').fill('Test Operator');
  await page.getByLabel('Email', { exact: true }).fill('operator@example.invalid');
  await page.getByLabel('Password', { exact: true }).fill('Browser-Secret-Long-2026');
  await page.getByRole('button', { name: 'Create account and sign in' }).click();
  await expect(page.getByText('Welcome back, Test Operator')).toBeVisible();
  await page.getByRole('button', { name: 'Business Settings', exact: true }).click();
  await page.getByLabel('Company name').fill('Verified Test Travel');
  await page.getByLabel('Business phone 1').fill('9876543210');
  await page.getByLabel('UPI ID').fill('test-travel@bank');
  await page.getByRole('button', { name: 'Save Business Settings', exact: true }).click();
  await expect(page.getByText('Settings updated successfully.')).toBeVisible();
  await expect(page.getByText('Account Security')).toHaveCount(0);
  await expect(page.getByText('Change password')).toHaveCount(0);
  await page.getByRole('heading', { name: 'Team users' }).scrollIntoViewIfNeeded();
  await page.getByLabel('Full name').fill('Operations Tester');
  await page.getByLabel('Email', { exact: true }).fill('operations@example.invalid');
  const staffPassword = page.getByLabel('Password', { exact: true });
  await staffPassword.fill('S3cret');
  await page.getByRole('button', { name: 'Show password' }).click();
  await expect(staffPassword).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Hide password' }).click();
  await expect(staffPassword).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Create staff account' }).click();
  await expect(page.getByText('Operations Tester', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Delete staff account for Operations Tester' })).toBeVisible();
  await page.getByRole('button', { name: /^Customers/ }).click();
  await page.getByRole('button', { name: 'Add New Customer', exact: true }).click();
  await page.getByPlaceholder('e.g. Rajesh Sharma').fill('Browser Customer');
  await page.getByPlaceholder('e.g. +91 98230 11223').fill('9876543211');
  await page.getByRole('button', { name: 'Save Customer', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Add New Customer', exact: true }),
  ).not.toBeVisible();

  await page.getByRole('button', { name: /^Vehicles & Service/ }).click();
  await page.getByRole('button', { name: 'Add Vehicle', exact: true }).click();
  await page.getByPlaceholder('e.g. Toyota Innova Crysta').fill('Browser Innova');
  await page.getByPlaceholder('e.g. MH 12 QX 4589').fill('MH 12 QA 9001');
  await page.getByPlaceholder('e.g. 45200').fill('29000');
  await page.getByRole('button', { name: 'Register Vehicle', exact: true }).click();
  let vehicleRow = page.getByRole('row').filter({ hasText: 'MH 12 QA 9001' });
  await expect(vehicleRow).toContainText('1,000 KM');
  await vehicleRow.getByTitle('Log Daily KM for this vehicle').click();
  await page.getByPlaceholder('e.g. 180').fill('1000');
  await page.getByRole('button', { name: 'Save Daily KM', exact: true }).click();
  vehicleRow = page.getByRole('row').filter({ hasText: 'MH 12 QA 9001' });
  await expect(vehicleRow).toContainText('Service immediately');
  await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
  await expect(page.getByText('Vehicle Maintenance Due Reminder!')).toBeVisible();
  await page.getByRole('button', { name: /^Vehicles & Service/ }).click();
  vehicleRow = page.getByRole('row').filter({ hasText: 'MH 12 QA 9001' });
  await vehicleRow.getByTitle('Record workshop maintenance and reset service cycle').click();
  await page.getByPlaceholder('e.g. Sai Service Centre, Wakad').fill('Browser Garage');
  await page.getByPlaceholder('e.g. 4500').fill('4500');
  await page.getByRole('button', { name: 'Mark Serviced & Reset Cycle', exact: true }).click();
  vehicleRow = page.getByRole('row').filter({ hasText: 'MH 12 QA 9001' });
  await expect(vehicleRow).toContainText('30,000 KM');
  await expect(vehicleRow).toContainText('Cycle: 0 / 30,000 KM');
  await page.screenshot({
    path: testInfo.outputPath('vehicle-service.png'),
    fullPage: true,
    animations: 'disabled',
  });

  await page.getByRole('button', { name: /^Corporate Quotations/ }).click();
  await page.getByRole('button', { name: 'New corporate quotation' }).click();
  const corporateEditor = page.getByRole('dialog', { name: 'New corporate quotation' });
  await corporateEditor.getByLabel('Company name *').fill('Browser Customer');
  await corporateEditor.getByLabel('Phone *').fill('9876543210');
  await corporateEditor.getByLabel('Vehicle type *').fill('Innova Crysta');
  await corporateEditor.getByLabel('Monthly fixed fare ₹ *').fill('45000');
  await corporateEditor.getByLabel('Included KM/month').fill('2500');
  await corporateEditor.getByLabel('Excess rate ₹/KM').fill('14');
  await corporateEditor.getByLabel('Tax treatment').selectOption('nongst');
  await expect(corporateEditor.getByText('₹45,000.00').last()).toBeVisible();
  await corporateEditor.getByRole('button', { name: 'Save quotation' }).click();
  const quoteRow = page.getByRole('row').filter({ hasText: 'Browser Customer' });
  await expect(quoteRow).toContainText('CQ-');
  await expect(quoteRow.getByRole('button', { name: 'Edit' })).toBeVisible();
  await expect(quoteRow.getByRole('button', { name: 'Mark sent' })).toHaveCount(0);
  await expect(quoteRow.getByRole('button', { name: 'Accept' })).toHaveCount(0);
  await expect(quoteRow.getByRole('button', { name: 'Reject' })).toHaveCount(0);
  await expect(quoteRow.getByRole('button', { name: 'Create contracts' })).toHaveCount(0);
  await quoteRow.getByRole('button', { name: 'View / PDF' }).click();
  const corporatePreview = page.getByRole('dialog', { name: 'Corporate quotation preview' });
  await expect(corporatePreview.getByText('₹45,000.00').last()).toBeVisible();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.corporate-quotation-printable')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('corporate-quotation-print.png'), fullPage: true });
  await page.pdf({ path: testInfo.outputPath('corporate-quotation.pdf'), format: 'A4', printBackground: true });
  await page.emulateMedia({ media: 'screen' });
  await corporatePreview.getByRole('button', { name: 'Close quotation preview' }).click();

  await page.evaluate(async () => {
    const sessionResponse = await fetch('/api/auth/me');
    const session = await sessionResponse.json();
    const customers = await fetch('/api/customers').then((response) => response.json());
    const response = await fetch('/api/meter-readings', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': session.csrfToken,
      },
      body: JSON.stringify({
        vehicleName: 'Browser Innova',
        vehicleNumber: 'MH 12 QA 9001',
        driverName: 'Browser Driver',
        customerId: customers[0].id,
        customerName: customers[0].name,
        tripSource: 'Pune',
        tripDestination: 'Mumbai',
        startDate: '2026-09-15',
        endDate: '2026-09-15',
        openingKm: 30000,
        closingKm: 30100,
        status: 'Completed',
        ratePerKm: 0,
        driverAllowance: 0,
        tollParking: 0,
      }),
    });
    if (!response.ok) throw new Error(await response.text());
  });
  await page.reload();
  await expect(page.getByText('Welcome back, Test Operator')).toBeVisible();
  await page.getByRole('button', { name: /^Duty Slips/ }).click();
  const slipRow = page.getByRole('row').filter({ hasText: 'MH 12 QA 9001' });
  await slipRow.getByTitle('Vehicle and trip documents').click();
  await page.locator('#doc-file-upload').setInputFiles({
    name: 'browser-rc.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n% browser upload\n%%EOF'),
  });
  await page.getByRole('button', { name: 'Save & Attach Document', exact: true }).click();
  await expect(page.getByText('Document uploaded successfully!')).toBeVisible();
  await expect(page.getByText('browser-rc.pdf')).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('meter-document.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByTitle('Close').click();

  await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
  await page.getByRole('button', { name: 'Generate Bill', exact: true }).click();
  const billForm = page.locator('form');
  await billForm.locator('select').nth(1).selectOption({ label: 'Browser Customer (9876543211)' });
  await page.getByPlaceholder('e.g. Pune Airport / City').fill('Pune');
  await page.getByPlaceholder('e.g. Mahabaleshwar - Panchgani Return').fill('Mumbai');
  await page.getByPlaceholder('e.g. 5000').fill('1000');
  await billForm.locator('input[type=number]').nth(1).fill('0');
  await billForm
    .locator('select')
    .filter({ has: page.locator('option[value="0"]') })
    .selectOption('0');
  await page.getByRole('button', { name: 'Generate Customer Bill', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Invoice preview' })).toBeVisible();
  await expect(page.getByText('Verified Test Travel', { exact: true })).toBeVisible();
  await expect(page.getByText('GST (0%)', { exact: true })).toBeVisible();
  await expect(page.getByText('Package / trip fare')).toBeVisible();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.print-overlay')).toHaveCSS('position', 'static');
  await page.screenshot({
    path: testInfo.outputPath('invoice-print.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.pdf({ path: testInfo.outputPath('invoice.pdf'), format: 'A4', printBackground: true });
  await page.emulateMedia({ media: 'screen' });
  await page.getByRole('button', { name: 'Close invoice' }).click();
  await page.getByRole('button', { name: /^Customer Invoices/ }).click();
  await page.getByRole('button', { name: 'Payment', exact: true }).click();
  await page.getByLabel('Payment mode').selectOption('UPI');
  await page.getByRole('button', { name: 'Save payment', exact: true }).click();
  await expect(page.getByText('Status: Paid', { exact: true })).toBeVisible();
  await expect(page.getByText('Payment history', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close invoice' }).click();
  await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
  await page.screenshot({
    path: testInfo.outputPath('desktop.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(page.getByRole('button', { name: /^Customers/ })).toBeInViewport();
  await page.getByRole('button', { name: /^Customers/ }).click();
  await expect(page.getByText('Browser Customer', { exact: true })).toBeVisible();
  await expect
    .poll(async () => page.locator('aside').evaluate((el) => el.getBoundingClientRect().right))
    .toBeLessThanOrEqual(0);
  const sizes = await page.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(sizes.scroll).toBeLessThanOrEqual(sizes.width);
  await page.screenshot({
    path: testInfo.outputPath('mobile.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('button', { name: 'Logout', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Sign out of CRM' })).toBeVisible();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByLabel('Email', { exact: true }).fill('operations@example.invalid');
  await page.getByLabel('Password', { exact: true }).fill('S3cret');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByText('Operations Tester', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Quotations/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Fuel Expenses/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Tyre Management/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Corporate Contracts/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Corporate Quotations/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Customer Invoices/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Business Settings/ })).toHaveCount(0);
  await expect(page.getByText(/Could not load/)).toHaveCount(0);
  expect(await page.evaluate(() => fetch('/api/bills').then((response) => response.status))).toBe(403);
  expect(errors).toEqual([]);
});

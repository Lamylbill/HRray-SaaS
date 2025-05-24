import { test, expect } from '@playwright/test';

// Test that the Leave page loads
test('Leave page loads correctly', async ({ page }) => {
  await page.goto('https://hrray.netlify.app/leave');
  await expect(page.getByRole('heading', { name: 'Leave', level: 1 })).toBeVisible();
  await expect(page.getByText('Apply for Leave')).toBeVisible();
});

// Test applying for a new leave
test('User can apply for leave', async ({ page }) => {
  await page.goto('https://hrray.netlify.app/leave');
  await page.click('button:text("Apply Leave")');

  await page.fill('input[name="start_date"]', '2025-06-01');
  await page.fill('input[name="end_date"]', '2025-06-03');
  await page.selectOption('select[name="leave_type"]', 'Annual Leave');
  await page.fill('textarea[name="reason"]', 'Personal trip');
  await page.click('button:text("Submit")');

  await expect(page.getByText('Leave request submitted')).toBeVisible();
});

// Test approving a leave (assuming admin user)
test('Admin can approve a leave request', async ({ page }) => {
  await page.goto('https://hrray.netlify.app/admin/leave');
  await page.click('text=Pending Approvals');

  const firstApprovalButton = page.locator('button:text("Approve")').first();
  await expect(firstApprovalButton).toBeVisible();
  await firstApprovalButton.click();

  await expect(page.getByText('Leave approved successfully')).toBeVisible();
});

// Test removing (cancelling) a leave request
test('User can cancel their leave request', async ({ page }) => {
  await page.goto('https://hrray.netlify.app/leave/history');
  const cancelButton = page.locator('button:text("Cancel")').first();

  await expect(cancelButton).toBeVisible();
  await cancelButton.click();
  await expect(page.getByText('Leave request cancelled')).toBeVisible();
});

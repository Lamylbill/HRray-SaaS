import { test, expect } from '@playwright/test';

test('Blog page loads with posts', async ({ page }) => {
  await page.goto('https://hrray.netlify.app/blog');
  await expect(page.getByRole('heading', { name: 'Blog' })).toBeVisible();
  await expect(page.getByText('Latest articles and updates')).toBeVisible();
  await expect(page.locator('text=Read more →').first()).toBeVisible();
});

test('Navigates to first blog post', async ({ page }) => {
  await page.goto('https://hrray.netlify.app/blog');
  const firstPost = page.locator('text=Read more →').first();
  await firstPost.click();
  await expect(page.locator('article')).toBeVisible(); // assumes your post content is in an <article> tag
});

# Test info

- Name: Blog page loads with posts
- Location: /home/user/hrflow-automate-1ab5d4b2/tests/touch tests/blog.spec.ts:3:1

# Error details

```
Error: browserType.launch: 
╔══════════════════════════════════════════════════════╗
║ Host system is missing dependencies to run browsers. ║
║ Missing libraries:                                   ║
║     libglib-2.0.so.0                                 ║
║     libgobject-2.0.so.0                              ║
║     libnss3.so                                       ║
║     libnssutil3.so                                   ║
║     libnspr4.so                                      ║
║     libdbus-1.so.3                                   ║
║     libatk-1.0.so.0                                  ║
║     libatk-bridge-2.0.so.0                           ║
║     libgio-2.0.so.0                                  ║
║     libexpat.so.1                                    ║
║     libatspi.so.0                                    ║
║     libX11.so.6                                      ║
║     libXcomposite.so.1                               ║
║     libXdamage.so.1                                  ║
║     libXext.so.6                                     ║
║     libXfixes.so.3                                   ║
║     libXrandr.so.2                                   ║
║     libgbm.so.1                                      ║
║     libxcb.so.1                                      ║
║     libxkbcommon.so.0                                ║
║     libudev.so.1                                     ║
║     libasound.so.2                                   ║
╚══════════════════════════════════════════════════════╝
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
>  3 | test('Blog page loads with posts', async ({ page }) => {
     | ^ Error: browserType.launch: 
   4 |   await page.goto('https://hrray.netlify.app/blog');
   5 |   await expect(page.getByRole('heading', { name: 'Blog' })).toBeVisible();
   6 |   await expect(page.getByText('Latest articles and updates')).toBeVisible();
   7 |   await expect(page.locator('text=Read more →').first()).toBeVisible();
   8 | });
   9 |
  10 | test('Navigates to first blog post', async ({ page }) => {
  11 |   await page.goto('https://hrray.netlify.app/blog');
  12 |   const firstPost = page.locator('text=Read more →').first();
  13 |   await firstPost.click();
  14 |   await expect(page.locator('article')).toBeVisible(); // assumes your post content is in an <article> tag
  15 | });
  16 |
```
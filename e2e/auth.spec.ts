import { test, expect } from '@playwright/test';

test.describe('User Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login portal correctly', async ({ page }) => {
    // Check if login portal is accessible
    await page.click('text=Login');
    await expect(page).toHaveURL(/.*login.*/);
    
    // Verify login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should login as admin successfully', async ({ page }) => {
    await page.click('text=Login');
    
    // Fill login form
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Wait for navigation and verify admin dashboard
    await page.waitForURL(/.*dashboard.*/);
    await expect(page.locator('text=Admin Panel')).toBeVisible();
    await expect(page.locator('text=Test Admin')).toBeVisible();
  });

  test('should login as seller successfully', async ({ page }) => {
    await page.click('text=Login');
    
    // Fill login form
    await page.fill('input[type="email"]', 'seller@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Wait for navigation and verify seller dashboard
    await page.waitForURL(/.*dashboard.*/);
    await expect(page.locator('text=Seller Dashboard')).toBeVisible();
    await expect(page.locator('text=Test Seller')).toBeVisible();
  });

  test('should login as customer successfully', async ({ page }) => {
    await page.click('text=Login');
    
    // Fill login form
    await page.fill('input[type="email"]', 'customer@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Wait for navigation and verify customer dashboard
    await page.waitForURL(/.*dashboard.*/);
    await expect(page.locator('text=Customer Dashboard')).toBeVisible();
    await expect(page.locator('text=Test Customer')).toBeVisible();
  });

  test('should handle invalid login credentials', async ({ page }) => {
    await page.click('text=Login');
    
    // Fill with invalid credentials
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Verify error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.click('text=Login');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL(/.*dashboard.*/);
    
    // Logout
    await page.click('text=Logout');
    
    // Verify redirect to home page
    await page.waitForURL('/');
    await expect(page.locator('text=Login')).toBeVisible();
  });
});

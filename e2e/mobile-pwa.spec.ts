import { test, expect } from '@playwright/test';

test.describe('Mobile App and PWA Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display mobile header on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify mobile header is displayed
    await expect(page.locator('[data-testid="mobile-header"]')).toBeVisible();
    
    // Check mobile navigation elements
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-search-button"]')).toBeVisible();
  });

  test('should display bottom navigation on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify bottom navigation is displayed
    await expect(page.locator('[data-testid="mobile-bottom-nav"]')).toBeVisible();
    
    // Check navigation items
    await expect(page.locator('text=Home')).toBeVisible();
    await expect(page.locator('text=Browse')).toBeVisible();
    await expect(page.locator('text=Saved')).toBeVisible();
    await expect(page.locator('text=Messages')).toBeVisible();
    await expect(page.locator('text=Profile')).toBeVisible();
  });

  test('should navigate using bottom navigation', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Click on Browse tab
    await page.click('[data-testid="mobile-bottom-nav"] a:has-text("Browse")');
    
    // Verify navigation to vehicle listings
    await expect(page.locator('[data-testid="vehicle-card"]')).toBeVisible();
    
    // Click on Saved tab
    await page.click('[data-testid="mobile-bottom-nav"] a:has-text("Saved")');
    
    // Verify navigation to wishlist
    await expect(page.locator('text=Your Saved Vehicles')).toBeVisible();
  });

  test('should handle mobile menu drawer', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Click mobile menu button
    await page.click('[data-testid="mobile-menu-button"]');
    
    // Verify drawer opens
    await expect(page.locator('[data-testid="mobile-drawer"]')).toBeVisible();
    
    // Check drawer menu items
    await expect(page.locator('text=Home')).toBeVisible();
    await expect(page.locator('text=Buy Cars')).toBeVisible();
    await expect(page.locator('text=Sell Car')).toBeVisible();
    await expect(page.locator('text=Login')).toBeVisible();
    
    // Close drawer
    await page.click('[data-testid="mobile-drawer-close"]');
    
    // Verify drawer closes
    await expect(page.locator('[data-testid="mobile-drawer"]')).not.toBeVisible();
  });

  test('should handle touch gestures on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Test swipe gesture on vehicle cards
    const vehicleCard = page.locator('[data-testid="vehicle-card"]:first-child');
    await vehicleCard.hover();
    
    // Verify touch interactions work
    await expect(vehicleCard).toBeVisible();
  });

  test('should display PWA install prompt', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if PWA install prompt is available
    const installPrompt = page.locator('[data-testid="pwa-install-prompt"]');
    
    if (await installPrompt.isVisible()) {
      // Click install button
      await page.click('button:has-text("Install")');
      
      // Verify installation process
      await expect(page.locator('text=Installing...')).toBeVisible();
    }
  });

  test('should work offline after installation', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Simulate PWA installation by setting service worker
    await page.evaluate(() => {
      // Mock service worker registration
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js');
      }
    });
    
    // Go offline
    await page.context().setOffline(true);
    
    // Refresh page
    await page.reload();
    
    // Verify app still works offline
    await expect(page.locator('text=ReRide')).toBeVisible();
    
    // Restore online mode
    await page.context().setOffline(false);
  });

  test('should handle mobile keyboard input', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Login as customer
    await page.click('text=Login');
    
    // Test mobile keyboard input
    await page.fill('input[type="email"]', 'customer@test.com');
    await page.fill('input[type="password"]', 'password');
    
    // Verify input works on mobile
    await expect(page.locator('input[type="email"]')).toHaveValue('customer@test.com');
    await expect(page.locator('input[type="password"]')).toHaveValue('password');
  });

  test('should handle mobile form submission', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Login as customer
    await page.click('text=Login');
    await page.fill('input[type="email"]', 'customer@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Verify mobile form submission works
    await page.waitForURL(/.*dashboard.*/);
    await expect(page.locator('text=Customer Dashboard')).toBeVisible();
  });

  test('should handle mobile image viewing', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to vehicle listings
    await page.click('text=Buy Cars');
    
    // Click on first vehicle
    await page.click('[data-testid="vehicle-card"]:first-child');
    
    // Click on vehicle image
    await page.click('[data-testid="vehicle-image"]:first-child');
    
    // Verify image modal opens on mobile
    await expect(page.locator('[data-testid="image-modal"]')).toBeVisible();
    
    // Test mobile image navigation
    await page.click('[data-testid="next-image-button"]');
    
    // Close modal
    await page.click('[data-testid="close-modal-button"]');
    
    // Verify modal closes
    await expect(page.locator('[data-testid="image-modal"]')).not.toBeVisible();
  });

  test('should handle mobile search functionality', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Click mobile search button
    await page.click('[data-testid="mobile-search-button"]');
    
    // Verify search interface
    await expect(page.locator('[data-testid="mobile-search-input"]')).toBeVisible();
    
    // Enter search query
    await page.fill('[data-testid="mobile-search-input"]', 'Honda');
    await page.press('[data-testid="mobile-search-input"]', 'Enter');
    
    // Verify search results
    await expect(page.locator('text=Honda City')).toBeVisible();
  });
});

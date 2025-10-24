# 🎭 End-to-End Testing Guide for ReRide

## Overview

This document provides comprehensive guidance for running and maintaining End-to-End (E2E) tests for the ReRide application using Playwright.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- Application running on `http://localhost:5173`

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI mode (interactive)
npm run test:e2e:ui

# Run E2E tests in headed mode (visible browser)
npm run test:e2e:headed

# Run E2E tests in debug mode
npm run test:e2e:debug

# View test report
npm run test:e2e:report

# Install Playwright browsers
npm run test:e2e:install
```

## 📁 Test Structure

```
e2e/
├── auth.spec.ts              # Authentication flow tests
├── vehicle-listing.spec.ts   # Vehicle listing and search tests
├── seller-dashboard.spec.ts  # Seller dashboard functionality
├── admin-panel.spec.ts       # Admin panel management
├── chat-messaging.spec.ts    # Chat and messaging system
├── mobile-pwa.spec.ts        # Mobile app and PWA functionality
├── performance.spec.ts       # Performance and load testing
├── user-journey.spec.ts      # Complete user journey tests
├── global-setup.ts           # Global test setup
└── global-teardown.ts        # Global test cleanup
```

## 🧪 Test Categories

### 1. Authentication Flow (`auth.spec.ts`)
- ✅ User login/logout functionality
- ✅ Role-based authentication (Admin, Seller, Customer)
- ✅ Invalid credential handling
- ✅ Session management

### 2. Vehicle Listing and Search (`vehicle-listing.spec.ts`)
- ✅ Vehicle display and navigation
- ✅ Search and filtering functionality
- ✅ Wishlist management
- ✅ Vehicle comparison
- ✅ Price and location filters

### 3. Seller Dashboard (`seller-dashboard.spec.ts`)
- ✅ Dashboard navigation and display
- ✅ Vehicle listing management (Add, Edit, Delete)
- ✅ Analytics and reporting
- ✅ Message management
- ✅ Profile management

### 4. Admin Panel (`admin-panel.spec.ts`)
- ✅ User management
- ✅ Vehicle moderation
- ✅ Platform analytics
- ✅ Settings management
- ✅ Data export functionality

### 5. Chat and Messaging (`chat-messaging.spec.ts`)
- ✅ Message initiation and sending
- ✅ Real-time messaging
- ✅ Notification system
- ✅ Message status management
- ✅ Mobile chat functionality

### 6. Mobile App and PWA (`mobile-pwa.spec.ts`)
- ✅ Mobile responsive design
- ✅ Touch interactions
- ✅ PWA installation
- ✅ Offline functionality
- ✅ Mobile navigation

### 7. Performance Testing (`performance.spec.ts`)
- ✅ Page load performance
- ✅ Large dataset handling
- ✅ Memory usage monitoring
- ✅ Network latency handling
- ✅ Offline mode testing

### 8. Complete User Journeys (`user-journey.spec.ts`)
- ✅ Customer registration to purchase inquiry
- ✅ Seller registration to vehicle listing
- ✅ Admin management workflow
- ✅ Cross-browser compatibility

## 🔧 Configuration

### Playwright Configuration (`playwright.config.ts`)

```typescript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

## 🎯 Test Data Management

### Global Setup (`global-setup.ts`)
- Seeds test users (Admin, Seller, Customer)
- Creates test vehicles
- Sets up test conversations
- Prepares localStorage data

### Test Data Structure
```typescript
// Test Users
const testUsers = [
  { email: 'admin@test.com', password: 'password', role: 'admin' },
  { email: 'seller@test.com', password: 'password', role: 'seller' },
  { email: 'customer@test.com', password: 'password', role: 'customer' }
];

// Test Vehicles
const testVehicles = [
  { make: 'Honda', model: 'City', price: 850000, sellerEmail: 'seller@test.com' },
  { make: 'Maruti', model: 'Swift', price: 650000, sellerEmail: 'seller@test.com' }
];
```

## 📊 Test Reports

### HTML Report
- Interactive test results
- Screenshots and videos of failures
- Test execution timeline
- Browser-specific results

### JSON Report
- Machine-readable test results
- CI/CD integration
- Test metrics and performance data

### JUnit Report
- Standard XML format
- CI/CD pipeline integration
- Test result aggregation

## 🚨 Debugging Failed Tests

### Common Issues and Solutions

1. **Test Timeout**
   ```bash
   # Increase timeout in playwright.config.ts
   timeout: 60 * 1000, // 60 seconds
   ```

2. **Element Not Found**
   ```typescript
   // Use more specific selectors
   await page.locator('[data-testid="specific-element"]').click();
   ```

3. **Network Issues**
   ```typescript
   // Wait for network to be idle
   await page.waitForLoadState('networkidle');
   ```

4. **Mobile Testing Issues**
   ```typescript
   // Set proper viewport
   await page.setViewportSize({ width: 375, height: 667 });
   ```

### Debug Commands
```bash
# Run specific test file
npx playwright test auth.spec.ts

# Run specific test
npx playwright test auth.spec.ts -g "should login as admin"

# Debug mode
npx playwright test --debug

# Trace viewer
npx playwright show-trace trace.zip
```

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:e2e:install
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## 📈 Performance Benchmarks

### Expected Performance Metrics
- **Page Load Time**: < 3 seconds
- **Search Response**: < 1 second
- **Message Sending**: < 500ms
- **Form Submission**: < 2 seconds
- **Image Loading**: < 2 seconds

### Memory Usage Limits
- **JavaScript Heap**: < 50MB
- **Total Memory**: < 100MB
- **Page Memory**: < 30MB

## 🛠️ Maintenance

### Regular Tasks
1. **Update Test Data**: Keep test data current with application changes
2. **Review Test Results**: Analyze failed tests and update accordingly
3. **Performance Monitoring**: Track performance metrics over time
4. **Browser Updates**: Test with latest browser versions

### Test Maintenance Checklist
- [ ] Update selectors when UI changes
- [ ] Verify test data accuracy
- [ ] Check performance benchmarks
- [ ] Update browser compatibility
- [ ] Review and update test scenarios

## 🎉 Benefits of E2E Testing

### Quality Assurance
- ✅ End-to-end user journey validation
- ✅ Cross-browser compatibility
- ✅ Mobile responsiveness
- ✅ Performance monitoring
- ✅ Regression prevention

### Development Benefits
- ✅ Faster bug detection
- ✅ Automated testing pipeline
- ✅ Confidence in deployments
- ✅ Better user experience
- ✅ Reduced manual testing

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Test Automation Guide](https://playwright.dev/docs/test-automation)
- [CI/CD Integration](https://playwright.dev/docs/ci)

---

## 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   npm run test:e2e:install
   ```

2. **Start Application**
   ```bash
   npm run dev
   ```

3. **Run Tests**
   ```bash
   npm run test:e2e
   ```

4. **View Results**
   ```bash
   npm run test:e2e:report
   ```

The E2E testing suite provides comprehensive coverage of all critical user journeys and ensures the ReRide application works reliably across different browsers and devices.

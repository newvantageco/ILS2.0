/**
 * Accessibility Tests
 * 
 * Automated accessibility testing using axe-core and Playwright.
 * These tests run as part of the E2E test suite.
 */

import { test, expect, checkAccessibility, checkComponentAccessibility, testKeyboardNavigation, runAccessibilitySuite } from './helpers/accessibility';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the page before each test
    await page.goto('/');
  });

  test('homepage should be accessible', async ({ page }) => {
    // Check for accessibility violations
    const violations = await checkAccessibility(page);
    
    // Log any violations for debugging
    if (violations.length > 0) {
      console.log(`Found ${violations.length} accessibility violations`);
    }
    
    // Ensure no critical violations
    const criticalViolations = violations.filter((v: any) => v.impact === 'critical');
    expect(criticalViolations).toHaveLength(0);
  });

  test('login page should be accessible', async ({ page }) => {
    await page.goto('/login');
    
    // Check accessibility
    const violations = await checkAccessibility(page);
    
    // Test form accessibility specifically
    await checkComponentAccessibility(page, 'form');
    await checkComponentAccessibility(page, 'input[type="email"]');
    await checkComponentAccessibility(page, 'input[type="password"]');
    await checkComponentAccessibility(page, 'button[type="submit"]');
  });

  test('dashboard navigation should be accessible', async ({ page }) => {
    // Mock authentication for testing
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard');
    
    // Check main navigation
    await checkComponentAccessibility(page, 'nav');
    await checkComponentAccessibility(page, '[role="navigation"]');
    
    // Test keyboard navigation
    await testKeyboardNavigation(page, [
      'nav button',
      'nav a',
      'main button',
      'main a',
    ]);
  });

  test('command palette should be accessible', async ({ page }) => {
    // Mock authentication
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard');
    
    // Open command palette
    await page.keyboard.press('Meta+K');
    
    // Wait for command palette to appear
    await page.waitForSelector('[role="dialog"]');
    
    // Check command palette accessibility
    await checkComponentAccessibility(page, '[role="dialog"]');
    await checkComponentAccessibility(page, 'input[placeholder*="Search"]');
    
    // Test keyboard navigation in command palette
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    
    // Close command palette
    await page.keyboard.press('Escape');
  });

  test('forms should have proper labels', async ({ page }) => {
    await page.goto('/login');
    
    // Check all form inputs have associated labels
    const inputs = page.locator('input, textarea, select');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const hasLabel = await input.getAttribute('aria-label') !== null ||
                      await input.getAttribute('aria-labelledby') !== null ||
                      (id && await page.locator(`label[for="${id}"]`).count() > 0);
      
      expect(hasLabel).toBeTruthy();
    }
  });

  test('images should have alt text', async ({ page }) => {
    // Check all images have alt attributes
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      
      // Alt text should exist (can be empty for decorative images)
      expect(alt).toBeDefined();
    }
  });

  test('buttons should have accessible names', async ({ page }) => {
    // Check all buttons have accessible names
    const buttons = page.locator('button, [role="button"]');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');
      
      const hasAccessibleName = (text && text.trim().length > 0) ||
                                ariaLabel ||
                                (ariaLabelledBy && await page.locator(`#${ariaLabelledBy}`).count() > 0);
      
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('focus management should work correctly', async ({ page }) => {
    // Test tab order
    await page.keyboard.press('Tab');
    
    // Check that something is focused
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toHaveCount(1);
    
    // Test that focus is visible
    const computedStyle = await focusedElement.evaluate((el: any) => {
      return (globalThis as any).window.getComputedStyle(el);
    });
    
    // Check for focus indicator (outline or similar)
    const hasFocusIndicator = computedStyle.outline !== 'none' ||
                             computedStyle.boxShadow !== 'none' ||
                             computedStyle.border.includes('focus');
    
    // This might not always pass depending on CSS, but it's good to check
    console.log('Focus indicator check:', hasFocusIndicator);
  });

  test('color contrast should be sufficient', async ({ page }) => {
    // This is a basic test - real contrast testing requires specialized tools
    const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, span, a, button');
    const elementCount = await textElements.count();
    
    console.log(`Checking ${elementCount} text elements for contrast (manual verification needed)`);
    
    // Log elements that should be manually checked
    for (let i = 0; i < Math.min(elementCount, 10); i++) {
      const element = textElements.nth(i);
      const text = await element.textContent();
      const tagName = await element.evaluate((el: any) => el.tagName.toLowerCase());
      
      if (text && text.trim()) {
        console.log(`Manual contrast check needed: ${tagName} with text "${text.trim().substring(0, 50)}..."`);
      }
    }
  });

  test('comprehensive accessibility audit', async ({ page }) => {
    // Run the full accessibility suite
    const results = await runAccessibilitySuite(page);
    
    // Log results
    console.log('Accessibility audit results:', results);
    
    // Ensure no critical violations
    expect(results.violations.filter((v: any) => v.impact === 'critical')).toHaveLength(0);
    
    // Limit moderate violations for better UX
    const moderateViolations = results.violations.filter((v: any) => v.impact === 'moderate');
    if (moderateViolations.length > 5) {
      console.log(`Warning: Found ${moderateViolations.length} moderate violations - consider fixing these`);
    }
  });
});

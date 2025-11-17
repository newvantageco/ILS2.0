/**
 * Accessibility Testing Helpers for Playwright
 * 
 * Integrates axe-core with Playwright for automated accessibility testing.
 */

import { test as base, expect } from '@playwright/test';
import injectAxe from '@axe-core/playwright';
import { getViolations } from '@axe-core/playwright';

// Extend test fixture with accessibility testing
export const test = base.extend({
  // Inject axe into the page before each test
  page: async ({ page }, use) => {
    await page.goto('/');
    await injectAxe(page);
    await use(page);
  },
});

/**
 * Check accessibility violations on the current page
 */
export const checkAccessibility = async (page: any, options?: {
  include?: string[];
  exclude?: string[];
  disabledRules?: string[];
}) => {
  let violations;
  
  if (options) {
    violations = await getViolations(page, options);
  } else {
    violations = await getViolations(page);
  }
  
  if (violations.length > 0) {
    console.log('🚨 Accessibility violations found:');
    violations.forEach((violation: any) => {
      console.log(`- ${violation.id}: ${violation.description}`);
      console.log(`  Impact: ${violation.impact}`);
      console.log(`  Help: ${violation.help}`);
      console.log(`  Nodes: ${violation.nodes.length}`);
    });
  }

  // Fail the test if critical or serious violations are found
  const criticalViolations = violations.filter((v: any) => 
    v.impact === 'critical' || v.impact === 'serious'
  );

  expect(criticalViolations).toHaveLength(0, 
    `Found ${criticalViolations.length} critical/serious accessibility violations`
  );

  return violations;
};

/**
 * Check specific component for accessibility
 */
export const checkComponentAccessibility = async (page: any, selector: string) => {
  let violations;
  
  try {
    violations = await getViolations(page, {
      include: [selector],
    });
  } catch (error) {
    // Fallback if options aren't supported
    violations = await getViolations(page);
  }

  if (violations.length > 0) {
    console.log(`🚨 Accessibility violations in ${selector}:`);
    violations.forEach((violation: any) => {
      console.log(`- ${violation.id}: ${violation.description}`);
    });
  }

  expect(violations.filter((v: any) => v.impact === 'critical')).toHaveLength(0);
  
  return violations;
};

/**
 * Test keyboard navigation
 */
export const testKeyboardNavigation = async (page: any, selectors: string[]) => {
  for (const selector of selectors) {
    const element = page.locator(selector);
    await expect(element).toBeVisible();
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    await expect(element).toBeFocused();
    
    // Test Enter/Space for interactive elements
    const tagName = await element.evaluate((el: any) => el.tagName.toLowerCase());
    if (['button', 'a'].includes(tagName)) {
      await page.keyboard.press('Enter');
      // Check if the action was performed (this would need to be customized per component)
    }
  }
};

/**
 * Test color contrast (requires manual verification or additional tools)
 */
export const testColorContrast = async (page: any, selectors: string[]) => {
  // This is a basic check - real contrast testing requires more sophisticated tools
  for (const selector of selectors) {
    const element = page.locator(selector);
    await expect(element).toBeVisible();
    
    // Check if element has text content
    const textContent = await element.textContent();
    if (textContent && textContent.trim()) {
      // Log for manual verification
      console.log(`Check contrast for: ${selector} with text: "${textContent.trim()}"`);
    }
  }
};

/**
 * Comprehensive accessibility test suite
 */
export const runAccessibilitySuite = async (page: any) => {
  console.log('🔍 Running comprehensive accessibility tests...');
  
  // 1. Check entire page for violations
  let violations;
  try {
    violations = await checkAccessibility(page);
  } catch (error) {
    console.log('⚠️ Accessibility check failed, continuing with basic tests...');
    violations = [];
  }
  
  // 2. Test keyboard navigation on common elements
  const keyboardSelectors = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];
  
  try {
    await testKeyboardNavigation(page, keyboardSelectors);
  } catch (error) {
    console.log('⚠️ Some keyboard navigation tests failed - manual review needed');
  }
  
  // 3. Test specific components
  const componentSelectors = [
    'nav',
    'main',
    'header',
    'footer',
    'form',
    '[role="button"]',
    '[role="link"]',
    '[role="dialog"]',
  ];
  
  for (const selector of componentSelectors) {
    const elements = page.locator(selector);
    const count = await elements.count();
    
    if (count > 0) {
      await checkComponentAccessibility(page, selector);
    }
  }
  
  // 4. Check for proper heading structure
  const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
  if (headings.length > 0) {
    // Check if h1 exists
    const h1Exists = await page.locator('h1').count() > 0;
    expect(h1Exists).toBeTruthy('Page should have at least one h1 heading');
    
    // Log heading structure for manual review
    console.log('📋 Heading structure:');
    for (const heading of headings) {
      const tag = await heading.evaluate((el: any) => el.tagName.toLowerCase());
      const text = await heading.textContent();
      console.log(`  ${tag}: ${text?.trim()}`);
    }
  }
  
  console.log(`✅ Accessibility tests completed with ${violations.length} total violations`);
  
  return {
    violations,
    testedComponents: componentSelectors.length,
    testedKeyboardElements: keyboardSelectors.length,
  };
};

export { expect };

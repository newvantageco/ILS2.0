/**
 * Accessibility Testing Utilities
 * 
 * Integrates axe-core for automated accessibility testing in development and CI.
 * Provides runtime accessibility checking and reporting.
 */

import axe from '@axe-core/react';

// Configure axe for the application
export const configureAccessibility = () => {
  if (process.env.NODE_ENV === 'development') {
    // Enable axe in development
    axe(React, {
      // Include only critical rules for development
      rules: {
        // Color contrast is important for readability
        'color-contrast': { enabled: true },
        // Alt text for images
        'image-alt': { enabled: true },
        // Button names
        'button-name': { enabled: true },
        // Link purpose
        'link-name': { enabled: true },
        // Label guidance
        'label': { enabled: true },
        // Heading hierarchy
        'heading-order': { enabled: true },
        // Focus management
        'tabindex': { enabled: true },
        // ARIA attributes
        'aria-allowed-attr': { enabled: true },
        'aria-hidden-body': { enabled: true },
        'aria-hidden-focus': { enabled: true },
        'aria-input-field-name': { enabled: true },
        'aria-required-attr': { enabled: true },
        'aria-required-children': { enabled: true },
        'aria-required-parent': { enabled: true },
        'aria-roles': { enabled: true },
        'aria-valid-attr': { enabled: true },
        'aria-valid-attr-value': { enabled: true },
        // Keyboard navigation
        'keyboard': { enabled: true },
        'focus-order-semantics': { enabled: true },
        // Form accessibility
        'form-field-multiple-labels': { enabled: true },
        'form-fieldset': { enabled: true },
        'form-field-legend': { enabled: true },
        'form-label': { enabled: true },
        'form-valid-attribute-value': { enabled: true },
        // Interactive elements
        'interactive-element-is-focusable': { enabled: true },
        'interactive-supports-focus': { enabled: true },
        'role-img-alt': { enabled: true },
        // Skip links
        'skip-link': { enabled: true },
        // Table accessibility
        'table-headers': { enabled: true },
        'th-has-data-cells': { enabled: true },
        'td-headers-attr': { enabled: true },
      },
      // Exclude known safe elements from testing
      exclude: [
        ['[aria-hidden="true"]'],
        ['.sr-only'],
        ['[data-testid="loading-spinner"]'],
      ],
    });
  }
};

/**
 * Run accessibility audit on a specific element
 */
export const runAccessibilityAudit = async (element?: HTMLElement) => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  try {
    const results = await axe.run(element || document.body);
    
    if (results.violations.length > 0) {
      console.group('🚨 Accessibility Violations Found');
      results.violations.forEach((violation) => {
        console.warn(`${violation.id}: ${violation.description}`);
        console.warn('Impact:', violation.impact);
        console.warn('Help:', violation.help);
        console.warn('Help URL:', violation.helpUrl);
        violation.nodes.forEach((node) => {
          console.warn('Target:', node.target.join(', '));
          if (node.failureSummary) {
            console.warn('Failure:', node.failureSummary);
          }
        });
        console.warn('---');
      });
      console.groupEnd();
    }

    return results;
  } catch (error) {
    console.error('Accessibility audit failed:', error);
    return null;
  }
};

/**
 * Accessibility test result interface
 */
export interface AccessibilityTestResult {
  violations: Array<{
    id: string;
    description: string;
    impact: 'minor' | 'moderate' | 'serious' | 'critical';
    help: string;
    helpUrl: string;
    nodes: Array<{
      target: string[];
      failureSummary?: string;
    }>;
  }>;
  passes: Array<{
    id: string;
    description: string;
    nodes: Array<{
      target: string[];
    }>;
  }>;
}

/**
 * Check if element meets basic accessibility requirements
 */
export const checkElementAccessibility = (element: HTMLElement): boolean => {
  // Basic checks that should always pass
  const checks = [
    // Interactive elements should be focusable
    () => {
      if (element.tagName === 'BUTTON' || element.tagName === 'A') {
        return element.tabIndex >= 0;
      }
      return true;
    },
    // Images should have alt text
    () => {
      if (element.tagName === 'IMG') {
        return element.hasAttribute('alt');
      }
      return true;
    },
    // Form inputs should have labels
    () => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName)) {
        const id = element.getAttribute('id');
        if (id) {
          return !!document.querySelector(`label[for="${id}"]`);
        }
        return element.hasAttribute('aria-label') || element.hasAttribute('aria-labelledby');
      }
      return true;
    },
  ];

  return checks.every(check => check());
};

/**
 * Generate accessibility report for CI
 */
export const generateAccessibilityReport = async (): Promise<string> => {
  const results = await runAccessibilityAudit();
  
  if (!results) {
    return 'Accessibility testing is disabled in production.';
  }

  const report = [
    '# Accessibility Report',
    `Generated: ${new Date().toISOString()}`,
    '',
    `## Summary`,
    `- Violations: ${results.violations.length}`,
    `- Passes: ${results.passes.length}`,
    '',
  ];

  if (results.violations.length > 0) {
    report.push('## Violations');
    results.violations.forEach((violation, index) => {
      report.push(`### ${index + 1}. ${violation.id}`);
      report.push(`**Impact:** ${violation.impact}`);
      report.push(`**Description:** ${violation.description}`);
      report.push(`**Help:** ${violation.help}`);
      report.push(`**URL:** ${violation.helpUrl}`);
      report.push(`**Affected Elements:** ${violation.nodes.length}`);
      report.push('');
    });
  }

  return report.join('\n');
};

// Default export for convenience
export default {
  configureAccessibility,
  runAccessibilityAudit,
  checkElementAccessibility,
  generateAccessibilityReport,
};

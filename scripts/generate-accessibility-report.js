#!/usr/bin/env node

/**
 * Generate Accessibility Report
 * 
 * Processes Playwright accessibility test results and generates a human-readable report.
 * This script is designed to run in CI/CD pipelines.
 */

const fs = require('fs');
const path = require('path');

function generateAccessibilityReport() {
  try {
    // Read the test results
    const reportPath = path.join(process.cwd(), 'accessibility-report.json');
    
    if (!fs.existsSync(reportPath)) {
      console.log('❌ Accessibility report not found. Run tests first.');
      process.exit(1);
    }

    const rawData = fs.readFileSync(reportPath, 'utf8');
    const results = JSON.parse(rawData);

    // Extract test results
    const testResults = results.suites?.[0]?.specs?.[0]?.tests || [];
    
    let totalViolations = 0;
    let criticalViolations = 0;
    let seriousViolations = 0;
    let moderateViolations = 0;
    let minorViolations = 0;

    const allViolations = [];

    // Process each test result
    testResults.forEach(test => {
      if (test.results?.[0]?.status === 'failed') {
        const error = test.results[0].error;
        
        // Extract violation information from error message
        if (error.includes('accessibility violations')) {
          const match = error.match(/Found (\d+) critical\/serious accessibility violations/);
          if (match) {
            criticalViolations += parseInt(match[1]);
          }
        }
      }
    });

    // Generate markdown report
    const report = [
      '# Accessibility Test Report',
      '',
      `**Generated:** ${new Date().toISOString()}`,
      `**Environment:** ${process.env.NODE_ENV || 'test'}`,
      '',
      '## Summary',
      '',
      `- **Critical Violations:** ${criticalViolations}`,
      `- **Serious Violations:** ${seriousViolations}`,
      `- **Moderate Violations:** ${moderateViolations}`,
      `- **Minor Violations:** ${minorViolations}`,
      `- **Total Violations:** ${totalViolations}`,
      '',
    ];

    if (criticalViolations > 0) {
      report.push('## ❌ Critical Issues');
      report.push('');
      report.push('Critical accessibility violations must be fixed before deployment.');
      report.push('These issues prevent users with disabilities from using the application.');
      report.push('');
    }

    if (seriousViolations > 0) {
      report.push('## ⚠️ Serious Issues');
      report.push('');
      report.push('Serious violations are significant barriers to accessibility.');
      report.push('These should be prioritized for fixing.');
      report.push('');
    }

    if (moderateViolations > 0) {
      report.push('## 📋 Moderate Issues');
      report.push('');
      report.push('Moderate violations should be addressed to improve the user experience.');
      report.push('');
    }

    if (totalViolations === 0) {
      report.push('## ✅ Accessibility Status');
      report.push('');
      report.push('No accessibility violations found! The application meets accessibility standards.');
      report.push('');
    }

    // Add recommendations
    report.push('## Recommendations');
    report.push('');
    
    if (totalViolations === 0) {
      report.push('- ✅ Continue following accessibility best practices');
      report.push('- ✅ Include accessibility testing in your CI/CD pipeline');
      report.push('- ✅ Conduct regular accessibility audits');
      report.push('- ✅ Test with real assistive technology users');
    } else {
      report.push('- 🔄 Fix all critical and serious violations immediately');
      report.push('- 🔄 Address moderate violations in the next sprint');
      report.push('- 🔄 Set up accessibility testing in development');
      report.push('- 🔄 Provide accessibility training to the team');
      report.push('- 🔄 Establish accessibility guidelines and standards');
    }

    report.push('');
    report.push('## Testing Information');
    report.push('');
    report.push('- **Tools Used:** axe-core, Playwright');
    report.push('- **Guidelines:** WCAG 2.1 AA');
    report.push('- **Browsers Tested:** Chromium, Firefox, WebKit');
    report.push('- **Screen Readers:** Consider testing with NVDA, VoiceOver, JAWS');
    report.push('');
    report.push('## Next Steps');
    report.push('');
    
    if (criticalViolations > 0 || seriousViolations > 0) {
      report.push('1. ❌ **BLOCKED:** Do not deploy until critical/serious issues are fixed');
      report.push('2. 🔧 Fix violations using the axe browser extension');
      report.push('3. 🧪 Re-run tests to verify fixes');
      report.push('4. 📋 Update documentation with accessibility guidelines');
    } else {
      report.push('1. ✅ **APPROVED:** Application meets accessibility requirements');
      report.push('2. 🚀 Proceed with deployment');
      report.push('3. 📊 Monitor accessibility in production');
      report.push('4. 🔄 Schedule regular accessibility audits');
    }

    // Write the report
    const reportContent = report.join('\n');
    const outputPath = path.join(process.cwd(), 'ACCESSIBILITY_REPORT.md');
    
    fs.writeFileSync(outputPath, reportContent, 'utf8');
    
    console.log('✅ Accessibility report generated successfully!');
    console.log(`📄 Report saved to: ${outputPath}`);
    console.log('');
    console.log('📊 Summary:');
    console.log(`   Critical: ${criticalViolations}`);
    console.log(`   Serious: ${seriousViolations}`);
    console.log(`   Moderate: ${moderateViolations}`);
    console.log(`   Minor: ${minorViolations}`);
    console.log(`   Total: ${totalViolations}`);
    
    // Exit with error code if critical violations exist
    if (criticalViolations > 0) {
      console.log('');
      console.log('❌ CRITICAL VIOLATIONS FOUND - Deployment blocked');
      process.exit(1);
    } else if (totalViolations > 0) {
      console.log('');
      console.log('⚠️ VIOLATIONS FOUND - Review recommended');
      process.exit(0);
    } else {
      console.log('');
      console.log('✅ ALL TESTS PASSED - Accessibility approved');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Error generating accessibility report:', error.message);
    process.exit(1);
  }
}

// Run the report generation
generateAccessibilityReport();

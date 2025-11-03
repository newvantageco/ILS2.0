const fs = require('fs');
const path = require('path');

// Read App.tsx
const appContent = fs.readFileSync('client/src/App.tsx', 'utf8');

// Extract lazy imports
const lazyImports = [];
const lazyRegex = /const (\w+) = lazy\(\(\) => import\("@\/pages\/([^"]+)"\)\);/g;
let match;
while ((match = lazyRegex.exec(appContent)) !== null) {
  lazyImports.push({ component: match[1], file: match[2] });
}

// Extract routes
const routes = [];
const routeRegex = /<Route path="([^"]+)" component=\{(\w+)\}/g;
while ((match = routeRegex.exec(appContent)) !== null) {
  routes.push({ path: match[1], component: match[2] });
}

// Find imported but not routed components
const routedComponents = new Set(routes.map(r => r.component));
const missingRoutes = lazyImports.filter(imp => !routedComponents.has(imp.component));

console.log('📊 ROUTE ANALYSIS REPORT\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log(`Total lazy-loaded components: ${lazyImports.length}`);
console.log(`Total routes defined: ${routes.length}`);
console.log(`Components without routes: ${missingRoutes.length}\n`);

if (missingRoutes.length > 0) {
  console.log('❌ MISSING ROUTES:\n');
  missingRoutes.forEach(({ component, file }) => {
    console.log(`  • ${component}`);
    console.log(`    File: ${file}`);
    console.log('');
  });
}

// Check for files in pages directory not imported
const pagesDir = 'client/src/pages';
const pageFiles = fs.readdirSync(pagesDir)
  .filter(f => f.endsWith('.tsx') && !f.startsWith('not-found'))
  .map(f => f.replace('.tsx', ''));

const importedFiles = new Set(lazyImports.map(imp => imp.file.split('/').pop()));
const notImported = pageFiles.filter(f => !importedFiles.has(f));

if (notImported.length > 0) {
  console.log('\n⚠️  PAGE FILES NOT IMPORTED:\n');
  notImported.forEach(file => {
    console.log(`  • ${file}.tsx`);
  });
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

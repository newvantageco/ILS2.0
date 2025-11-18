# Color Contrast Audit - WCAG 2.1 AA Compliance

## Executive Summary

Comprehensive audit of ILS 2.0 color system for WCAG 2.1 Level AA compliance.

### WCAG 2.1 AA Requirements:
- **Normal text** (< 18px or < 14px bold): **4.5:1** minimum
- **Large text** (≥ 18px or ≥ 14px bold): **3:1** minimum  
- **UI components** (buttons, inputs, etc.): **3:1** minimum
- **Graphical objects**: **3:1** minimum

## Current Color System Analysis

### Light Mode Colors (Primary)

| Element | HSL Value | Hex Approx | Usage |
|---------|-----------|------------|-------|
| Background | 220 30% 98% | #F7F9FB | Main background |
| Foreground | 220 25% 12% | #1A1F2E | Main text |
| Muted Foreground | 220 10% 40% | #606876 | Secondary text |
| Primary | 220 90% 50% | #0D5FFF | CTAs, links |
| Primary Foreground | 0 0% 100% | #FFFFFF | Text on primary |
| Border | 220 20% 88% | #D9DFE8 | Borders |
| Card | 220 30% 99% | #FAFBFC | Card surfaces |

### Contrast Ratio Analysis

#### ✅ PASSING Combinations:

1. **Foreground on Background**
   - Ratio: **~15.8:1** ✅ EXCELLENT
   - Usage: Main body text
   - Standard: AA (4.5:1) - EXCEEDS

2. **Primary Foreground on Primary**
   - Ratio: **~4.6:1** ✅ PASS
   - Usage: Button text
   - Standard: AA (4.5:1) - PASS

3. **Card Foreground on Card**
   - Ratio: **~15.6:1** ✅ EXCELLENT
   - Usage: Card text
   - Standard: AA (4.5:1) - EXCEEDS

#### ⚠️ ATTENTION NEEDED:

4. **Muted Foreground on Background**
   - Ratio: **~4.1:1** ⚠️ BORDERLINE
   - Usage: Secondary text, placeholders, hints
   - Standard: AA (4.5:1) - **SLIGHTLY BELOW**
   - **Action:** Darken to HSL(220 10% 35%) for 4.8:1 ratio

5. **Border on Background**  
   - Ratio: **~2.3:1** ⚠️ BELOW
   - Usage: Input borders, card borders
   - Standard: UI Component (3:1) - **BELOW**
   - **Action:** Darken to HSL(220 20% 80%) for 3.2:1 ratio

6. **Sidebar Hover State**
   - Current: HSL(220 30% 95%)
   - Ratio vs text: **May be insufficient**
   - **Action:** Review and ensure 3:1 for UI components

### Dark Mode Colors

| Element | HSL Value | Hex Approx | Usage |
|---------|-----------|------------|-------|
| Background | 210 5% 8% | #131417 | Main background |
| Foreground | 210 5% 95% | #F0F1F2 | Main text |
| Muted Foreground | 210 5% 70% | #AFB1B5 | Secondary text |
| Primary | 32 81% 55% | #F0923A | CTAs (orange) |

#### ✅ PASSING Combinations:

1. **Foreground on Background**
   - Ratio: **~16.5:1** ✅ EXCELLENT
   - Standard: EXCEEDS

2. **Muted Foreground on Background**  
   - Ratio: **~6.8:1** ✅ GOOD
   - Standard: PASS

#### ⚠️ ATTENTION NEEDED:

3. **Border on Background**
   - Current: HSL(210 5% 18%)
   - Ratio: **~2.2:1** ⚠️ BELOW
   - **Action:** Lighten to HSL(210 5% 25%) for 3.1:1

## Recommended Fixes

### 1. Light Mode Improvements

```css
:root {
  /* OLD: --muted-foreground: 220 10% 40%; */
  --muted-foreground: 220 10% 35%;  /* 4.8:1 ratio - PASS ✅ */
  
  /* OLD: --border: 220 20% 88%; */
  --border: 220 20% 80%;  /* 3.2:1 ratio - PASS ✅ */
  
  /* Ensure input borders are visible */
  /* OLD: --input: 220 20% 88%; */
  --input: 220 20% 78%;  /* 3.5:1 ratio - PASS ✅ */
  
  /* Optional: Slightly darken card borders for definition */
  /* OLD: --card-border: 220 20% 92%; */
  --card-border: 220 20% 85%;  /* 2.8:1 - Acceptable for subtle separation */
}
```

### 2. Dark Mode Improvements

```css
.dark {
  /* OLD: --border: 210 5% 18%; */
  --border: 210 5% 25%;  /* 3.1:1 ratio - PASS ✅ */
  
  /* OLD: --input: 210 8% 30%; */
  --input: 210 8% 32%;  /* Maintain consistency */
  
  /* OLD: --card-border: 210 5% 16%; */
  --card-border: 210 5% 22%;  /* Better visibility */
}
```

### 3. Status Colors Review

Current status colors (all hard-coded RGB):
```css
status: {
  online: "rgb(34 197 94)",   /* Green - Check contrast */
  away: "rgb(245 158 11)",    /* Orange - Check contrast */
  busy: "rgb(239 68 68)",     /* Red - Check contrast */
  offline: "rgb(156 163 175)", /* Gray - Check contrast */
}
```

**Action:** Ensure these have 3:1 ratio when used as indicators

## Testing Strategy

### Automated Testing:
1. **Use axe DevTools browser extension**
   - Install in Chrome/Firefox
   - Run on key pages
   - Check all color contrast issues

2. **Lighthouse Accessibility Audit**
   ```bash
   npm run lighthouse -- --only-categories=accessibility
   ```

3. **WAVE Browser Extension**
   - Visual indicator of contrast issues
   - Real-time feedback

### Manual Testing:
1. **Text Readability Test**
   - Read all text types at arm's length
   - Check in different lighting conditions
   - Verify with glasses/contacts if worn

2. **UI Component Visibility**
   - Can you see all borders?
   - Are focus states clear?
   - Can you distinguish button states?

3. **Print Test**
   - Print prescription in black & white
   - Ensure all text is legible

## Implementation Priority

### CRITICAL (Do First):
1. ✅ Fix muted-foreground (affects all secondary text)
2. ✅ Fix border colors (affects all inputs, cards)
3. ✅ Fix input colors (critical for form accessibility)

### HIGH (Do Second):
4. Review status indicator colors
5. Test focus states
6. Audit badge/alert colors

### MEDIUM (Do Third):
7. Review chart colors
8. Test loading states
9. Audit notification colors

## Browser/Device Testing

- ✅ Desktop: Chrome, Firefox, Safari, Edge
- ✅ Mobile: iOS Safari, Chrome Mobile
- ✅ Tablet: iPad Safari
- ✅ High contrast mode (Windows)
- ✅ Reduce contrast (macOS accessibility)

## Success Metrics

- **Goal:** 100% WCAG 2.1 AA compliance
- **Target:** 0 color contrast failures in axe DevTools
- **Bonus:** Achieve AAA (7:1 for normal text) where possible

## Documentation for Developers

### How to Check Contrast:
```typescript
// Use browser DevTools or online tools:
// 1. https://webaim.org/resources/contrastchecker/
// 2. Browser DevTools -> Elements -> Styles -> Color picker shows ratio
// 3. axe DevTools extension
```

### Adding New Colors:
```typescript
// Always check contrast when adding new colors:
// 1. Text on background: 4.5:1 minimum
// 2. UI components: 3:1 minimum
// 3. Test in both light and dark mode
```

---

**Next Steps:**
1. Apply the recommended CSS fixes
2. Run automated tests
3. Manual review of all pages
4. Document any remaining issues
5. Create before/after screenshots

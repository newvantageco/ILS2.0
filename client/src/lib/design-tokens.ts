// Design tokens for the Integrated Lens System
// Following the "Precision, Not Preference" philosophy

export const colors = {
  // Grayscale palette (95% of UI)
  gray: {
    50: 'hsl(210 5% 98%)',  // Background
    100: 'hsl(210 5% 96%)', // Card background
    200: 'hsl(210 5% 91%)', // Borders
    300: 'hsl(210 5% 84%)', // Disabled state
    400: 'hsl(210 5% 76%)', // Placeholder text
    500: 'hsl(210 5% 65%)', // Secondary text
    600: 'hsl(210 5% 40%)', // Primary text
    700: 'hsl(210 5% 32%)', // Headings
    800: 'hsl(210 5% 24%)', // High contrast text
    900: 'hsl(210 5% 16%)', // Ultra high contrast
  },

  // Semantic colors (5% of UI, used only for specific states)
  semantic: {
    error: {
      light: 'hsl(3 100% 95%)',
      base: 'hsl(3 100% 40%)',
      dark: 'hsl(3 100% 30%)',
    },
    success: {
      light: 'hsl(145 100% 95%)',
      base: 'hsl(145 100% 35%)',
      dark: 'hsl(145 100% 25%)',
    },
    info: {
      light: 'hsl(215 100% 95%)',
      base: 'hsl(215 100% 45%)',
      dark: 'hsl(215 100% 35%)',
    },
    warning: {
      light: 'hsl(40 100% 95%)',
      base: 'hsl(40 100% 45%)',
      dark: 'hsl(40 100% 35%)',
    }
  }
}

export const typography = {
  fonts: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    mono: 'JetBrains Mono, Consolas, monospace'
  },
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  sizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px - Default UI text
    base: '1rem',     // 16px - Body text
    lg: '1.125rem',   // 18px - Section headers
    xl: '1.25rem',    // 20px - Page titles
    '2xl': '1.5rem',  // 24px - Major headers
  },
  leading: {
    none: 1,
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75
  }
}

export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem', // 2px
  1: '0.25rem',    // 4px
  2: '0.5rem',     // 8px
  3: '0.75rem',    // 12px
  4: '1rem',       // 16px - Base spacing unit
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  8: '2rem',       // 32px
  10: '2.5rem',    // 40px
  12: '3rem',      // 48px
  16: '4rem',      // 64px
}

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
}

export const radii = {
  sm: '0.1875rem',  // 3px
  md: '0.375rem',   // 6px
  lg: '0.5625rem',  // 9px
  xl: '0.75rem',    // 12px
}

// Z-index scale
export const zIndices = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  modal: 1300,
  popover: 1400,
  tooltip: 1500,
}
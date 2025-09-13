/**
 * Design Tokens System
 * Following Big Tech standards for scalable design systems
 */

// Spacing System (8pt grid)
export const spacing = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px  
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
  '4xl': '6rem',    // 96px
} as const;

// Typography Scale (Type Scale)
export const typography = {
  scale: {
    'caption': '0.75rem',      // 12px
    'body-sm': '0.875rem',     // 14px
    'body': '1rem',            // 16px
    'body-lg': '1.125rem',     // 18px
    'heading-sm': '1.25rem',   // 20px
    'heading': '1.5rem',       // 24px
    'heading-lg': '2rem',      // 32px
    'display': '2.5rem',       // 40px
    'display-lg': '3rem',      // 48px
  },
  weight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  }
} as const;

// Color Semantic System
export const colors = {
  // Status Colors for Regulatory Context
  compliance: {
    compliant: 'hsl(142, 71%, 45%)',      // Green
    warning: 'hsl(38, 92%, 50%)',        // Amber
    violation: 'hsl(0, 84%, 60%)',       // Red
    pending: 'hsl(217, 91%, 60%)',       // Blue
    unknown: 'hsl(215, 14%, 65%)',       // Gray
  },
  // Confidence Levels
  confidence: {
    high: 'hsl(142, 71%, 45%)',
    medium: 'hsl(38, 92%, 50%)',
    low: 'hsl(0, 84%, 60%)',
  },
  // Advisory Types
  advisory: {
    recommendation: 'hsl(217, 91%, 60%)',
    analysis: 'hsl(262, 83%, 58%)',
    workflow: 'hsl(142, 71%, 45%)',
    alert: 'hsl(0, 84%, 60%)',
  }
} as const;

// Z-Index System
export const zIndex = {
  base: 1,
  overlay: 10,
  dropdown: 20,
  sticky: 30,
  modal: 40,
  popover: 50,
  tooltip: 60,
  toast: 70,
} as const;

// Shadow System
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
} as const;

// Export as CSS custom properties for use in Tailwind
export const cssVariables = {
  '--spacing-xs': spacing.xs,
  '--spacing-sm': spacing.sm,
  '--spacing-md': spacing.md,
  '--spacing-lg': spacing.lg,
  '--spacing-xl': spacing.xl,
  '--spacing-2xl': spacing['2xl'],
  '--spacing-3xl': spacing['3xl'],
  '--spacing-4xl': spacing['4xl'],
  // Add typography variables
  '--text-caption': typography.scale.caption,
  '--text-body-sm': typography.scale['body-sm'],
  '--text-body': typography.scale.body,
  '--text-body-lg': typography.scale['body-lg'],
  '--text-heading-sm': typography.scale['heading-sm'],
  '--text-heading': typography.scale.heading,
  '--text-heading-lg': typography.scale['heading-lg'],
  '--text-display': typography.scale.display,
  '--text-display-lg': typography.scale['display-lg'],
  // Weight variables
  '--font-weight-normal': typography.weight.normal,
  '--font-weight-medium': typography.weight.medium,
  '--font-weight-semibold': typography.weight.semibold,
  '--font-weight-bold': typography.weight.bold,
} as const;
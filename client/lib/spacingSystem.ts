/**
 * Standardized Spacing System
 * Consistent spacing across the entire application
 * Based on 4px base unit
 */

// Base spacing scale (4px unit)
export const SPACING = {
  // Pixel values for reference
  px: '1px',
  0: '0',
  0.5: '0.125rem', // 2px
  1: '0.25rem',    // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem',     // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem',    // 12px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  7: '1.75rem',    // 28px
  8: '2rem',       // 32px
  9: '2.25rem',    // 36px
  10: '2.5rem',    // 40px
  12: '3rem',      // 48px
  14: '3.5rem',    // 56px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
  24: '6rem',      // 96px
} as const

// Standardized spacing classes for consistency
export const SPACING_CLASSES = {
  // Cards
  card: {
    default: 'p-6',         // 24px - Standard card padding
    compact: 'p-4',         // 16px - Compact cards (mobile, small cards)
    large: 'p-8',           // 32px - Large feature cards
    header: 'px-6 py-4',    // Card header specific
    body: 'px-6 py-4',      // Card body specific
    footer: 'px-6 py-4',    // Card footer specific
  },
  
  // Modals
  modal: {
    padding: 'p-6',         // 24px - Standard modal padding
    header: 'px-6 py-4',    // Modal header
    body: 'px-6 py-6',      // Modal body
    footer: 'px-6 py-4',    // Modal footer
  },
  
  // Sections
  section: {
    spacing: 'space-y-6',   // 24px - Between major sections
    compact: 'space-y-4',   // 16px - Between related items
    loose: 'space-y-8',     // 32px - Between independent sections
  },
  
  // Forms
  form: {
    groups: 'space-y-4',    // 16px - Between form groups
    fields: 'space-y-2',    // 8px - Between label and input
    sections: 'space-y-6',  // 24px - Between form sections
    help: 'mt-1',          // 4px - Help text margin
    error: 'mt-1',         // 4px - Error message margin
  },
  
  // Buttons
  button: {
    group: 'space-x-3',     // 12px - Standard button group spacing
    groupSm: 'space-x-2',   // 8px - Small button group spacing
    groupLg: 'space-x-4',   // 16px - Large button group spacing
    stack: 'space-y-3',     // 12px - Stacked buttons
  },
  
  // Lists
  list: {
    items: 'space-y-2',     // 8px - List item spacing
    compact: 'space-y-1',   // 4px - Compact list
    loose: 'space-y-4',     // 16px - Loose list
  },
  
  // Grid
  grid: {
    gap: 'gap-4',          // 16px - Standard grid gap
    gapSm: 'gap-2',        // 8px - Small grid gap
    gapLg: 'gap-6',        // 24px - Large grid gap
    gapXl: 'gap-8',        // 32px - Extra large grid gap
  },
  
  // Flex
  flex: {
    gap: 'gap-4',          // 16px - Standard flex gap
    gapSm: 'gap-2',        // 8px - Small flex gap
    gapLg: 'gap-6',        // 24px - Large flex gap
  },
  
  // Table
  table: {
    cellPadding: 'px-6 py-4',     // Table cell padding
    cellPaddingSm: 'px-4 py-3',   // Small table cell padding
    actionGap: 'space-x-2',       // Table action buttons gap
  },
  
  // Page
  page: {
    padding: 'p-6',               // Standard page padding
    paddingSm: 'p-4',            // Mobile page padding
    paddingLg: 'p-8',            // Large screen page padding
    sections: 'space-y-6',       // Between page sections
  },
  
  // Components
  components: {
    iconText: 'space-x-2',       // Icon and text spacing
    badgeGap: 'space-x-2',       // Badge spacing
    avatarText: 'space-x-3',     // Avatar and text spacing
    checkboxLabel: 'space-x-2',  // Checkbox and label spacing
  }
} as const

// Helper function to get consistent spacing
export const getSpacing = (type: keyof typeof SPACING_CLASSES, variant?: string): string => {
  const spacingGroup = SPACING_CLASSES[type]
  if (typeof spacingGroup === 'object' && variant && variant in spacingGroup) {
    return (spacingGroup as any)[variant]
  }
  return typeof spacingGroup === 'string' ? spacingGroup : ''
}

// Responsive spacing utilities
export const RESPONSIVE_SPACING = {
  // Responsive padding
  cardResponsive: 'p-4 sm:p-6',
  sectionResponsive: 'p-4 sm:p-6 lg:p-8',
  
  // Responsive spacing
  spaceResponsive: 'space-y-4 sm:space-y-6',
  gapResponsive: 'gap-4 sm:gap-6',
  
  // Responsive margins
  marginResponsive: 'm-4 sm:m-6 lg:m-8',
} as const

// Standard component spacing patterns
export const SPACING_PATTERNS = {
  // Card with header, body, footer
  cardComplete: {
    wrapper: 'card',
    header: 'card-header',
    body: 'card-body',
    footer: 'card-footer'
  },
  
  // Form layout
  formLayout: {
    wrapper: 'space-y-6',
    section: 'space-y-4',
    field: 'space-y-2'
  },
  
  // Button toolbar
  buttonToolbar: {
    wrapper: 'flex items-center',
    spacing: 'space-x-3'
  },
  
  // Page layout
  pageLayout: {
    wrapper: 'space-y-6',
    header: 'mb-6',
    content: 'space-y-4',
    footer: 'mt-8'
  }
} as const

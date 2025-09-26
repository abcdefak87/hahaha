/**
 * Standardized Icon Size System
 * Consistent icon sizing across the entire application
 */

export const ICON_SIZES = {
  // Extra Small - for inline text icons
  xs: 'h-3 w-3',
  
  // Small - for table actions, small buttons
  sm: 'h-4 w-4',
  
  // Medium (Default) - for standard buttons, sidebar
  md: 'h-5 w-5',
  
  // Large - for headers, feature sections
  lg: 'h-6 w-6',
  
  // Extra Large - for hero sections, empty states
  xl: 'h-8 w-8',
  
  // 2X Large - for major feature displays
  '2xl': 'h-10 w-10',
  
  // 3X Large - for empty states, major icons
  '3xl': 'h-12 w-12'
} as const

// Type-safe icon size helper
export type IconSize = keyof typeof ICON_SIZES

// Helper function to get icon size class
export const getIconSize = (size: IconSize = 'md'): string => {
  return ICON_SIZES[size]
}

// Specific icon sizes for different contexts
export const CONTEXT_ICON_SIZES = {
  // Navigation & Sidebar
  sidebarIcon: ICON_SIZES.md,
  sidebarSubmenuIcon: ICON_SIZES.sm,
  sidebarChevron: ICON_SIZES.sm,
  
  // Buttons
  buttonIcon: ICON_SIZES.md,
  buttonSmallIcon: ICON_SIZES.sm,
  buttonLargeIcon: ICON_SIZES.lg,
  
  // Table Actions
  tableActionIcon: ICON_SIZES.sm,
  
  // Cards & Stats
  statCardIcon: ICON_SIZES.lg,
  cardHeaderIcon: ICON_SIZES.xl,
  
  // Empty States
  emptyStateIcon: ICON_SIZES['3xl'],
  
  // Modals
  modalHeaderIcon: ICON_SIZES.lg,
  modalCloseIcon: ICON_SIZES.md,
  
  // Alerts & Notifications
  alertIcon: ICON_SIZES.md,
  badgeIcon: ICON_SIZES.xs,
  
  // Forms
  formFieldIcon: ICON_SIZES.md,
  formErrorIcon: ICON_SIZES.sm
} as const

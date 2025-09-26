# Design System Documentation

## Overview
This document outlines the design system and UI consistency guidelines for the ISP Management System.

## Color System

### Primary Colors
- **Primary Blue**: `#2563eb` - Main brand color
- **Primary Light**: `#3b82f6` - Hover states
- **Primary Dark**: `#1d4ed8` - Active states

### Semantic Colors
- **Success**: `#10b981` - Success states, confirmations
- **Warning**: `#f59e0b` - Warning messages, caution states
- **Error**: `#ef4444` - Error states, destructive actions
- **Info**: `#3b82f6` - Informational messages

## Typography

### Font Family
- Primary: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif

### Text Sizes
```jsx
text-xs   // 0.75rem - Small labels, badges
text-sm   // 0.875rem - Body text, form labels
text-base // 1rem - Default text
text-lg   // 1.125rem - Subheadings
text-xl   // 1.25rem - Section headings
text-2xl  // 1.5rem - Page headings
text-3xl  // 1.875rem - Hero headings
```

## Spacing System

### Standard Spacing
```jsx
space-xs  // 0.25rem (4px)
space-sm  // 0.5rem (8px)
space-md  // 1rem (16px)
space-lg  // 1.5rem (24px)
space-xl  // 2rem (32px)
space-2xl // 3rem (48px)
space-3xl // 4rem (64px)
```

## Components

### Buttons

#### Basic Structure
All buttons MUST use the base `btn` class along with variant classes:

```jsx
// ✅ CORRECT
<button className="btn btn-primary">Primary Button</button>
<button className="btn btn-secondary">Secondary Button</button>
<button className="btn btn-outline">Outline Button</button>

// ❌ INCORRECT
<button className="btn-primary">Primary Button</button>
```

#### Button Variants
- `btn btn-primary` - Primary actions
- `btn btn-secondary` - Secondary actions
- `btn btn-success` - Success/positive actions
- `btn btn-warning` - Warning/caution actions
- `btn btn-danger` - Destructive actions
- `btn btn-outline` - Outline style
- `btn btn-ghost` - Minimal style

#### Button Sizes
- `btn btn-sm` - Small buttons (min-height: 36px)
- `btn` - Default size (min-height: 44px)
- `btn btn-lg` - Large buttons (min-height: 52px)

#### Button with Icons
```jsx
<button className="btn btn-primary">
  <Icon className="h-5 w-5 mr-2" />
  Button Text
</button>
```

### Table Actions

Use consistent button styling for table actions:

```jsx
<div className="table-actions">
  <button className="btn btn-sm btn-ghost" title="View">
    <Eye className="h-4 w-4" />
  </button>
  <button className="btn btn-sm btn-ghost text-blue-600" title="Edit">
    <Edit className="h-4 w-4" />
  </button>
  <button className="btn btn-sm btn-ghost text-red-600" title="Delete">
    <Trash2 className="h-4 w-4" />
  </button>
</div>
```

### Icons

#### Standard Icon Sizes
```jsx
import { ICON_SIZES } from '@/lib/iconSizes'

// Extra Small (h-3 w-3)
<Icon className={ICON_SIZES.xs} />

// Small (h-4 w-4) - Table actions, small buttons
<Icon className={ICON_SIZES.sm} />

// Medium (h-5 w-5) - DEFAULT - Standard buttons, sidebar
<Icon className={ICON_SIZES.md} />

// Large (h-6 w-6) - Headers, feature sections
<Icon className={ICON_SIZES.lg} />

// Extra Large (h-8 w-8) - Hero sections
<Icon className={ICON_SIZES.xl} />
```

#### Context-Specific Icon Sizes
- **Sidebar Icons**: `h-5 w-5`
- **Sidebar Submenu Icons**: `h-4 w-4`
- **Button Icons**: `h-5 w-5` (default), `h-4 w-4` (small buttons)
- **Table Action Icons**: `h-4 w-4`
- **Card Header Icons**: `h-8 w-8`
- **Empty State Icons**: `h-12 w-12`

### Cards

```jsx
// Basic card
<div className="card">
  <div className="card-header">
    <h3 className="card-title">Card Title</h3>
  </div>
  <div className="card-body">
    Content
  </div>
  <div className="card-footer">
    Actions
  </div>
</div>

// Interactive card
<div className="card card-interactive">
  Content
</div>

// Small card
<div className="card-sm">
  Content
</div>
```

### Forms

#### Input Fields
```jsx
<div className="form-group">
  <label className="form-label">Label</label>
  <input type="text" className="form-input" />
  <p className="form-help">Helper text</p>
</div>

// Error state
<input className="form-input form-input-error" />
<p className="form-error">Error message</p>

// Sizes
<input className="form-input form-input-sm" />
<input className="form-input" /> // Default
<input className="form-input form-input-lg" />
```

### Badges

```jsx
// Size variants
<span className="badge badge-sm">Small</span>
<span className="badge">Default</span>
<span className="badge badge-lg">Large</span>

// Color variants
<span className="badge badge-success">Success</span>
<span className="badge badge-warning">Warning</span>
<span className="badge badge-danger">Danger</span>
<span className="badge badge-info">Info</span>
<span className="badge badge-gray">Gray</span>
```

## Responsive Design

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Mobile-First Approach
```jsx
// Base (mobile) styles, then add responsive modifiers
<div className="p-4 sm:p-6 lg:p-8">
  <button className="btn btn-primary w-full sm:w-auto">
    Button
  </button>
</div>
```

### Touch Targets
- Minimum touch target size: 44x44px
- Ensure adequate spacing between interactive elements

## Accessibility

### Focus States
All interactive elements must have visible focus states:
```css
focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
```

### Color Contrast
- Normal text: Minimum 4.5:1 contrast ratio
- Large text: Minimum 3:1 contrast ratio
- Interactive elements: Minimum 3:1 contrast ratio

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Use semantic HTML elements
- Provide skip links for repetitive navigation

## Animation & Transitions

### Standard Durations
- Fast: 150ms
- Normal: 200ms
- Slow: 300ms

### Standard Easing
- Default: `ease-in-out`
- Enter: `ease-out`
- Exit: `ease-in`

## Best Practices

1. **Always use the base class pattern**: `btn btn-primary` not just `btn-primary`
2. **Consistent icon sizing**: Use the standardized icon size classes
3. **Mobile-first responsive design**: Start with mobile, enhance for larger screens
4. **Semantic HTML**: Use appropriate HTML elements for their intended purpose
5. **Consistent spacing**: Use the spacing scale variables
6. **Accessible color usage**: Ensure proper contrast ratios
7. **Predictable interactions**: Use consistent hover, focus, and active states

## Common Patterns

### Loading States
```jsx
// Loading spinner
<div className="loading-spinner loading-spinner-sm"></div>

// Skeleton loader
<div className="skeleton skeleton-text"></div>
```

### Empty States
```jsx
<div className="empty-state">
  <div className="empty-state-icon">
    <Icon className="h-12 w-12" />
  </div>
  <h3 className="empty-state-title">No data</h3>
  <p className="empty-state-description">Description text</p>
  <div className="empty-state-action">
    <button className="btn btn-primary">Action</button>
  </div>
</div>
```

### Error States
```jsx
<div className="card bg-red-50 border-red-200">
  <div className="text-center p-6">
    <Icon className="h-12 w-12 text-red-500 mx-auto mb-4" />
    <h3 className="text-xl font-semibold text-red-800 mb-2">Error Title</h3>
    <p className="text-base text-red-600 mb-4">Error message</p>
    <button className="btn btn-danger">Retry</button>
  </div>
</div>
```

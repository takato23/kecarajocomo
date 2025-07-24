# Navigation Design Plan - Desktop & Mobile

## Overview
This document outlines a comprehensive navigation system design for KeCarajoComer, optimized for both desktop and mobile experiences with native gesture support.

## Current State Analysis

### Existing Components
- **AppNavigation.tsx**: Combined desktop/mobile navigation with bottom nav
- **MobileNav.tsx**: Specialized mobile navigation with quick actions
- **iOS26Navigation.tsx**: iOS-style navigation (exists in components/navigation)
- **ModernSidebar.tsx**: Desktop sidebar navigation

### Key Features to Preserve
- Bottom navigation for mobile
- Quick actions floating button
- User menu with avatar
- Theme switching
- Notification badges
- Search functionality

## Responsive Navigation Architecture

### Desktop Navigation System

#### 1. **Horizontal Top Bar** (1200px+)
```
┌─────────────────────────────────────────────────────────────────┐
│ Logo  [Dashboard] [Recipes] [Planner] [Pantry]    🔍 🔔 ⚙️ [User]│
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- Sticky top navigation with glassmorphism effect
- Hover effects with micro-animations
- Dropdown menus for complex sections
- Keyboard navigation support (Tab, Arrow keys)
- Search command palette (Cmd/Ctrl + K)

#### 2. **Collapsible Sidebar** (768px - 1199px)
```
┌───┬──────────────┐
│ ≡ │   Content    │
├───┤              │
│ 🏠 │              │
│ 👨‍🍳 │              │
│ 📅 │              │
│ 🛒 │              │
│ 📊 │              │
└───┴──────────────┘
```

**Features:**
- Icon-only collapsed state
- Full width on hover/click
- Smooth transition animations
- Persistent state in localStorage

### Mobile Navigation System

#### 1. **Bottom Tab Bar** (< 768px)
```
┌─────────────────────────┐
│       Content           │
│                         │
│                         │
├─────────────────────────┤
│  🏠   👨‍🍳   📅   🛒   👤  │
└─────────────────────────┘
```

**Features:**
- Fixed bottom position
- Active state animations
- Badge notifications
- Haptic feedback on tap

#### 2. **Gesture-Based Navigation**

##### Swipe Gestures
- **Swipe Right**: Go back/Open drawer
- **Swipe Left**: Close drawer
- **Swipe Up on Tab**: Quick actions menu
- **Long Press Tab**: Context menu

##### Pull Gestures
- **Pull to Refresh**: Update current view
- **Pull to Search**: Reveal search bar

#### 3. **Floating Action Menu**
```
        ┌───┐
        │ + │ ← Main FAB
        └───┘
          ↓
    ┌───┐ ┌───┐
    │ 📝 │ │ 📸 │ ← Quick Actions
    └───┘ └───┘
```

## Implementation Specifications

### 1. Navigation Context Provider
```typescript
interface NavigationState {
  isDrawerOpen: boolean;
  activeRoute: string;
  quickActionsOpen: boolean;
  searchOpen: boolean;
  gesture: {
    direction: 'left' | 'right' | 'up' | 'down' | null;
    velocity: number;
  };
}
```

### 2. Gesture Manager
```typescript
interface GestureConfig {
  swipeThreshold: number; // 50px
  swipeVelocity: number; // 0.5
  longPressDelay: number; // 500ms
  hapticFeedback: boolean;
}
```

### 3. Responsive Breakpoints
```scss
$mobile: 0 - 767px;
$tablet: 768px - 1199px;
$desktop: 1200px+;
```

### 4. Animation Specifications

#### Desktop Animations
- **Hover**: Scale(1.05) + Shadow elevation
- **Active**: Scale(0.95) + Color change
- **Transition**: 200ms ease-out

#### Mobile Animations
- **Tab Switch**: Spring animation (stiffness: 400, damping: 30)
- **Drawer**: Slide + Fade (300ms)
- **FAB**: Scale + Rotate (200ms)

### 5. Accessibility Features

#### Desktop
- Full keyboard navigation
- ARIA labels and roles
- Focus indicators
- Screen reader announcements

#### Mobile
- Touch target size: min 44x44px
- Gesture alternatives for all actions
- Voice control support
- Reduced motion options

## Component Structure

### Desktop Components
```
NavigationProvider/
├── DesktopNavbar/
│   ├── NavLogo
│   ├── NavItems
│   ├── SearchTrigger
│   └── UserMenu
├── DesktopSidebar/
│   ├── SidebarToggle
│   ├── SidebarNav
│   └── SidebarFooter
└── CommandPalette/
```

### Mobile Components
```
NavigationProvider/
├── MobileBottomNav/
│   ├── TabItem
│   ├── ActiveIndicator
│   └── BadgeCounter
├── MobileDrawer/
│   ├── DrawerHeader
│   ├── DrawerNav
│   └── DrawerFooter
├── FloatingActionButton/
│   ├── MainFAB
│   └── QuickActions
└── GestureHandler/
```

## Navigation Routes

### Primary Routes
1. **Dashboard** - `/dashboard` (Home icon)
2. **Recipes** - `/recipes` (Chef hat)
3. **Meal Planner** - `/planner` (Calendar)
4. **Pantry** - `/pantry` (Shopping cart)
5. **Profile** - `/profile` (User icon)

### Secondary Routes (Desktop only)
- Analytics - `/analytics`
- Settings - `/settings`
- Shopping List - `/shopping`
- Notifications - `/notifications`

### Quick Actions (Mobile FAB)
- Add Recipe
- Quick Scan (Barcode/Receipt)
- Voice Input
- Generate Shopping List

## Theme Integration

### Light Mode
- Background: White with subtle shadows
- Active: Primary color (#84cc16)
- Inactive: Gray-600
- Hover: Gray-100

### Dark Mode
- Background: Gray-900 with glassmorphism
- Active: Primary color (#84cc16)
- Inactive: Gray-400
- Hover: Gray-800

## Performance Optimizations

### Desktop
- Lazy load dropdown menus
- Debounce search input
- CSS-only hover states where possible
- Preload route components

### Mobile
- Use CSS transforms for animations
- Passive event listeners for gestures
- RequestAnimationFrame for smooth animations
- Hardware acceleration for transitions

## Implementation Phases

### Phase 1: Core Navigation
1. Create NavigationProvider context
2. Implement responsive detection
3. Build base desktop/mobile components

### Phase 2: Gesture Support
1. Integrate gesture library (Framer Motion)
2. Implement swipe navigation
3. Add haptic feedback

### Phase 3: Advanced Features
1. Command palette
2. Voice navigation
3. Predictive navigation
4. Analytics integration

## Testing Requirements

### Desktop
- Keyboard navigation flow
- Screen reader compatibility
- Multi-browser support
- Performance metrics

### Mobile
- Touch gesture accuracy
- Performance on low-end devices
- Offline functionality
- Battery impact

## Success Metrics
- Navigation time < 300ms
- Gesture recognition > 95% accuracy
- Touch target success > 98%
- Accessibility score > 95%
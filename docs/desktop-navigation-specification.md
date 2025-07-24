# Desktop Navigation Menu Specifications

## Desktop Navigation Architecture

### Primary Navigation Bar

#### Layout Structure
```
┌──────────────────────────────────────────────────────────────────────────┐
│  [Logo]  Dashboard  Recipes  Planner  Pantry  Analytics    [🔍] [🔔] [⚙️] [User] │
└──────────────────────────────────────────────────────────────────────────┘
```

#### Dimensions & Spacing
- **Height**: 64px
- **Max Width**: 1440px (centered with auto margins)
- **Padding**: 0 24px
- **Logo Area**: 200px fixed width
- **Nav Items**: Auto-distributed with 32px gap
- **Right Actions**: 240px fixed width

### Navigation Items

#### 1. **Dashboard**
- **Route**: `/dashboard`
- **Icon**: Home (20x20px)
- **Dropdown**: None
- **Keyboard**: Alt+1

#### 2. **Recipes** (Mega Menu)
- **Route**: `/recipes`
- **Icon**: ChefHat (20x20px)
- **Keyboard**: Alt+2
- **Dropdown Structure**:
```
┌─────────────────────────────────────────────┐
│ Browse Recipes          Quick Actions        │
│ ├─ All Recipes          ├─ Generate Recipe  │
│ ├─ By Category          ├─ Import Recipe    │
│ ├─ By Cuisine           ├─ Scan Recipe      │
│ ├─ Dietary Filters      └─ Recent Recipes   │
│ └─ Favorites                                 │
└─────────────────────────────────────────────┘
```

#### 3. **Meal Planner** (Dropdown)
- **Route**: `/planner`
- **Icon**: Calendar (20x20px)
- **Keyboard**: Alt+3
- **Dropdown Items**:
  - Weekly View
  - Monthly View
  - Shopping List
  - Meal Prep Guide

#### 4. **Pantry** (Dropdown)
- **Route**: `/pantry`
- **Icon**: Package (20x20px)
- **Keyboard**: Alt+4
- **Dropdown Items**:
  - My Pantry
  - Add Items
  - Expiring Soon (with count badge)
  - Shopping Suggestions

#### 5. **Analytics**
- **Route**: `/analytics`
- **Icon**: BarChart3 (20x20px)
- **Keyboard**: Alt+5
- **Dropdown**: None

### Interactive Elements

#### Search (Cmd/Ctrl + K)
```
┌─────────────────────────────────────────────┐
│ 🔍 Search recipes, ingredients, or actions... │
├─────────────────────────────────────────────┤
│ Recent Searches                             │
│ • Chicken recipes                           │
│ • Low carb meals                            │
│                                             │
│ Quick Actions                               │
│ → Generate recipe from pantry               │
│ → Create shopping list                      │
│ → Add pantry item                           │
└─────────────────────────────────────────────┘
```

#### Notifications Panel
```
┌─────────────────────────────────────────────┐
│ Notifications                    Mark all read│
├─────────────────────────────────────────────┤
│ 🍅 3 items expiring soon              2m ago│
│ 📅 Meal plan for tomorrow ready      1h ago│
│ 🎉 New recipe match found            3h ago│
│ 📊 Weekly report available           1d ago│
└─────────────────────────────────────────────┘
```

#### User Menu
```
┌─────────────────────────────────────────────┐
│ John Doe                                    │
│ john.doe@email.com                          │
├─────────────────────────────────────────────┤
│ 👤 My Profile                               │
│ ⚙️ Settings                                 │
│ 🎯 Preferences                              │
│ 📊 My Stats                                 │
├─────────────────────────────────────────────┤
│ 🌙 Dark Mode                    [Toggle]    │
│ 🔔 Notifications                [Badge: 3]   │
├─────────────────────────────────────────────┤
│ 📖 Help & Support                           │
│ 🚪 Sign Out                                 │
└─────────────────────────────────────────────┘
```

### Responsive Behavior

#### Breakpoint: 1200px - 1440px
- Navigation items reduce gap to 24px
- Right actions compress to 200px
- Logo area maintains 200px

#### Breakpoint: 992px - 1199px
- Convert to hamburger + priority items
- Show: Dashboard, Recipes, Planner
- Hide: Pantry, Analytics (in hamburger)
- Maintain search and user menu

#### Breakpoint: 768px - 991px
- Full hamburger navigation
- Centered logo
- Search icon only (no input field)
- Slide-out sidebar for navigation

### Keyboard Navigation

#### Global Shortcuts
- **Cmd/Ctrl + K**: Open search
- **Cmd/Ctrl + N**: Quick add (context-aware)
- **Cmd/Ctrl + /**: Keyboard shortcuts help
- **Esc**: Close dropdowns/modals

#### Navigation Shortcuts
- **Tab**: Navigate between items
- **Enter**: Activate item
- **Space**: Open dropdown
- **Arrow Keys**: Navigate within dropdowns
- **Alt + [1-5]**: Jump to section

#### Accessibility Shortcuts
- **Alt + S**: Skip to content
- **Alt + M**: Open main menu
- **Alt + U**: Open user menu
- **Alt + N**: Open notifications

### Visual Design Specifications

#### Colors & States
```scss
// Base State
$nav-bg: #FFFFFF;
$nav-text: #4B5563;
$nav-border: #E5E7EB;

// Hover State
$nav-hover-bg: #F9FAFB;
$nav-hover-text: #1F2937;

// Active State
$nav-active-bg: #F0FDF4;
$nav-active-text: #84CC16;
$nav-active-border: #84CC16;

// Dark Mode
$nav-dark-bg: #111827;
$nav-dark-text: #9CA3AF;
$nav-dark-border: #374151;
```

#### Typography
- **Logo**: 20px, Font-weight: 700
- **Nav Items**: 14px, Font-weight: 500
- **Dropdown Items**: 14px, Font-weight: 400
- **Badge Text**: 12px, Font-weight: 600

#### Animations
```css
/* Hover Effects */
.nav-item {
  transition: all 200ms ease-out;
  position: relative;
}

.nav-item::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: var(--primary);
  transition: all 200ms ease-out;
  transform: translateX(-50%);
}

.nav-item:hover::after {
  width: 100%;
}

/* Dropdown Animation */
.dropdown {
  animation: slideDown 200ms ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Interaction Patterns

#### Dropdown Behavior
- **Trigger**: Hover (300ms delay) or click
- **Close**: Click outside, ESC key, or navigate away
- **Animation**: Fade in + slide down (200ms)
- **Z-index**: 1000 (above content)

#### Search Behavior
1. **Trigger**: Click icon or Cmd+K
2. **Focus**: Auto-focus input field
3. **Real-time**: Show results as typing (300ms debounce)
4. **Navigation**: Arrow keys to select results
5. **Action**: Enter to navigate, Cmd+Enter for new tab

#### Notification Behavior
- **Badge**: Show count when > 0
- **Click**: Open dropdown panel
- **Auto-hide**: After 5 seconds of inactivity
- **Mark read**: On click or "Mark all" button
- **Persistence**: Store read state locally

### Performance Optimization

#### Loading Strategy
1. **Critical CSS**: Inline navigation styles
2. **Lazy Load**: Dropdown content on hover
3. **Prefetch**: Common navigation targets
4. **Cache**: User preferences and recent searches

#### Animation Performance
- Use CSS transforms only
- Enable GPU acceleration
- Respect prefers-reduced-motion
- Throttle hover events

### Testing Requirements

#### Functional Tests
- [ ] All navigation links work correctly
- [ ] Dropdowns open/close properly
- [ ] Keyboard navigation complete flow
- [ ] Search returns relevant results
- [ ] Notifications update in real-time

#### Visual Tests
- [ ] Consistent styling across browsers
- [ ] Proper responsive behavior
- [ ] Dark mode compatibility
- [ ] Focus indicators visible
- [ ] Animation smoothness

#### Performance Tests
- [ ] Navigation renders < 100ms
- [ ] Dropdowns open < 200ms
- [ ] Search results < 300ms
- [ ] No layout shift on interaction
- [ ] 60 FPS animations
# Mobile Gesture Interaction Patterns

## Gesture Library Implementation

### Core Gestures

#### 1. **Navigation Gestures**

##### Swipe Right (Edge)
- **Trigger Zone**: Left 20px of screen
- **Threshold**: 75px horizontal movement
- **Velocity**: > 0.3
- **Action**: Navigate back / Open drawer menu
- **Visual Feedback**: Edge glow + slide animation
- **Haptic**: Light impact

```typescript
interface SwipeRightGesture {
  startX: number; // < 20px from edge
  endX: number; // > startX + 75px
  duration: number; // < 500ms
  velocity: number; // > 0.3
}
```

##### Swipe Left
- **Trigger Zone**: Full screen width
- **Threshold**: 75px horizontal movement
- **Velocity**: > 0.3
- **Action**: Close drawer / Navigate forward (if history exists)
- **Visual Feedback**: Content slide + fade
- **Haptic**: Light impact

##### Swipe Up (Bottom Navigation)
- **Trigger Zone**: Bottom nav area (80px height)
- **Threshold**: 100px vertical movement
- **Velocity**: > 0.5
- **Action**: Reveal quick actions menu
- **Visual Feedback**: Elastic bounce + blur background
- **Haptic**: Medium impact

##### Swipe Down
- **Trigger Zone**: Top 150px (when scrolled to top)
- **Threshold**: 80px vertical movement
- **Action**: Pull to refresh
- **Visual Feedback**: Rubber band effect + loading spinner
- **Haptic**: Success notification

#### 2. **Tab Bar Gestures**

##### Long Press
- **Duration**: 500ms
- **Action**: Show context menu / shortcuts
- **Visual Feedback**: Scale down (0.95) + blur surroundings
- **Haptic**: Medium impact

##### Double Tap
- **Max Interval**: 300ms
- **Action**: Scroll to top / Refresh current tab
- **Visual Feedback**: Pulse animation
- **Haptic**: Light impact x2

##### Horizontal Swipe on Tab Bar
- **Threshold**: 50px
- **Action**: Switch between adjacent tabs
- **Visual Feedback**: Sliding indicator + content preview
- **Haptic**: Selection change

#### 3. **Content Gestures**

##### Pinch to Zoom
- **Min Scale**: 0.5
- **Max Scale**: 3.0
- **Action**: Zoom images / recipe cards
- **Visual Feedback**: Smooth scale transform
- **Double Tap to Reset**: Return to 1.0 scale

##### Two-Finger Swipe
- **Direction**: Horizontal
- **Action**: Navigate between recipe steps
- **Visual Feedback**: Page flip animation
- **Haptic**: Page turn feedback

##### Three-Finger Swipe Down
- **Action**: Quick access to search
- **Visual Feedback**: Search bar slides down
- **Haptic**: Light impact

#### 4. **FAB (Floating Action Button) Gestures**

##### Drag
- **Action**: Move FAB to new position
- **Constraints**: Screen edges with 16px padding
- **Visual Feedback**: Shadow elevation + slight scale
- **Snap Points**: Corners and edges

##### Fling Up
- **Velocity**: > 1.0
- **Action**: Expand quick actions radially
- **Visual Feedback**: Stagger animation for action buttons
- **Haptic**: Medium impact

##### Long Press + Drag
- **Action**: Quick action preview and release to select
- **Visual Feedback**: Magnify selected action
- **Haptic**: Continuous feedback

## Gesture Combinations

### Power User Shortcuts

#### 1. **Quick Recipe Add**
- **Gesture**: 3D Touch / Force Press on FAB
- **Alternative**: Long press (1s) + swipe up
- **Action**: Direct to AI recipe generator

#### 2. **Instant Shopping List**
- **Gesture**: Two-finger swipe up from bottom
- **Action**: Generate shopping list from current meal plan

#### 3. **Voice Command**
- **Gesture**: Three-finger tap
- **Action**: Activate voice input
- **Visual**: Ripple effect from touch points

#### 4. **Quick Switch**
- **Gesture**: Four-finger swipe left/right
- **Action**: Switch between last two screens
- **Visual**: Card stack animation

## Visual Feedback Specifications

### Animation Curves
```typescript
const curves = {
  navigation: 'cubic-bezier(0.4, 0.0, 0.2, 1)', // Material standard
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Overshoot
  smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Ease out quad
};
```

### Feedback Layers

#### 1. **Touch Ripple**
- **Size**: 40px initial → 120px expanded
- **Duration**: 400ms
- **Opacity**: 0.3 → 0
- **Color**: Primary color or white

#### 2. **Edge Glow**
- **Width**: 2px → 8px
- **Intensity**: Based on swipe progress
- **Color**: Primary accent
- **Blur**: 4px → 12px

#### 3. **Gesture Trail**
- **Opacity**: 0.6 → 0
- **Duration**: 200ms fade out
- **Width**: 2px
- **Color**: White with 50% opacity

## Haptic Feedback Patterns

### iOS Haptic Types
```typescript
enum HapticFeedback {
  Selection = 'selection', // Light tap
  ImpactLight = 'impactLight', // Subtle bump
  ImpactMedium = 'impactMedium', // Moderate bump
  ImpactHeavy = 'impactHeavy', // Strong bump
  Success = 'notificationSuccess', // Happy tap
  Warning = 'notificationWarning', // Alert tap
  Error = 'notificationError', // Error tap
}
```

### Android Vibration Patterns
```typescript
const vibrationPatterns = {
  tap: [0, 10], // Single short tap
  doubleTap: [0, 10, 50, 10], // Two quick taps
  longPress: [0, 50], // Longer vibration
  success: [0, 10, 100, 20, 100, 30], // Success pattern
  error: [0, 50, 100, 50], // Error pattern
};
```

## Accessibility Considerations

### Alternative Interactions
1. **All gestures must have button alternatives**
2. **Voice commands for primary actions**
3. **Configurable gesture sensitivity**
4. **Option to disable complex gestures**

### Visual Indicators
1. **Show gesture hints on first use**
2. **Optional gesture tutorial**
3. **Visual feedback for all interactions**
4. **High contrast mode support**

## Implementation Guidelines

### Gesture Detection Library
```typescript
import { 
  PanGestureHandler,
  PinchGestureHandler,
  TapGestureHandler,
  LongPressGestureHandler,
  FlingGestureHandler,
  RotationGestureHandler
} from 'react-native-gesture-handler';
```

### Performance Optimization
1. **Use native driver for animations**
2. **Debounce rapid gestures**
3. **Cancel ongoing animations before starting new**
4. **Preload haptic engine**
5. **Use InteractionManager for heavy operations**

### Gesture Conflict Resolution
```typescript
interface GesturePriority {
  swipe: 1; // Highest priority
  pinch: 2;
  longPress: 3;
  tap: 4; // Lowest priority
}
```

## Testing Checklist

### Gesture Recognition
- [ ] Edge swipe detection accuracy
- [ ] Velocity threshold calibration
- [ ] Multi-touch gesture handling
- [ ] Gesture cancellation scenarios

### Performance
- [ ] 60 FPS during animations
- [ ] < 16ms gesture response time
- [ ] Smooth haptic feedback
- [ ] Battery impact measurement

### Device Compatibility
- [ ] Small screens (< 5")
- [ ] Large screens (> 6.5")
- [ ] Different aspect ratios
- [ ] With/without haptic engine

### Accessibility
- [ ] VoiceOver compatibility
- [ ] Switch control support
- [ ] Reduced motion mode
- [ ] One-handed operation
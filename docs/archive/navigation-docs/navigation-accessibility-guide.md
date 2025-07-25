# Navigation Accessibility & Internationalization Guide

## 🌍 Universal Design Principles

### Core Accessibility Philosophy
- **Perceivable**: Information must be presentable in multiple ways
- **Operable**: All functionality must be keyboard accessible
- **Understandable**: Navigation must be predictable and learnable
- **Robust**: Work across all assistive technologies

## ♿ WCAG AAA Compliance Strategy

### Level A Requirements (Minimum)

#### 1. **Keyboard Navigation**
```typescript
interface KeyboardNavigation {
  // Primary navigation keys
  keys: {
    Tab: 'Move forward through items',
    'Shift+Tab': 'Move backward through items',
    Enter: 'Activate current item',
    Space: 'Toggle/activate buttons',
    Escape: 'Close menus/modals',
    ArrowKeys: 'Navigate within menus'
  };
  
  // Focus management
  focusManagement: {
    visible: 'always', // Never hide focus indicators
    style: '3px solid #0066CC', // High contrast
    offset: '2px', // Breathing room
    animated: true // Smooth transitions
  };
}
```

#### 2. **Screen Reader Optimization**
```html
<!-- Semantic HTML structure -->
<nav role="navigation" aria-label="Main navigation">
  <ul role="menubar">
    <li role="none">
      <a role="menuitem" 
         href="/dashboard" 
         aria-current="page"
         aria-describedby="dashboard-desc">
        <span aria-hidden="true">🏠</span>
        Dashboard
      </a>
    </li>
    <li role="none">
      <button role="menuitem" 
              aria-haspopup="menu" 
              aria-expanded="false"
              aria-controls="recipes-menu">
        <span aria-hidden="true">🍳</span>
        Recipes
        <span class="sr-only">submenu</span>
      </button>
      <ul role="menu" 
          id="recipes-menu" 
          aria-label="Recipes submenu">
        <!-- Submenu items -->
      </ul>
    </li>
  </ul>
</nav>

<!-- Hidden descriptions for context -->
<div class="sr-only">
  <span id="dashboard-desc">View your personalized dashboard with meal plans and recommendations</span>
</div>
```

### Level AA Requirements (Enhanced)

#### 1. **Color Contrast**
```scss
// Minimum contrast ratios
$contrast-ratios: (
  'normal-text': 4.5:1,  // WCAG AA
  'large-text': 3:1,     // 18pt+ or 14pt+ bold
  'ui-components': 3:1,   // Buttons, inputs
  'graphics': 3:1,        // Icons, charts
  
  // AAA levels
  'normal-text-aaa': 7:1,
  'large-text-aaa': 4.5:1
);

// Color palette with contrast checking
@function check-contrast($foreground, $background) {
  $contrast: contrast-ratio($foreground, $background);
  @if $contrast < 4.5 {
    @warn "Contrast ratio #{$contrast} is below WCAG AA standard";
  }
  @return $contrast;
}

// Usage
.nav-item {
  color: #2D3748; // Passes AA on white
  background: #FFFFFF;
  
  &:hover {
    color: #1A202C; // Even higher contrast
    background: #F7FAFC;
  }
  
  &:focus {
    outline: 3px solid #4299E1; // AAA contrast
    outline-offset: 2px;
  }
}
```

#### 2. **Touch Target Sizing**
```typescript
interface TouchTargets {
  minimum: {
    size: '44x44px', // Apple HIG minimum
    spacing: '8px', // Between targets
  };
  
  recommended: {
    size: '48x48px', // Material Design
    spacing: '12px',
  };
  
  comfortable: {
    size: '56x56px', // Thumb-friendly
    spacing: '16px',
  };
}

// Implementation
const NavItem = styled.a`
  min-height: 48px;
  min-width: 48px;
  padding: 12px 16px;
  margin: 4px;
  display: flex;
  align-items: center;
  
  /* Increase tap area without visual change */
  &::before {
    content: '';
    position: absolute;
    top: -8px;
    right: -8px;
    bottom: -8px;
    left: -8px;
  }
`;
```

### Level AAA Requirements (Maximum)

#### 1. **Enhanced Visual Indicators**
```css
/* Multiple indication methods */
.nav-item {
  /* Color change */
  color: var(--text-primary);
  
  /* Icon indicator */
  &[aria-current="page"]::before {
    content: '▸';
    margin-right: 8px;
  }
  
  /* Underline */
  &[aria-current="page"] {
    text-decoration: underline;
    text-decoration-thickness: 3px;
    text-underline-offset: 4px;
  }
  
  /* Background change */
  &[aria-current="page"] {
    background: var(--bg-active);
    font-weight: 600;
  }
  
  /* Border indicator */
  &[aria-current="page"] {
    border-left: 4px solid var(--color-primary);
  }
}
```

#### 2. **Cognitive Accessibility**
```typescript
interface CognitiveA11y {
  // Consistent navigation
  consistency: {
    orderMaintained: true, // Never reorder items
    labelsStable: true, // Don't change labels
    positionFixed: true, // Keep in same location
  };
  
  // Clear language
  language: {
    simpleWords: true, // Grade 6 reading level
    noJargon: true, // Avoid technical terms
    actionOriented: true, // "View Recipes" not "Recipes"
  };
  
  // Predictable behavior
  behavior: {
    noAutoNavigation: true, // User initiates all
    confirmDestructive: true, // Confirm before delete
    undoAvailable: true, // Allow mistakes
  };
  
  // Help available
  assistance: {
    tooltips: true, // On hover/focus
    contextualHelp: true, // ? icons
    tutorials: true, // First-time guidance
  };
}
```

## 🗣️ Voice Navigation Implementation

### Speech Recognition API
```typescript
class VoiceNavigationController {
  private recognition: SpeechRecognition;
  private commands: Map<RegExp, Function>;
  
  constructor() {
    this.recognition = new webkitSpeechRecognition();
    this.setupRecognition();
    this.registerCommands();
  }
  
  private setupRecognition() {
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    
    this.recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      this.processCommand(transcript);
    };
  }
  
  private registerCommands() {
    this.commands = new Map([
      [/go to (.+)/, (match) => this.navigateTo(match[1])],
      [/search for (.+)/, (match) => this.search(match[1])],
      [/add (.+) to (.+)/, (match) => this.addItem(match[1], match[2])],
      [/show me (.+)/, (match) => this.showCategory(match[1])],
      [/help/, () => this.showHelp()],
      [/stop|cancel/, () => this.stop()],
    ]);
  }
  
  private processCommand(transcript: string) {
    const normalized = transcript.toLowerCase().trim();
    
    for (const [pattern, handler] of this.commands) {
      const match = normalized.match(pattern);
      if (match) {
        handler(match);
        this.announceAction(normalized);
        break;
      }
    }
  }
  
  private announceAction(action: string) {
    // Visual feedback
    this.showToast(`Executing: ${action}`);
    
    // Audio feedback
    this.speak(`${action} completed`);
    
    // Haptic feedback
    navigator.vibrate(50);
  }
}
```

### Voice UI Components
```tsx
const VoiceButton: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  return (
    <div className="voice-control">
      <button
        onClick={() => toggleVoice()}
        aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
        className={cn('voice-button', { active: isListening })}
      >
        <Mic className={cn('icon', { pulsing: isListening })} />
      </button>
      
      {isListening && (
        <div className="voice-feedback" role="status" aria-live="polite">
          <div className="waveform" aria-hidden="true">
            <AudioWaveform amplitude={audioLevel} />
          </div>
          <p className="transcript">{transcript || 'Listening...'}</p>
          <p className="hint">Try: "Go to recipes" or "Search for pasta"</p>
        </div>
      )}
    </div>
  );
};
```

## 🌐 Internationalization (i18n)

### Multi-Language Support
```typescript
interface I18nConfig {
  // Supported languages
  languages: {
    'en': { name: 'English', dir: 'ltr' },
    'es': { name: 'Español', dir: 'ltr' },
    'ar': { name: 'العربية', dir: 'rtl' },
    'zh': { name: '中文', dir: 'ltr' },
    'ja': { name: '日本語', dir: 'ltr' },
    'de': { name: 'Deutsch', dir: 'ltr' },
    'fr': { name: 'Français', dir: 'ltr' },
    'pt': { name: 'Português', dir: 'ltr' },
  };
  
  // Fallback chain
  fallbacks: {
    'es-MX': 'es',
    'pt-BR': 'pt',
    'zh-CN': 'zh',
    'default': 'en'
  };
}

// Translation structure
const translations = {
  en: {
    nav: {
      dashboard: 'Dashboard',
      recipes: 'Recipes',
      mealPlanner: 'Meal Planner',
      pantry: 'Pantry',
      profile: 'Profile',
      
      // Accessibility labels
      mainNavigation: 'Main navigation',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
      submenu: 'submenu',
      currentPage: 'current page',
      
      // Voice commands
      voiceCommands: {
        navigateTo: 'go to {page}',
        search: 'search for {query}',
        help: 'help',
      }
    }
  },
  
  es: {
    nav: {
      dashboard: 'Panel',
      recipes: 'Recetas',
      mealPlanner: 'Planificador',
      pantry: 'Despensa',
      profile: 'Perfil',
      
      mainNavigation: 'Navegación principal',
      openMenu: 'Abrir menú',
      closeMenu: 'Cerrar menú',
      submenu: 'submenú',
      currentPage: 'página actual',
      
      voiceCommands: {
        navigateTo: 'ir a {page}',
        search: 'buscar {query}',
        help: 'ayuda',
      }
    }
  }
};
```

### RTL Language Support
```scss
// Base styles
.navigation {
  display: flex;
  padding-inline-start: 1rem; // Not padding-left
  margin-inline-end: 0.5rem; // Not margin-right
}

// RTL overrides
[dir="rtl"] {
  .navigation {
    flex-direction: row-reverse;
  }
  
  .nav-icon {
    margin-inline-start: 0.5rem;
    margin-inline-end: 0;
  }
  
  .dropdown {
    right: auto;
    left: 0;
  }
  
  // Flip directional icons
  .chevron-right {
    transform: scaleX(-1);
  }
}

// Logical properties for all directions
.nav-item {
  border-start-start-radius: 0.5rem;
  border-start-end-radius: 0.5rem;
  padding-block: 0.75rem;
  padding-inline: 1rem;
}
```

### Cultural Adaptations
```typescript
interface CulturalAdaptations {
  // Icon adaptations
  icons: {
    'menu': {
      'default': 'hamburger',
      'ja': 'bento', // Grid pattern
      'cn': 'dots-grid',
    },
    'home': {
      'default': 'house',
      'ja': '家', // Kanji character
    }
  };
  
  // Color meanings
  colors: {
    'success': {
      'default': '#10B981', // Green
      'cn': '#EF4444', // Red (lucky in China)
    },
    'danger': {
      'default': '#EF4444', // Red
      'th': '#6366F1', // Purple (unlucky color)
    }
  };
  
  // Layout preferences
  layout: {
    'menuPosition': {
      'default': 'left',
      'ar': 'right', // RTL cultures
      'ja': 'bottom', // Mobile-first culture
    }
  };
}
```

## 🎯 Testing Accessibility

### Automated Testing
```typescript
// Jest + React Testing Library
describe('Navigation Accessibility', () => {
  it('has proper ARIA labels', () => {
    render(<Navigation />);
    
    expect(screen.getByRole('navigation')).toHaveAttribute(
      'aria-label',
      'Main navigation'
    );
    
    expect(screen.getByRole('menuitem', { name: /dashboard/i }))
      .toHaveAttribute('aria-current', 'page');
  });
  
  it('is keyboard navigable', async () => {
    const user = userEvent.setup();
    render(<Navigation />);
    
    await user.tab(); // Focus first item
    expect(screen.getByRole('menuitem', { name: /dashboard/i }))
      .toHaveFocus();
    
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('menuitem', { name: /recipes/i }))
      .toHaveFocus();
  });
});

// Axe accessibility testing
describe('WCAG Compliance', () => {
  it('passes axe audit', async () => {
    const { container } = render(<Navigation />);
    const results = await axe(container);
    
    expect(results).toHaveNoViolations();
  });
});
```

### Manual Testing Checklist
```markdown
## Screen Reader Testing
- [ ] Test with NVDA (Windows)
- [ ] Test with JAWS (Windows)
- [ ] Test with VoiceOver (macOS/iOS)
- [ ] Test with TalkBack (Android)

## Keyboard Navigation
- [ ] Tab through all items
- [ ] Use arrow keys in menus
- [ ] Escape closes menus
- [ ] Enter activates items
- [ ] No keyboard traps

## Visual Testing
- [ ] Zoom to 400% - still usable
- [ ] High contrast mode works
- [ ] Focus indicators visible
- [ ] Color not sole indicator

## Cognitive Testing
- [ ] Navigation order logical
- [ ] Labels clear and consistent
- [ ] No unexpected changes
- [ ] Help available

## Voice Control
- [ ] Commands recognized
- [ ] Feedback provided
- [ ] Errors handled gracefully
- [ ] Multiple languages work
```

## 📊 Accessibility Metrics

### Performance Metrics
```typescript
interface A11yMetrics {
  automated: {
    axeScore: 100, // No violations
    lighthouseA11y: 100, // Perfect score
    waveErrors: 0, // No errors
    htmlValidation: 'pass',
  };
  
  manual: {
    keyboardSuccess: '100%', // All functions accessible
    screenReaderSuccess: '98%', // Minor issues acceptable
    voiceCommandAccuracy: '95%',
    cognitiveUsability: '90%', // User testing score
  };
  
  userSatisfaction: {
    disabledUsers: '95%', // Satisfaction rate
    elderlyUsers: '92%',
    mobileUsers: '98%',
    internationalUsers: '94%',
  };
}
```

## 🚀 Progressive Enhancement Strategy

```typescript
// Base experience - works without JS
<nav class="navigation">
  <a href="/dashboard">Dashboard</a>
  <details>
    <summary>Recipes</summary>
    <a href="/recipes/all">All Recipes</a>
    <a href="/recipes/favorites">Favorites</a>
  </details>
</nav>

// Enhanced with JS
if ('customElements' in window) {
  // Load web components
  import('./nav-enhanced.js');
}

// Add advanced features progressively
if ('speechRecognition' in window) {
  addVoiceControl();
}

if ('IntersectionObserver' in window) {
  addLazyLoading();
}

if (CSS.supports('gap', '1rem')) {
  useModernLayout();
}
```
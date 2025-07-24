# 🎨 Especificación de Componentes UI - iOS26 Glassmorphism

## 🌟 Sistema de Diseño iOS26

### Principios de Diseño
```typescript
interface iOS26DesignPrinciples {
  core: {
    depth: 'Multi-layer glassmorphism with z-axis';
    motion: 'Fluid, spring-based animations';
    haptics: 'Contextual feedback for all interactions';
    adaptivity: 'Dynamic colors based on content';
    accessibility: 'WCAG AAA compliance';
  };
  
  visual: {
    blur: '8px to 48px gradient blur';
    transparency: '0.1 to 0.3 with smart layering';
    shadows: 'Multi-level soft shadows';
    borders: 'Subtle white/10 borders';
    noise: 'Texture overlay for realism';
  };
}
```

## 🧩 Componentes Base

### 1. iOS26Button Enhanced
```typescript
interface iOS26ButtonProps {
  // Variantes visuales
  variant: 'elevated' | 'flat' | 'outlined' | 'ghost' | 'liquid';
  
  // Estados especiales
  states: {
    loading: {
      spinner: 'dots' | 'ring' | 'pulse';
      text: string;
    };
    success: {
      icon: 'check' | 'sparkle';
      duration: number;
    };
    error: {
      shake: boolean;
      message: string;
    };
  };
  
  // Efectos avanzados
  effects: {
    ripple: {
      color: string;
      duration: number;
      size: 'contain' | 'cover';
    };
    glow: {
      color: string;
      intensity: 0-1;
      pulse: boolean;
    };
    magnetic: {
      strength: 0-1;
      area: number;
    };
    particles: {
      onHover: boolean;
      onClick: boolean;
      colors: string[];
    };
  };
  
  // Animaciones
  animations: {
    hover: 'lift' | 'scale' | 'rotate' | 'morph';
    press: 'scale' | 'depth' | 'liquid';
    transition: SpringConfig;
  };
}

// Implementación
const iOS26Button = styled(motion.button)<iOS26ButtonProps>`
  /* Base styles */
  position: relative;
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
  
  /* Glass effect */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0) 100%
    );
    border-radius: inherit;
  }
  
  /* Noise texture */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    opacity: 0.03;
    background-image: url('data:image/svg+xml;base64,...');
    border-radius: inherit;
    pointer-events: none;
  }
`;
```

### 2. iOS26Card Advanced
```typescript
interface iOS26CardProps {
  // Efectos de profundidad
  depth: {
    layers: 1-5;
    spacing: number;
    blur: 'progressive' | 'uniform';
  };
  
  // Interacciones
  interactions: {
    tilt: {
      enabled: boolean;
      maxAngle: number;
      perspective: number;
    };
    hover: {
      float: boolean;
      glow: boolean;
      reveal: boolean;
    };
    drag: {
      enabled: boolean;
      constraints: DragConstraints;
      momentum: boolean;
    };
  };
  
  // Contenido dinámico
  content: {
    parallax: boolean;
    fadeIn: boolean;
    skeleton: boolean;
  };
}
```

### 3. iOS26Modal Liquid
```typescript
interface iOS26ModalProps {
  // Animaciones de entrada
  entrance: {
    type: 'liquid' | 'morph' | 'expand' | 'unfold';
    origin: 'center' | 'click' | 'element';
    duration: number;
  };
  
  // Comportamiento
  behavior: {
    dismissible: boolean;
    draggable: boolean;
    magnetic: boolean;
    stack: boolean;
  };
  
  // Efectos de fondo
  backdrop: {
    blur: number;
    overlay: string;
    parallax: boolean;
    particles: boolean;
  };
}
```

### 4. iOS26Input Neural
```typescript
interface iOS26InputProps {
  // Estados inteligentes
  intelligence: {
    autoComplete: 'ai' | 'history' | 'mixed';
    validation: 'realtime' | 'debounced' | 'onBlur';
    suggestions: {
      source: 'local' | 'ai' | 'both';
      display: 'dropdown' | 'inline' | 'chips';
    };
  };
  
  // Efectos visuales
  effects: {
    focus: {
      glow: boolean;
      expand: boolean;
      labelFloat: boolean;
    };
    typing: {
      pulse: boolean;
      ripple: boolean;
    };
  };
  
  // Accesibilidad mejorada
  a11y: {
    voiceInput: boolean;
    screenReaderOptimized: boolean;
    highContrast: boolean;
  };
}
```

## 🎭 Componentes Complejos

### 1. RecipeCard Interactive
```typescript
interface RecipeCardComponent {
  // Vista previa inteligente
  preview: {
    image: {
      lazy: boolean;
      blur: 'progressive' | 'instant';
      zoom: boolean;
    };
    video: {
      autoplay: boolean;
      hover: boolean;
      duration: number;
    };
  };
  
  // Información dinámica
  info: {
    nutrition: {
      display: 'compact' | 'detailed' | 'visual';
      animate: boolean;
    };
    difficulty: {
      visual: 'stars' | 'bar' | 'gauge';
      adaptive: boolean;
    };
    time: {
      format: 'relative' | 'absolute';
      breakdown: boolean;
    };
  };
  
  // Acciones rápidas
  actions: {
    save: {
      animation: 'heart' | 'bookmark' | 'star';
      feedback: 'haptic' | 'visual' | 'both';
    };
    cook: {
      quick: boolean;
      trackProgress: boolean;
    };
    share: {
      platforms: Platform[];
      preview: boolean;
    };
  };
}
```

### 2. PantryItem 3D
```typescript
interface PantryItem3D {
  // Visualización 3D
  visualization: {
    model: '3d' | '2.5d' | 'flat';
    rotation: boolean;
    lighting: 'dynamic' | 'static';
  };
  
  // Estados visuales
  states: {
    expiring: {
      animation: 'pulse' | 'glow' | 'shake';
      color: string;
    };
    low: {
      opacity: number;
      indicator: 'badge' | 'bar' | 'color';
    };
    selected: {
      scale: number;
      glow: boolean;
    };
  };
  
  // Información contextual
  context: {
    quantity: {
      display: 'numeric' | 'visual' | 'both';
      editable: 'inline' | 'modal';
    };
    expiration: {
      format: 'days' | 'date' | 'smart';
      urgency: 'color' | 'animation' | 'both';
    };
  };
}
```

### 3. MealPlanner Grid
```typescript
interface MealPlannerGrid {
  // Layout adaptativo
  layout: {
    view: 'week' | 'month' | 'list';
    responsive: {
      mobile: 'stack' | 'scroll';
      tablet: 'grid' | 'hybrid';
      desktop: 'full';
    };
  };
  
  // Drag & Drop avanzado
  dnd: {
    preview: 'ghost' | 'clone' | 'transform';
    feedback: {
      valid: 'glow' | 'pulse';
      invalid: 'shake' | 'red';
    };
    animation: SpringConfig;
    multiSelect: boolean;
  };
  
  // Visualización de datos
  visualization: {
    nutrition: 'inline' | 'hover' | 'modal';
    cost: boolean;
    time: boolean;
    calories: 'number' | 'bar' | 'pie';
  };
}
```

### 4. ShoppingList Smart
```typescript
interface SmartShoppingList {
  // Organización inteligente
  organization: {
    grouping: 'category' | 'store' | 'recipe';
    sorting: 'smart' | 'manual' | 'alphabetical';
    sections: {
      collapsible: boolean;
      reorderable: boolean;
      colorCoded: boolean;
    };
  };
  
  // Check-off experience
  checking: {
    animation: 'strike' | 'fade' | 'shrink' | 'confetti';
    haptic: 'light' | 'medium' | 'heavy';
    undo: {
      duration: number;
      position: 'inline' | 'toast';
    };
  };
  
  // Integraciones
  integrations: {
    priceTracking: boolean;
    storeMap: boolean;
    coupons: boolean;
    alternatives: boolean;
  };
}
```

## 🌈 Sistema de Temas

### Tema Adaptativo
```typescript
interface iOS26Theme {
  // Modos de color
  modes: {
    light: ColorPalette;
    dark: ColorPalette;
    auto: {
      schedule: 'system' | 'custom';
      transition: 'instant' | 'fade' | 'morph';
    };
  };
  
  // Personalización
  customization: {
    accent: {
      primary: string;
      secondary: string;
      gradient: boolean;
    };
    glass: {
      opacity: 0-1;
      blur: 0-48;
      tint: string;
    };
    animations: {
      speed: 0.5-2;
      reduced: boolean;
    };
  };
  
  // Presets
  presets: [
    'aurora', // Northern lights inspired
    'ocean',  // Deep sea blues
    'sunset', // Warm oranges and pinks
    'forest', // Natural greens
    'cosmic', // Space theme
    'minimal' // Clean and simple
  ];
}
```

## 🎬 Animaciones y Transiciones

### Sistema de Animación
```typescript
interface AnimationSystem {
  // Tipos de animación
  types: {
    entrance: {
      fade: FadeConfig;
      scale: ScaleConfig;
      slide: SlideConfig;
      morph: MorphConfig;
      liquid: LiquidConfig;
    };
    
    interaction: {
      hover: HoverAnimation;
      press: PressAnimation;
      drag: DragAnimation;
      swipe: SwipeAnimation;
    };
    
    transition: {
      page: PageTransition;
      modal: ModalTransition;
      list: ListTransition;
    };
  };
  
  // Orquestación
  orchestration: {
    stagger: {
      delay: number;
      from: 'first' | 'last' | 'center';
    };
    cascade: {
      direction: 'down' | 'up' | 'random';
      timing: 'linear' | 'ease' | 'spring';
    };
  };
  
  // Performance
  performance: {
    gpu: boolean;
    willChange: 'auto' | 'manual';
    reducedMotion: ReducedMotionStrategy;
  };
}
```

## 📱 Componentes Mobile-First

### Touch Optimized
```typescript
interface TouchOptimization {
  // Áreas táctiles
  touchTargets: {
    minSize: 44; // iOS standard
    padding: number;
    visualization: 'debug' | 'production';
  };
  
  // Gestos
  gestures: {
    swipe: {
      directions: Direction[];
      threshold: number;
      momentum: boolean;
    };
    pinch: {
      zoom: boolean;
      rotate: boolean;
    };
    longPress: {
      duration: number;
      feedback: 'haptic' | 'visual';
    };
  };
  
  // Optimizaciones
  optimizations: {
    scrolling: 'native' | 'custom';
    momentum: boolean;
    rubberBand: boolean;
    overscroll: 'bounce' | 'glow' | 'none';
  };
}
```

## 🔧 Utilidades y Helpers

### Component Factory
```typescript
// Factory para crear componentes iOS26
export const createiOS26Component = <P extends {}>(
  type: ComponentType,
  config: iOS26Config
) => {
  return styled(motion[type])<P>`
    /* Base iOS26 styles */
    ${props => getGlassStyles(props)}
    ${props => getAnimationStyles(props)}
    ${props => getInteractionStyles(props)}
    ${props => getAccessibilityStyles(props)}
    
    /* Custom styles */
    ${props => props.customStyles}
  `;
};

// Hooks útiles
export const useiOS26Theme = () => {
  const [theme, setTheme] = useState<iOS26Theme>();
  const prefersReducedMotion = useReducedMotion();
  const prefersDarkMode = useDarkMode();
  
  return {
    theme,
    setTheme,
    prefersReducedMotion,
    prefersDarkMode
  };
};
```

---

Este sistema de componentes crea una experiencia visual única y moderna, superando las limitaciones de A COMERLA con animaciones fluidas, efectos visuales impresionantes y una UX excepcional.
// Landing page types for UI components and animations

export interface FeatureCard {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  image?: string;
  gradient: string;
  delay?: number;
}

export interface TestimonialCard {
  id: string;
  name: string;
  role: string;
  avatar: string;
  content: string;
  rating: number;
  gradient: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: 'month' | 'year';
  description: string;
  features: string[];
  popular?: boolean;
  gradient: string;
  buttonText: string;
  icon: React.ReactNode;
}

export interface HeroStats {
  label: string;
  value: string;
  suffix?: string;
  gradient: string;
}

export interface InteractiveDemo {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  trigger: string;
  gradient: string;
}

export interface AnimationVariants {
  hidden: {
    opacity: number;
    y?: number;
    x?: number;
    scale?: number;
  };
  visible: {
    opacity: number;
    y?: number;
    x?: number;
    scale?: number;
    transition?: {
      duration: number;
      delay?: number;
      ease?: string;
    };
  };
}

export interface GradientConfig {
  primary: string;
  secondary: string;
  angle?: number;
  stops?: Array<{
    color: string;
    position: number;
  }>;
}

export interface GlassConfig {
  backdrop: string;
  border: string;
  shadow: string;
  opacity: number;
}

export interface ColorPalette {
  lime: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  purple: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  gradients: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
  };
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
  external?: boolean;
}

export interface CTAButton {
  id: string;
  text: string;
  href: string;
  variant: 'primary' | 'secondary' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  gradient?: string;
  onClick?: () => void;
}

export interface IllustrationProps {
  variant: 'hero' | 'feature' | 'testimonial' | 'pricing';
  size: 'sm' | 'md' | 'lg' | 'xl';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  animated?: boolean;
  className?: string;
}

export interface ProgressStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
  icon: React.ReactNode;
  color: string;
}

export interface MetricCard {
  id: string;
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  gradient: string;
  description: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  gradient: string;
}

export interface SocialProof {
  id: string;
  type: 'logo' | 'testimonial' | 'stat' | 'review';
  content: string;
  source: string;
  logo?: string;
  rating?: number;
  gradient?: string;
}

export interface DemoFeature {
  id: string;
  title: string;
  description: string;
  mockup: React.ReactNode;
  features: string[];
  gradient: string;
  interactive: boolean;
}

export interface MobileAppPreview {
  id: string;
  screen: string;
  title: string;
  description: string;
  features: string[];
  image: string;
  gradient: string;
}

export interface NewsletterForm {
  email: string;
  name?: string;
  preferences: {
    recipes: boolean;
    tips: boolean;
    updates: boolean;
  };
}

export interface LandingPageProps {
  className?: string;
  children?: React.ReactNode;
}

export interface SectionProps {
  id?: string;
  className?: string;
  children?: React.ReactNode;
  background?: 'transparent' | 'glass' | 'gradient';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl';
}

export interface HeroProps extends SectionProps {
  title: string;
  subtitle: string;
  description: string;
  cta: CTAButton[];
  stats: HeroStats[];
  illustration: React.ReactNode;
  background: {
    gradient: string;
    overlay: string;
  };
}

export interface FeaturesProps extends SectionProps {
  title: string;
  subtitle: string;
  features: FeatureCard[];
  layout: 'grid' | 'carousel' | 'masonry';
  columns: 1 | 2 | 3 | 4;
}

export interface TestimonialsProps extends SectionProps {
  title: string;
  subtitle: string;
  testimonials: TestimonialCard[];
  layout: 'grid' | 'carousel';
  autoplay?: boolean;
}

export interface PricingProps extends SectionProps {
  title: string;
  subtitle: string;
  plans: PricingPlan[];
  billing: 'monthly' | 'yearly';
  onBillingChange: (billing: 'monthly' | 'yearly') => void;
}

export interface CTAProps extends SectionProps {
  title: string;
  subtitle: string;
  description: string;
  cta: CTAButton[];
  background: {
    gradient: string;
    pattern: string;
  };
  illustration?: React.ReactNode;
}

export interface FooterProps extends SectionProps {
  navigation: {
    company: NavigationItem[];
    product: NavigationItem[];
    resources: NavigationItem[];
    legal: NavigationItem[];
  };
  social: NavigationItem[];
  newsletter: boolean;
  copyright: string;
}

// Animation types
export type AnimationType = 
  | 'fadeIn'
  | 'fadeInUp'
  | 'fadeInDown'
  | 'fadeInLeft'
  | 'fadeInRight'
  | 'slideInUp'
  | 'slideInDown'
  | 'slideInLeft'
  | 'slideInRight'
  | 'zoomIn'
  | 'zoomOut'
  | 'rotateIn'
  | 'bounceIn'
  | 'elastic'
  | 'spring';

export type EasingType = 
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'backIn'
  | 'backOut'
  | 'backInOut'
  | 'bounceIn'
  | 'bounceOut'
  | 'bounceInOut'
  | 'elasticIn'
  | 'elasticOut'
  | 'elasticInOut';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export type ThemeMode = 'light' | 'dark' | 'system';

export type GradientDirection = 
  | 'to-r'
  | 'to-l'
  | 'to-t'
  | 'to-b'
  | 'to-tr'
  | 'to-tl'
  | 'to-br'
  | 'to-bl';

export type GlassIntensity = 'light' | 'medium' | 'heavy';

export type BlurIntensity = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

export type ShadowIntensity = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'inner';

export type BorderRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';

export type SpacingScale = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 14 | 16 | 20 | 24 | 28 | 32 | 36 | 40 | 44 | 48 | 52 | 56 | 60 | 64 | 72 | 80 | 96;

export type BreakpointSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export type ComponentVariant = 
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'error'
  | 'ghost'
  | 'outline';

export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type ValidationState = 'valid' | 'invalid' | 'pending';

export type InteractionState = 'idle' | 'hover' | 'active' | 'focus' | 'disabled';

export type LayoutType = 'grid' | 'flex' | 'masonry' | 'carousel' | 'tabs' | 'accordion';

export type ContentType = 'text' | 'image' | 'video' | 'audio' | 'embed' | 'component';

export type MediaQuery = {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  orientation?: 'portrait' | 'landscape';
  resolution?: number;
  prefersReducedMotion?: boolean;
  prefersColorScheme?: 'light' | 'dark';
};
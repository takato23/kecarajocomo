# Navigation Performance Monitoring & Optimization Guide

## 🎯 Performance Goals & Budgets

### Core Web Vitals Targets
```typescript
interface PerformanceBudgets {
  // Google's Core Web Vitals
  coreWebVitals: {
    LCP: { // Largest Contentful Paint
      good: '<2.5s',
      needsImprovement: '2.5s-4.0s',
      poor: '>4.0s',
      budget: '2.0s' // Our target
    },
    FID: { // First Input Delay
      good: '<100ms',
      needsImprovement: '100ms-300ms',
      poor: '>300ms',
      budget: '50ms' // Our target
    },
    CLS: { // Cumulative Layout Shift
      good: '<0.1',
      needsImprovement: '0.1-0.25',
      poor: '>0.25',
      budget: '0.05' // Our target
    }
  },
  
  // Custom navigation metrics
  navigationMetrics: {
    TTN: '200ms', // Time to Navigate
    TTS: '100ms', // Time to Switch (tabs)
    GSR: '95%',   // Gesture Success Rate
    ANR: '<1%',   // Application Not Responding
  },
  
  // Resource budgets
  resources: {
    javascript: {
      total: '150KB',
      navigation: '30KB',
      critical: '10KB'
    },
    css: {
      total: '50KB',
      navigation: '10KB',
      critical: '5KB'
    },
    images: {
      icons: '50KB',
      sprites: '20KB'
    }
  }
}
```

## 📊 Real User Monitoring (RUM)

### Implementation Strategy
```typescript
class NavigationPerformanceMonitor {
  private metrics: Map<string, PerformanceEntry[]> = new Map();
  private observer: PerformanceObserver;
  
  constructor() {
    this.initializeObservers();
    this.trackCoreWebVitals();
    this.trackCustomMetrics();
  }
  
  private initializeObservers() {
    // Navigation timing
    this.observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.processEntry(entry);
      }
    });
    
    this.observer.observe({ 
      entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] 
    });
  }
  
  private trackCoreWebVitals() {
    // LCP
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.reportMetric('LCP', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });
    
    // FID
    new PerformanceObserver((entryList) => {
      const firstInput = entryList.getEntries()[0];
      const fid = firstInput.processingStart - firstInput.startTime;
      this.reportMetric('FID', fid);
    }).observe({ entryTypes: ['first-input'] });
    
    // CLS
    let clsValue = 0;
    let clsEntries = [];
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          clsEntries.push(entry);
        }
      }
      this.reportMetric('CLS', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  }
  
  private trackCustomMetrics() {
    // Time to Navigate
    window.addEventListener('navigation-start', (e: CustomEvent) => {
      performance.mark('navigation-start');
    });
    
    window.addEventListener('navigation-complete', (e: CustomEvent) => {
      performance.mark('navigation-complete');
      performance.measure('TTN', 'navigation-start', 'navigation-complete');
      
      const measure = performance.getEntriesByName('TTN')[0];
      this.reportMetric('TTN', measure.duration);
    });
    
    // Gesture Success Rate
    let gestureAttempts = 0;
    let gestureSuccesses = 0;
    
    window.addEventListener('gesture-attempted', () => gestureAttempts++);
    window.addEventListener('gesture-succeeded', () => {
      gestureSuccesses++;
      const rate = (gestureSuccesses / gestureAttempts) * 100;
      this.reportMetric('GSR', rate);
    });
  }
  
  private reportMetric(name: string, value: number) {
    // Send to analytics
    if (window.analytics) {
      window.analytics.track('Navigation Performance', {
        metric: name,
        value: value,
        timestamp: Date.now(),
        url: window.location.href,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        connection: navigator.connection?.effectiveType || 'unknown'
      });
    }
    
    // Log to console in dev
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${value}`);
    }
    
    // Check against budgets
    this.checkBudget(name, value);
  }
  
  private checkBudget(metric: string, value: number) {
    const budgets = {
      'LCP': 2000,
      'FID': 50,
      'CLS': 0.05,
      'TTN': 200
    };
    
    if (budgets[metric] && value > budgets[metric]) {
      console.warn(`[Performance] ${metric} exceeded budget: ${value} > ${budgets[metric]}`);
      this.triggerAlert(metric, value, budgets[metric]);
    }
  }
}
```

### Analytics Dashboard Configuration
```typescript
interface AnalyticsDashboard {
  // Real-time metrics
  realtime: {
    activeUsers: number;
    currentLoad: number;
    errorRate: number;
    p95ResponseTime: number;
  };
  
  // Historical data
  historical: {
    timeRange: '24h' | '7d' | '30d';
    metrics: {
      LCP: TimeSeries[];
      FID: TimeSeries[];
      CLS: TimeSeries[];
      TTN: TimeSeries[];
      GSR: TimeSeries[];
    };
    breakdowns: {
      byDevice: DeviceMetrics;
      byBrowser: BrowserMetrics;
      byCountry: CountryMetrics;
      byConnection: ConnectionMetrics;
    };
  };
  
  // Alerts
  alerts: {
    performance: Alert[];
    errors: Alert[];
    availability: Alert[];
  };
}

// Grafana dashboard query examples
const dashboardQueries = {
  // P95 navigation time
  p95Navigation: `
    histogram_quantile(0.95,
      sum(rate(navigation_duration_bucket[5m])) by (le)
    )
  `,
  
  // Error rate
  errorRate: `
    sum(rate(navigation_errors_total[5m])) /
    sum(rate(navigation_attempts_total[5m]))
  `,
  
  // Device breakdown
  deviceBreakdown: `
    sum by (device_type) (
      rate(navigation_duration_sum[5m]) /
      rate(navigation_duration_count[5m])
    )
  `
};
```

## 🚀 Performance Optimization Techniques

### 1. Critical Path Optimization
```typescript
// Identify and optimize critical rendering path
class CriticalPathOptimizer {
  static extractCriticalCSS() {
    const critical = require('critical');
    
    return critical.generate({
      base: 'dist/',
      src: 'index.html',
      target: 'index-critical.html',
      width: 1300,
      height: 900,
      inline: true,
      extract: true,
      penthouse: {
        blockJSRequests: false,
      }
    });
  }
  
  static inlineNavigationStyles() {
    // Inline only navigation-critical styles
    return `
      <style>
        /* Critical navigation styles */
        .nav{display:flex;height:64px;position:sticky;top:0;z-index:50}
        .nav-item{padding:0 16px;height:100%;display:flex;align-items:center}
        .nav-active{color:#84cc16;font-weight:600}
        
        /* Mobile critical */
        @media(max-width:768px){
          .nav{position:fixed;bottom:0;height:56px}
          .nav-desktop{display:none}
        }
      </style>
    `;
  }
}
```

### 2. Resource Loading Strategy
```typescript
// Progressive loading with priority hints
class ResourceLoader {
  static loadNavigationAssets() {
    // Critical resources - blocking
    const criticalCSS = document.createElement('link');
    criticalCSS.rel = 'stylesheet';
    criticalCSS.href = '/css/navigation-critical.css';
    criticalCSS.fetchPriority = 'high';
    document.head.appendChild(criticalCSS);
    
    // Non-critical CSS - non-blocking
    const fullCSS = document.createElement('link');
    fullCSS.rel = 'preload';
    fullCSS.as = 'style';
    fullCSS.href = '/css/navigation-full.css';
    fullCSS.onload = function() { this.rel = 'stylesheet'; };
    document.head.appendChild(fullCSS);
    
    // JavaScript - deferred
    const navJS = document.createElement('script');
    navJS.src = '/js/navigation.js';
    navJS.defer = true;
    navJS.fetchPriority = 'low';
    document.body.appendChild(navJS);
    
    // Preconnect to API
    const preconnect = document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = 'https://api.kecarajocomer.com';
    document.head.appendChild(preconnect);
    
    // Prefetch likely navigation targets
    this.prefetchLikelyRoutes();
  }
  
  static prefetchLikelyRoutes() {
    // Use ML to predict likely next navigation
    const predictions = NavigationPredictor.predict();
    
    predictions.forEach(route => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route.url;
      link.as = 'document';
      document.head.appendChild(link);
    });
  }
}
```

### 3. Animation Performance
```typescript
// GPU-accelerated animations
class PerformantAnimations {
  // Use CSS transforms only
  static optimizedTransitions = {
    // Good - uses transform
    slideIn: `
      .nav-menu {
        transform: translateX(-100%);
        transition: transform 200ms ease-out;
        will-change: transform;
      }
      .nav-menu.open {
        transform: translateX(0);
      }
    `,
    
    // Bad - causes reflow
    badSlideIn: `
      .nav-menu {
        left: -300px;
        transition: left 200ms ease-out;
      }
    `,
    
    // Optimized fade
    fade: `
      .nav-item {
        opacity: 0;
        transition: opacity 150ms ease-out;
        will-change: opacity;
      }
      .nav-item.visible {
        opacity: 1;
      }
    `
  };
  
  // FLIP animation technique
  static flipAnimation(element: HTMLElement, newState: () => void) {
    // First
    const first = element.getBoundingClientRect();
    
    // Last
    newState();
    const last = element.getBoundingClientRect();
    
    // Invert
    const deltaX = first.left - last.left;
    const deltaY = first.top - last.top;
    const deltaW = first.width / last.width;
    const deltaH = first.height / last.height;
    
    // Play
    element.animate([
      {
        transformOrigin: 'top left',
        transform: `
          translate(${deltaX}px, ${deltaY}px)
          scale(${deltaW}, ${deltaH})
        `
      },
      {
        transformOrigin: 'top left',
        transform: 'none'
      }
    ], {
      duration: 300,
      easing: 'ease-in-out',
      fill: 'both'
    });
  }
}
```

### 4. Memory Management
```typescript
class NavigationMemoryManager {
  private observers: Set<IntersectionObserver> = new Set();
  private listeners: Map<Element, Function[]> = new Map();
  private timers: Set<number> = new Set();
  
  // Cleanup on navigation
  cleanup() {
    // Remove observers
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers.clear();
    
    // Remove event listeners
    this.listeners.forEach((handlers, element) => {
      handlers.forEach(handler => {
        element.removeEventListener('click', handler);
      });
    });
    this.listeners.clear();
    
    // Clear timers
    this.timers.forEach(timer => {
      clearTimeout(timer);
    });
    this.timers.clear();
    
    // Force garbage collection in development
    if (process.env.NODE_ENV === 'development' && window.gc) {
      window.gc();
    }
  }
  
  // Track allocations
  trackAllocation<T>(resource: T, type: string): T {
    if (type === 'observer' && resource instanceof IntersectionObserver) {
      this.observers.add(resource);
    }
    // ... track other types
    return resource;
  }
}
```

## 📈 Performance Testing

### Automated Performance Tests
```typescript
// Using Playwright for performance testing
import { test, expect } from '@playwright/test';

test.describe('Navigation Performance', () => {
  test('meets LCP budget', async ({ page }) => {
    await page.goto('/');
    
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          resolve(entries[entries.length - 1].startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      });
    });
    
    expect(lcp).toBeLessThan(2000); // 2s budget
  });
  
  test('navigation completes quickly', async ({ page }) => {
    await page.goto('/dashboard');
    
    const startTime = Date.now();
    await page.click('nav a[href="/recipes"]');
    await page.waitForLoadState('networkidle');
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeLessThan(300); // 300ms budget
  });
  
  test('no layout shifts during navigation', async ({ page }) => {
    await page.goto('/');
    
    // Start measuring CLS
    await page.evaluate(() => {
      window.CLS = 0;
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            window.CLS += entry.value;
          }
        }
      }).observe({ entryTypes: ['layout-shift'] });
    });
    
    // Navigate
    await page.click('nav a[href="/recipes"]');
    await page.waitForTimeout(1000);
    
    const cls = await page.evaluate(() => window.CLS);
    expect(cls).toBeLessThan(0.05); // CLS budget
  });
});
```

### Lighthouse CI Configuration
```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/recipes',
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        throttling: {
          cpuSlowdownMultiplier: 1,
        },
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'first-meaningful-paint': ['error', { maxNumericValue: 2000 }],
        'speed-index': ['error', { maxNumericValue: 3000 }],
        'total-blocking-time': ['error', { maxNumericValue: 150 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.05 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

## 🔔 Alerting & Incident Response

### Alert Configuration
```yaml
# Prometheus alert rules
groups:
  - name: navigation_performance
    interval: 30s
    rules:
      - alert: HighNavigationLatency
        expr: |
          histogram_quantile(0.95,
            sum(rate(navigation_duration_bucket[5m])) by (le)
          ) > 0.3
        for: 5m
        labels:
          severity: warning
          team: frontend
        annotations:
          summary: "Navigation taking longer than 300ms at P95"
          description: "{{ $value }}s latency detected"
          
      - alert: HighErrorRate
        expr: |
          sum(rate(navigation_errors_total[5m])) /
          sum(rate(navigation_attempts_total[5m])) > 0.01
        for: 3m
        labels:
          severity: critical
          team: frontend
        annotations:
          summary: "Navigation error rate above 1%"
          description: "{{ $value }}% error rate"
          
      - alert: LowGestureSuccessRate
        expr: gesture_success_rate < 0.95
        for: 10m
        labels:
          severity: warning
          team: mobile
        annotations:
          summary: "Gesture recognition below 95%"
          description: "{{ $value }}% success rate"
```

### Incident Response Playbook
```markdown
## Navigation Performance Degradation

### Severity: High
**Impact**: Users experiencing slow navigation

### Detection
- P95 latency > 300ms for 5+ minutes
- Multiple user complaints
- RUM data showing degradation

### Response Steps
1. **Immediate Actions**
   - Check current traffic levels
   - Verify CDN status
   - Check API response times
   - Enable emergency cache

2. **Investigation**
   - Review recent deployments
   - Check browser console errors
   - Analyze waterfall charts
   - Review server logs

3. **Mitigation**
   - Rollback if recent deployment
   - Increase cache TTL
   - Enable simplified navigation
   - Scale up servers if needed

4. **Recovery**
   - Monitor metrics return to normal
   - Clear CDN cache if needed
   - Notify users of resolution
   - Update status page

5. **Post-Incident**
   - Write incident report
   - Update monitoring
   - Plan prevention measures
   - Share learnings
```

## 📊 Performance Reporting

### Weekly Performance Report Template
```typescript
interface PerformanceReport {
  period: {
    start: Date;
    end: Date;
  };
  
  summary: {
    avgLCP: number;
    p95LCP: number;
    avgFID: number;
    avgCLS: number;
    navigationSuccessRate: number;
    gestureSuccessRate: number;
  };
  
  trends: {
    lcpTrend: 'improving' | 'stable' | 'degrading';
    fidTrend: 'improving' | 'stable' | 'degrading';
    clsTrend: 'improving' | 'stable' | 'degrading';
  };
  
  issues: {
    budgetViolations: BudgetViolation[];
    incidents: Incident[];
    userComplaints: Complaint[];
  };
  
  improvements: {
    deployed: Improvement[];
    planned: Improvement[];
    impact: ImpactMeasurement[];
  };
  
  recommendations: {
    immediate: Action[];
    shortTerm: Action[];
    longTerm: Action[];
  };
}
```

## 🎯 Continuous Improvement

### A/B Testing Framework
```typescript
class NavigationABTest {
  static experiments = {
    // Test faster animation duration
    'nav-animation-speed': {
      control: { duration: 300 },
      variant: { duration: 200 },
      metric: 'perceived_speed',
      allocation: 0.5
    },
    
    // Test predictive prefetching
    'predictive-prefetch': {
      control: { enabled: false },
      variant: { enabled: true },
      metric: 'navigation_latency',
      allocation: 0.3
    },
    
    // Test gesture sensitivity
    'gesture-threshold': {
      control: { threshold: 75 },
      variant: { threshold: 50 },
      metric: 'gesture_success_rate',
      allocation: 0.2
    }
  };
  
  static runExperiment(name: string, userId: string) {
    const experiment = this.experiments[name];
    const hash = this.hashUserId(userId, name);
    const inVariant = hash < experiment.allocation;
    
    return inVariant ? experiment.variant : experiment.control;
  }
  
  static trackResult(name: string, metric: string, value: number) {
    analytics.track('AB Test Result', {
      experiment: name,
      metric: metric,
      value: value,
      variant: this.getCurrentVariant(name)
    });
  }
}
```
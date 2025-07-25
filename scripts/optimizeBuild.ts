#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { gzipSync } from 'zlib';

const execAsync = promisify(exec);

interface BuildMetrics {
  totalSize: number;
  jsSize: number;
  cssSize: number;
  imageSize: number;
  largestFiles: Array<{ file: string; size: number }>;
  buildTime: number;
  warnings: string[];
  errors: string[];
}

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

async function analyzeBuildSize(): Promise<BuildMetrics> {
  console.log(`${colors.cyan}📊 Analyzing build size...${colors.reset}\n`);
  
  const metrics: BuildMetrics = {
    totalSize: 0,
    jsSize: 0,
    cssSize: 0,
    imageSize: 0,
    largestFiles: [],
    buildTime: 0,
    warnings: [],
    errors: [],
  };

  const nextDir = path.join(process.cwd(), '.next');
  
  try {
    // Check if build exists
    await fs.access(nextDir);
  } catch {
    metrics.errors.push('No build found. Run "npm run build" first.');
    return metrics;
  }

  // Analyze static files
  const staticDir = path.join(nextDir, 'static');
  const files: Array<{ file: string; size: number }> = [];

  async function analyzeDirectory(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await analyzeDirectory(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        const ext = path.extname(entry.name);
        
        files.push({ file: fullPath.replace(process.cwd(), ''), size: stats.size });
        
        if (ext === '.js') metrics.jsSize += stats.size;
        else if (ext === '.css') metrics.cssSize += stats.size;
        else if (['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(ext)) {
          metrics.imageSize += stats.size;
        }
        
        metrics.totalSize += stats.size;
      }
    }
  }

  await analyzeDirectory(staticDir);
  
  // Get largest files
  metrics.largestFiles = files
    .sort((a, b) => b.size - a.size)
    .slice(0, 10);

  // Check for common issues
  if (metrics.jsSize > 1024 * 1024) { // 1MB
    metrics.warnings.push('JavaScript bundle size exceeds 1MB');
  }
  
  if (metrics.totalSize > 5 * 1024 * 1024) { // 5MB
    metrics.warnings.push('Total build size exceeds 5MB');
  }

  // Check for large unoptimized images
  const imageFiles = files.filter(f => 
    ['.png', '.jpg', '.jpeg'].some(ext => f.file.endsWith(ext))
  );
  
  for (const img of imageFiles) {
    if (img.size > 200 * 1024) { // 200KB
      metrics.warnings.push(`Large image: ${img.file} (${(img.size / 1024).toFixed(2)}KB)`);
    }
  }

  return metrics;
}

async function checkDependencies() {
  console.log(`${colors.cyan}🔍 Checking dependencies...${colors.reset}\n`);
  
  const warnings: string[] = [];
  
  try {
    // Check for security vulnerabilities
    const { stdout: auditOutput } = await execAsync('npm audit --json');
    const audit = JSON.parse(auditOutput);
    
    if (audit.metadata.vulnerabilities.high > 0 || audit.metadata.vulnerabilities.critical > 0) {
      warnings.push(`Found ${audit.metadata.vulnerabilities.high} high and ${audit.metadata.vulnerabilities.critical} critical vulnerabilities`);
    }
  } catch (error) {
    // npm audit returns non-zero exit code if vulnerabilities found
  }
  
  // Check bundle size
  try {
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'));
    const deps = Object.keys(packageJson.dependencies || {});
    
    // Known large dependencies
    const largeDeps = [
      { name: 'moment', suggestion: 'Use date-fns or dayjs instead' },
      { name: 'lodash', suggestion: 'Use lodash-es or individual imports' },
      { name: 'axios', suggestion: 'Use native fetch or smaller alternatives' },
    ];
    
    for (const dep of largeDeps) {
      if (deps.includes(dep.name)) {
        warnings.push(`Large dependency "${dep.name}" found. ${dep.suggestion}`);
      }
    }
  } catch (error) {
    warnings.push('Failed to analyze package.json');
  }
  
  return warnings;
}

async function optimizeImages() {
  console.log(`${colors.cyan}🖼️  Optimizing images...${colors.reset}\n`);
  
  const publicDir = path.join(process.cwd(), 'public');
  let optimized = 0;
  
  async function processDirectory(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await processDirectory(fullPath);
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        
        if (['.png', '.jpg', '.jpeg'].includes(ext)) {
          const stats = await fs.stat(fullPath);
          
          if (stats.size > 100 * 1024) { // 100KB
            console.log(`  ⚠️  Large image: ${fullPath.replace(process.cwd(), '')} (${(stats.size / 1024).toFixed(2)}KB)`);
            optimized++;
          }
        }
      }
    }
  }
  
  try {
    await processDirectory(publicDir);
    
    if (optimized > 0) {
      console.log(`\n  💡 Found ${optimized} images that could be optimized`);
      console.log(`     Consider using next/image or an image optimization service\n`);
    } else {
      console.log(`  ✅ No large unoptimized images found\n`);
    }
  } catch (error) {
    console.log(`  ⚠️  Could not analyze images: ${error}\n`);
  }
}

async function runLighthouse() {
  console.log(`${colors.cyan}🏃 Running Lighthouse audit...${colors.reset}\n`);
  
  try {
    // Check if app is running
    const { stdout } = await execAsync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000');
    
    if (stdout !== '200') {
      console.log(`  ⚠️  App not running on localhost:3000. Skipping Lighthouse.\n`);
      return;
    }
    
    console.log('  Running performance audit...');
    
    const { stdout: lhOutput } = await execAsync(
      'npx lighthouse http://localhost:3000 --output=json --quiet --chrome-flags="--headless"'
    );
    
    const results = JSON.parse(lhOutput);
    const categories = results.categories;
    
    console.log('\n  Performance Scores:');
    console.log(`  - Performance: ${Math.round(categories.performance.score * 100)}%`);
    console.log(`  - Accessibility: ${Math.round(categories.accessibility.score * 100)}%`);
    console.log(`  - Best Practices: ${Math.round(categories['best-practices'].score * 100)}%`);
    console.log(`  - SEO: ${Math.round(categories.seo.score * 100)}%`);
    
    if (categories.pwa) {
      console.log(`  - PWA: ${Math.round(categories.pwa.score * 100)}%`);
    }
    
    console.log('\n');
  } catch (error) {
    console.log(`  ⚠️  Could not run Lighthouse audit\n`);
  }
}

async function generateReport(metrics: BuildMetrics, depWarnings: string[]) {
  console.log(`${colors.cyan}📋 Build Optimization Report${colors.reset}\n`);
  
  console.log('Build Size Analysis:');
  console.log(`  Total Size: ${(metrics.totalSize / 1024 / 1024).toFixed(2)}MB`);
  console.log(`  JavaScript: ${(metrics.jsSize / 1024 / 1024).toFixed(2)}MB`);
  console.log(`  CSS: ${(metrics.cssSize / 1024).toFixed(2)}KB`);
  console.log(`  Images: ${(metrics.imageSize / 1024 / 1024).toFixed(2)}MB`);
  
  if (metrics.largestFiles.length > 0) {
    console.log('\nLargest Files:');
    metrics.largestFiles.slice(0, 5).forEach(file => {
      console.log(`  ${file.file}: ${(file.size / 1024).toFixed(2)}KB`);
    });
  }
  
  const allWarnings = [...metrics.warnings, ...depWarnings];
  
  if (allWarnings.length > 0) {
    console.log(`\n${colors.yellow}⚠️  Warnings:${colors.reset}`);
    allWarnings.forEach(warning => {
      console.log(`  - ${warning}`);
    });
  }
  
  if (metrics.errors.length > 0) {
    console.log(`\n${colors.red}❌ Errors:${colors.reset}`);
    metrics.errors.forEach(error => {
      console.log(`  - ${error}`);
    });
  }
  
  // Recommendations
  console.log(`\n${colors.blue}💡 Recommendations:${colors.reset}`);
  
  if (metrics.jsSize > 500 * 1024) {
    console.log('  - Enable code splitting for large JavaScript bundles');
    console.log('  - Use dynamic imports for non-critical features');
    console.log('  - Review and remove unused dependencies');
  }
  
  if (metrics.imageSize > 1024 * 1024) {
    console.log('  - Convert images to WebP format');
    console.log('  - Use next/image for automatic optimization');
    console.log('  - Implement lazy loading for below-fold images');
  }
  
  console.log('  - Enable compression in production (gzip/brotli)');
  console.log('  - Use CDN for static assets');
  console.log('  - Implement proper caching strategies');
  
  // Final status
  const hasErrors = metrics.errors.length > 0;
  const hasWarnings = allWarnings.length > 0;
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  if (hasErrors) {
    console.log(`${colors.red}❌ Build has errors that should be fixed before deployment${colors.reset}`);
  } else if (hasWarnings) {
    console.log(`${colors.yellow}⚠️  Build is ready but has warnings to address${colors.reset}`);
  } else {
    console.log(`${colors.green}✅ Build is optimized and ready for deployment!${colors.reset}`);
  }
  
  console.log('\n');
}

// Main execution
async function main() {
  console.log(`\n${colors.cyan}🚀 Production Build Optimization Check${colors.reset}\n`);
  console.log('='.repeat(50) + '\n');
  
  const startTime = Date.now();
  
  try {
    // Run build if needed
    console.log(`${colors.cyan}🔨 Building application...${colors.reset}\n`);
    const { stderr } = await execAsync('npm run build');
    
    if (stderr && !stderr.includes('Linting and checking validity of types')) {
      console.log(`${colors.yellow}Build warnings:${colors.reset}\n${stderr}\n`);
    }
    
    const buildTime = Date.now() - startTime;
    
    // Analyze build
    const metrics = await analyzeBuildSize();
    metrics.buildTime = buildTime;
    
    // Check dependencies
    const depWarnings = await checkDependencies();
    
    // Optimize images
    await optimizeImages();
    
    // Run Lighthouse if available
    await runLighthouse();
    
    // Generate report
    await generateReport(metrics, depWarnings);
    
  } catch (error) {
    console.error(`${colors.red}Error during optimization check:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { analyzeBuildSize, checkDependencies, optimizeImages };
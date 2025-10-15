#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function analyzeLighthouseReport() {
  console.log('🔍 Analyzing Lighthouse performance report...');
  
  const reportPath = path.join(__dirname, '../lighthouse-report.json');
  
  if (!fs.existsSync(reportPath)) {
    console.log('❌ Lighthouse report not found. Run "npm run lighthouse:ci" first.');
    return null;
  }

  try {
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const audits = report.lhr.audits;
    
    const metrics = {
      fcp: audits['first-contentful-paint']?.numericValue || 0,
      lcp: audits['largest-contentful-paint']?.numericValue || 0,
      fid: audits['max-potential-fid']?.numericValue || 0,
      cls: audits['cumulative-layout-shift']?.numericValue || 0,
      tti: audits['interactive']?.numericValue || 0,
      speedIndex: audits['speed-index']?.numericValue || 0,
      performanceScore: report.lhr.categories.performance.score * 100
    };

    console.log('📊 Core Web Vitals:');
    console.log(`  First Contentful Paint: ${Math.round(metrics.fcp)}ms`);
    console.log(`  Largest Contentful Paint: ${Math.round(metrics.lcp)}ms`);
    console.log(`  First Input Delay: ${Math.round(metrics.fid)}ms`);
    console.log(`  Cumulative Layout Shift: ${metrics.cls.toFixed(3)}`);
    console.log(`  Time to Interactive: ${Math.round(metrics.tti)}ms`);
    console.log(`  Speed Index: ${Math.round(metrics.speedIndex)}ms`);
    console.log(`  Performance Score: ${Math.round(metrics.performanceScore)}/100`);

    return metrics;
  } catch (error) {
    console.error('❌ Error reading Lighthouse report:', error.message);
    return null;
  }
}

function analyzeBundleSize() {
  console.log('\n📦 Analyzing bundle size...');
  
  const distDir = path.join(__dirname, '../dist');
  if (!fs.existsSync(distDir)) {
    console.log('❌ Dist directory not found. Run build first.');
    return null;
  }

  const assetsDir = path.join(distDir, 'assets');
  if (!fs.existsSync(assetsDir)) {
    console.log('❌ Assets directory not found.');
    return null;
  }

  const files = fs.readdirSync(assetsDir);
  const jsFiles = files.filter(file => file.endsWith('.js'));
  const cssFiles = files.filter(file => file.endsWith('.css'));
  
  let totalSize = 0;
  let jsSize = 0;
  let cssSize = 0;
  const fileSizes = {};

  // Analyze JS files
  jsFiles.forEach(file => {
    const filePath = path.join(assetsDir, file);
    const stats = fs.statSync(filePath);
    const sizeKB = Math.round(stats.size / 1024);
    totalSize += sizeKB;
    jsSize += sizeKB;
    fileSizes[file] = sizeKB;
  });

  // Analyze CSS files
  cssFiles.forEach(file => {
    const filePath = path.join(assetsDir, file);
    const stats = fs.statSync(filePath);
    const sizeKB = Math.round(stats.size / 1024);
    totalSize += sizeKB;
    cssSize += sizeKB;
    fileSizes[file] = sizeKB;
  });

  console.log(`  Total bundle size: ${totalSize}KB`);
  console.log(`  JavaScript: ${jsSize}KB`);
  console.log(`  CSS: ${cssSize}KB`);

  // Find largest files
  const largestFiles = Object.entries(fileSizes)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  console.log('\n📈 Largest files:');
  largestFiles.forEach(([file, size]) => {
    console.log(`  ${file}: ${size}KB`);
  });

  return {
    totalSize,
    jsSize,
    cssSize,
    fileSizes,
    largestFiles
  };
}

function analyzeDependencies() {
  console.log('\n📚 Analyzing dependencies...');
  
  const packageJsonPath = path.join(__dirname, '../package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.log('❌ package.json not found.');
    return null;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = Object.keys(packageJson.dependencies || {});
  const devDependencies = Object.keys(packageJson.devDependencies || {});

  console.log(`  Production dependencies: ${dependencies.length}`);
  console.log(`  Development dependencies: ${devDependencies.length}`);

  // Identify potentially heavy dependencies
  const heavyDeps = ['firebase', 'chart.js', 'react-chartjs-2', 'mongoose', '@google/genai'];
  const foundHeavyDeps = dependencies.filter(dep => 
    heavyDeps.some(heavy => dep.includes(heavy))
  );

  if (foundHeavyDeps.length > 0) {
    console.log('\n⚠️ Potentially heavy dependencies:');
    foundHeavyDeps.forEach(dep => {
      console.log(`  ${dep}`);
    });
  }

  return {
    dependencies,
    devDependencies,
    heavyDeps: foundHeavyDeps
  };
}

function generateRecommendations(metrics, bundleAnalysis, depsAnalysis) {
  console.log('\n💡 Performance Recommendations:');
  console.log('='.repeat(50));

  const recommendations = [];

  // Core Web Vitals recommendations
  if (metrics) {
    if (metrics.fcp > 1500) {
      recommendations.push('First Contentful Paint is slow. Consider critical CSS extraction and resource preloading.');
    }
    if (metrics.lcp > 2500) {
      recommendations.push('Largest Contentful Paint is slow. Optimize images and lazy load non-critical content.');
    }
    if (metrics.fid > 100) {
      recommendations.push('First Input Delay is high. Reduce JavaScript execution time and use web workers.');
    }
    if (metrics.cls > 0.1) {
      recommendations.push('Cumulative Layout Shift is high. Reserve space for images and avoid dynamic content insertion.');
    }
    if (metrics.performanceScore < 90) {
      recommendations.push('Overall performance score is low. Focus on Core Web Vitals improvements.');
    }
  }

  // Bundle size recommendations
  if (bundleAnalysis) {
    if (bundleAnalysis.totalSize > 500) {
      recommendations.push('Bundle size is large. Consider code splitting and lazy loading.');
    }
    if (bundleAnalysis.jsSize > 400) {
      recommendations.push('JavaScript bundle is large. Split into smaller chunks and remove unused code.');
    }
    if (bundleAnalysis.cssSize > 100) {
      recommendations.push('CSS bundle is large. Remove unused styles and consider CSS-in-JS.');
    }
  }

  // Dependency recommendations
  if (depsAnalysis && depsAnalysis.heavyDeps.length > 0) {
    recommendations.push('Heavy dependencies detected. Consider lazy loading or alternatives.');
  }

  // General recommendations
  recommendations.push('Enable gzip compression on your server.');
  recommendations.push('Use a CDN for static assets.');
  recommendations.push('Implement service worker for caching.');
  recommendations.push('Optimize images (WebP, lazy loading).');

  recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec}`);
  });

  return recommendations;
}

function saveAnalysisReport(metrics, bundleAnalysis, depsAnalysis, recommendations) {
  const report = {
    timestamp: new Date().toISOString(),
    metrics,
    bundleAnalysis,
    depsAnalysis,
    recommendations,
    summary: {
      performanceScore: metrics?.performanceScore || 0,
      totalBundleSize: bundleAnalysis?.totalSize || 0,
      heavyDependencies: depsAnalysis?.heavyDeps?.length || 0,
      totalRecommendations: recommendations.length
    }
  };

  const reportPath = path.join(__dirname, '../performance-analysis-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Analysis report saved to: ${reportPath}`);
}

// Main execution
async function main() {
  try {
    console.log('🚀 Performance Analysis');
    console.log('='.repeat(50));

    const metrics = analyzeLighthouseReport();
    const bundleAnalysis = analyzeBundleSize();
    const depsAnalysis = analyzeDependencies();
    
    const recommendations = generateRecommendations(metrics, bundleAnalysis, depsAnalysis);
    saveAnalysisReport(metrics, bundleAnalysis, depsAnalysis, recommendations);

    console.log('\n✅ Performance analysis complete!');

  } catch (error) {
    console.error('❌ Error during analysis:', error.message);
    process.exit(1);
  }
}

main();
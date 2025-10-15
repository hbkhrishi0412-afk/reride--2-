#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Performance budgets
const BUDGETS = {
  // Bundle size limits (in KB)
  bundleSize: {
    'index': 100, // Main bundle
    'react-core': 50, // React core
    'vendor': 150, // Other vendors
    'firebase': 100, // Firebase
    'charts': 50, // Chart.js
    'total': 500 // Total initial load
  },
  // Asset size limits (in KB)
  assetSize: {
    'css': 100, // CSS bundle
    'images': 200, // Images
    'fonts': 50 // Fonts
  },
  // Performance metrics
  performance: {
    'fcp': 1500, // First Contentful Paint (ms)
    'lcp': 2500, // Largest Contentful Paint (ms)
    'fid': 100, // First Input Delay (ms)
    'cls': 0.1, // Cumulative Layout Shift
    'tti': 3000 // Time to Interactive (ms)
  }
};

function analyzeBundleSize() {
  console.log('📊 Analyzing bundle size against performance budget...');
  
  const distDir = path.join(__dirname, '../dist');
  if (!fs.existsSync(distDir)) {
    console.log('❌ Dist directory not found. Run build first.');
    return false;
  }

  const assetsDir = path.join(distDir, 'assets');
  if (!fs.existsSync(assetsDir)) {
    console.log('❌ Assets directory not found.');
    return false;
  }

  const files = fs.readdirSync(assetsDir);
  const jsFiles = files.filter(file => file.endsWith('.js'));
  const cssFiles = files.filter(file => file.endsWith('.css'));
  
  let totalSize = 0;
  let violations = [];

  // Analyze JS files
  jsFiles.forEach(file => {
    const filePath = path.join(assetsDir, file);
    const stats = fs.statSync(filePath);
    const sizeKB = Math.round(stats.size / 1024);
    totalSize += sizeKB;

    // Check against budget
    const budget = getBudgetForFile(file);
    if (budget && sizeKB > budget) {
      violations.push({
        file,
        size: sizeKB,
        budget,
        type: 'bundle'
      });
    }

    console.log(`📦 ${file}: ${sizeKB}KB ${budget ? `(budget: ${budget}KB)` : ''}`);
  });

  // Analyze CSS files
  cssFiles.forEach(file => {
    const filePath = path.join(assetsDir, file);
    const stats = fs.statSync(filePath);
    const sizeKB = Math.round(stats.size / 1024);
    totalSize += sizeKB;

    if (sizeKB > BUDGETS.assetSize.css) {
      violations.push({
        file,
        size: sizeKB,
        budget: BUDGETS.assetSize.css,
        type: 'css'
      });
    }

    console.log(`🎨 ${file}: ${sizeKB}KB (budget: ${BUDGETS.assetSize.css}KB)`);
  });

  // Check total size
  if (totalSize > BUDGETS.bundleSize.total) {
    violations.push({
      file: 'total',
      size: totalSize,
      budget: BUDGETS.bundleSize.total,
      type: 'total'
    });
  }

  console.log(`\n📈 Total bundle size: ${totalSize}KB (budget: ${BUDGETS.bundleSize.total}KB)`);

  return violations;
}

function getBudgetForFile(filename) {
  if (filename.includes('index')) return BUDGETS.bundleSize.index;
  if (filename.includes('react-core')) return BUDGETS.bundleSize['react-core'];
  if (filename.includes('vendor')) return BUDGETS.bundleSize.vendor;
  if (filename.includes('firebase')) return BUDGETS.bundleSize.firebase;
  if (filename.includes('charts')) return BUDGETS.bundleSize.charts;
  return null;
}

function analyzeImages() {
  console.log('\n🖼️ Analyzing image sizes...');
  
  const distDir = path.join(__dirname, '../dist');
  const imagesDir = path.join(distDir, 'assets/images');
  
  if (!fs.existsSync(imagesDir)) {
    console.log('ℹ️ No images directory found.');
    return [];
  }

  const files = fs.readdirSync(imagesDir);
  const imageFiles = files.filter(file => /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(file));
  
  let totalImageSize = 0;
  let violations = [];

  imageFiles.forEach(file => {
    const filePath = path.join(imagesDir, file);
    const stats = fs.statSync(filePath);
    const sizeKB = Math.round(stats.size / 1024);
    totalImageSize += sizeKB;

    if (sizeKB > 100) { // 100KB per image
      violations.push({
        file,
        size: sizeKB,
        budget: 100,
        type: 'image'
      });
    }

    console.log(`🖼️ ${file}: ${sizeKB}KB`);
  });

  if (totalImageSize > BUDGETS.assetSize.images) {
    violations.push({
      file: 'total-images',
      size: totalImageSize,
      budget: BUDGETS.assetSize.images,
      type: 'total-images'
    });
  }

  console.log(`\n📊 Total image size: ${totalImageSize}KB (budget: ${BUDGETS.assetSize.images}KB)`);

  return violations;
}

function generateReport(violations) {
  console.log('\n📋 Performance Budget Report');
  console.log('='.repeat(50));

  if (violations.length === 0) {
    console.log('✅ All performance budgets met!');
    return;
  }

  console.log(`❌ ${violations.length} budget violation(s) found:\n`);

  violations.forEach((violation, index) => {
    const overage = violation.size - violation.budget;
    const percentage = Math.round((overage / violation.budget) * 100);
    
    console.log(`${index + 1}. ${violation.file}`);
    console.log(`   Size: ${violation.size}KB (${overage}KB over budget)`);
    console.log(`   Budget: ${violation.budget}KB`);
    console.log(`   Over by: ${percentage}%`);
    console.log(`   Type: ${violation.type}\n`);
  });

  // Generate recommendations
  console.log('💡 Recommendations:');
  violations.forEach(violation => {
    switch (violation.type) {
      case 'bundle':
        console.log(`- Consider code splitting for ${violation.file}`);
        break;
      case 'css':
        console.log(`- Optimize CSS in ${violation.file} (remove unused styles)`);
        break;
      case 'image':
        console.log(`- Compress image ${violation.file} or convert to WebP`);
        break;
      case 'total':
        console.log(`- Overall bundle is too large. Consider lazy loading more components.`);
        break;
    }
  });
}

function saveReport(violations) {
  const report = {
    timestamp: new Date().toISOString(),
    budgets: BUDGETS,
    violations: violations,
    summary: {
      totalViolations: violations.length,
      criticalViolations: violations.filter(v => v.size > v.budget * 1.5).length,
      warnings: violations.filter(v => v.size <= v.budget * 1.5).length
    }
  };

  const reportPath = path.join(__dirname, '../performance-budget-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report saved to: ${reportPath}`);
}

// Main execution
async function main() {
  try {
    console.log('🎯 Performance Budget Analysis');
    console.log('='.repeat(50));

    const bundleViolations = analyzeBundleSize();
    const imageViolations = analyzeImages();
    
    const allViolations = [...bundleViolations, ...imageViolations];
    
    generateReport(allViolations);
    saveReport(allViolations);

    if (allViolations.length > 0) {
      console.log('\n⚠️ Performance budget exceeded. Consider optimizations.');
      process.exit(1);
    } else {
      console.log('\n🎉 All performance budgets met!');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Error during analysis:', error.message);
    process.exit(1);
  }
}

main();
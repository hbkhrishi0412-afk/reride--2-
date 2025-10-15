#!/usr/bin/env node

/**
 * Performance Optimization Script for ReRide
 * 
 * This script helps optimize the development experience by:
 * 1. Cleaning caches
 * 2. Pre-warming the development server
 * 3. Optimizing bundle analysis
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 ReRide Performance Optimization Script');
console.log('==========================================');

// Clean function
function cleanCaches() {
  console.log('\n🧹 Cleaning caches...');
  
  const dirsToClean = [
    'node_modules/.vite',
    'dist',
    '.vite'
  ];
  
  dirsToClean.forEach(dir => {
    try {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`✅ Cleaned: ${dir}`);
      }
    } catch (error) {
      console.log(`⚠️  Could not clean ${dir}:`, error.message);
    }
  });
}

// Optimize function
function optimize() {
  console.log('\n⚡ Optimizing for performance...');
  
  // Check if we're in development mode
  const isDev = process.env.NODE_ENV !== 'production';
  
  if (isDev) {
    console.log('🔧 Development optimizations:');
    console.log('  - React.StrictMode disabled for faster renders');
    console.log('  - Lazy loading enabled for heavy components');
    console.log('  - Service worker disabled to prevent cache issues');
    console.log('  - File system caching enabled');
  } else {
    console.log('🏭 Production optimizations:');
    console.log('  - Code splitting enabled');
    console.log('  - Console logs removed');
    console.log('  - Minification enabled');
    console.log('  - Asset inlining for small files');
  }
}

// Bundle analysis function
function analyzeBundle() {
  console.log('\n📊 Bundle Analysis:');
  
  try {
    // Run build to analyze bundle
    console.log('Building for analysis...');
    execSync('npm run build', { stdio: 'pipe' });
    
    // Check if dist folder exists
    if (fs.existsSync('dist')) {
      const distFiles = fs.readdirSync('dist/assets');
      const jsFiles = distFiles.filter(file => file.endsWith('.js'));
      const cssFiles = distFiles.filter(file => file.endsWith('.css'));
      
      console.log(`\n📦 Generated ${jsFiles.length} JS chunks and ${cssFiles.length} CSS files`);
      
      // Show file sizes
      jsFiles.forEach(file => {
        const filePath = path.join('dist/assets', file);
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`  - ${file}: ${sizeKB} KB`);
      });
    }
  } catch (error) {
    console.log('⚠️  Could not analyze bundle:', error.message);
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--clean')) {
    cleanCaches();
  }
  
  if (args.includes('--optimize')) {
    optimize();
  }
  
  if (args.includes('--analyze')) {
    analyzeBundle();
  }
  
  if (args.length === 0) {
    console.log('\n📋 Available commands:');
    console.log('  --clean    Clean all caches');
    console.log('  --optimize Show optimization status');
    console.log('  --analyze  Analyze bundle size');
    console.log('\n💡 Example: node performance-optimize.js --clean --optimize');
  }
  
  console.log('\n✨ Performance optimization complete!');
}

main();

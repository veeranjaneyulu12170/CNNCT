const fs = require('fs');
const path = require('path');

// Ensure the dist directory exists
const distDir = path.resolve(__dirname, '../dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy the _redirects file
const redirectsFile = path.resolve(__dirname, '../public/_redirects');
const destFile = path.resolve(distDir, '_redirects');

if (fs.existsSync(redirectsFile)) {
  fs.copyFileSync(redirectsFile, destFile);
  console.log('Successfully copied _redirects file to dist directory');
} else {
  console.error('_redirects file not found in public directory');
  process.exit(1);
} 
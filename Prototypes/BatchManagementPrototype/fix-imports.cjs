#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const directories = ['cannabis', 'produce', 'components'];

// Pattern to match versioned imports like: from "package@1.2.3"
const versionedImportPattern = /from\s+["']([^@"']+)@[^"']+["']/g;

function fixFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fixed = content.replace(versionedImportPattern, (match, packageName) => {
    return `from "${packageName}"`;
  });
  
  if (content !== fixed) {
    fs.writeFileSync(filePath, fixed, 'utf8');
    console.log(`Fixed: ${filePath}`);
    return true;
  }
  return false;
}

function processDirectory(dir) {
  let fixedCount = 0;
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && item !== 'node_modules' && item !== '.next' && item !== 'dist') {
      fixedCount += processDirectory(fullPath);
    } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts'))) {
      if (fixFile(fullPath)) {
        fixedCount++;
      }
    }
  }
  
  return fixedCount;
}

let totalFixed = 0;
for (const dir of directories) {
  if (fs.existsSync(dir)) {
    console.log(`\nProcessing ${dir}/...`);
    totalFixed += processDirectory(dir);
  }
}

console.log(`\n✅ Fixed ${totalFixed} files`);

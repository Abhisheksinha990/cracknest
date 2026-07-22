const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const replacements = {
  'indigo-50': '[#e6f7f3]',
  'indigo-100': '[#cceee6]',
  'indigo-200': '[#99ddcd]',
  'indigo-300': '[#66ccb3]',
  'indigo-400': '[#33bb9a]',
  'indigo-500': '[#00B386]',
  'indigo-600': '[#009973]',
  'indigo-700': '[#007356]',
  'indigo-800': '[#004d3a]',
  'indigo-900': '[#00261d]',
  'blue-50': '[#e6f7f3]',
  'blue-100': '[#cceee6]',
  'blue-200': '[#99ddcd]',
  'blue-300': '[#66ccb3]',
  'blue-400': '[#33bb9a]',
  'blue-500': '[#00B386]',
  'blue-600': '[#009973]',
  'blue-700': '[#007356]',
  'blue-800': '[#004d3a]',
  'blue-900': '[#00261d]',
};

function processDirectory(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.css') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const [key, value] of Object.entries(replacements)) {
        // use regex to replace text-indigo-500, bg-indigo-500, etc.
        const regex = new RegExp(`(text|bg|border|shadow|from|to|via)-${key}(/\\d+)?`, 'g');
        content = content.replace(regex, `$1-${value}$2`);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  });
}

processDirectory(directoryPath);
console.log("Color replacement complete.");

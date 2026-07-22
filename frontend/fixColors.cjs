const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(directoryPath, function(filePath) {
  if (filePath.endsWith('.js') || filePath.endsWith('.jsx') || filePath.endsWith('.css')) {
    let fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Replace the specific messed up colors
    let newContent = fileContent
      .replace(/\[#e6f7f3\]0/g, '[#00B386]') // indigo-500 -> primary teal color
      .replace(/\[#cceee6\]0/g, '[#009973]'); // indigo-1000? Just in case, replace with darker teal
    
    if (fileContent !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Fixed:', filePath);
    }
  }
});

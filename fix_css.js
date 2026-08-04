const fs = require('fs');
let styleCss = fs.readFileSync('d:/Ngoc selection/Ngọc/style.css', 'utf8');

// Use regex to replace .custom-cursor { block
styleCss = styleCss.replace(/\.custom-cursor\s*\{([\s\S]*?)z-index:\s*9999;([\s\S]*?)\}/, (match, p1, p2) => {
    return `.custom-cursor {${p1}z-index: 9999;\n    will-change: transform;${p2}}`;
});

fs.writeFileSync('d:/Ngoc selection/Ngọc/style.css', styleCss, 'utf8');
console.log('Done CSS');

const fs = require('fs');
const path = require('path');

function cleanupPractice(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace all text-white with text-zinc-900
  content = content.replace(/text-white/g, 'text-zinc-900');
  
  // Restore text-white for dark/primary buttons
  content = content.replace(/bg-zinc-900([^"]*)text-zinc-900/g, 'bg-zinc-900$1text-white');
  content = content.replace(/bg-emerald-600([^"]*)text-zinc-900/g, 'bg-emerald-600$1text-white');
  content = content.replace(/bg-emerald-500([^"]*)text-zinc-900/g, 'bg-emerald-500$1text-white');

  // Specific placeholders and borders that might have been missed in Practice
  content = content.replace(/placeholder-slate-500/g, 'placeholder-zinc-500');
  content = content.replace(/border-slate-600/g, 'border-zinc-400');
  content = content.replace(/shadow-emerald-500\/20/g, 'shadow-sm');
  content = content.replace(/shadow-\[0_0_15px_rgba\(5,150,105,0\.4\)\]/g, 'shadow-sm');
  
  fs.writeFileSync(filePath, content, 'utf8');
}

cleanupPractice(path.join(__dirname, 'client/src/pages/PracticePage.jsx'));
cleanupPractice(path.join(__dirname, 'client/src/pages/AdaptivePractice.jsx'));

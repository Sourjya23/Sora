const fs = require('fs');
const path = require('path');

function addGradients(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix the leftover dark gradient over the search bar
  content = content.replace(/bg-gradient-to-t from-slate-900 via-slate-900 to-transparent/g, 'bg-gradient-to-t from-white via-white/90 to-transparent pt-12');

  // Search bar input background gradient
  content = content.replace(/className="w-full bg-zinc-50 border border-zinc-300/g, 'className="w-full bg-gradient-to-r from-zinc-50 via-white to-zinc-50 border border-zinc-200');

  // Sidebar gradient
  content = content.replace(/w-64 bg-zinc-50 border-r border-zinc-200/g, 'w-64 bg-gradient-to-b from-zinc-50 to-zinc-100/50 border-r border-zinc-200');

  // Editor header gradient
  content = content.replace(/h-12 bg-zinc-50 border-b border-zinc-200/g, 'h-12 bg-gradient-to-r from-zinc-50 to-zinc-100/80 border-b border-zinc-200');

  // Terminal background gradient
  content = content.replace(/h-full bg-zinc-50 border-t border-zinc-200/g, 'h-full bg-gradient-to-br from-white to-zinc-50/80 border-t border-zinc-200');

  fs.writeFileSync(filePath, content, 'utf8');
}

addGradients(path.join(__dirname, 'client/src/pages/AdaptivePractice.jsx'));

const fs = require('fs');
const path = require('path');

function updateUI(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Global Font
  if (content.includes('font-sans') && !content.includes('fontFamily')) {
    content = content.replace('flex flex-col font-sans"', 'flex flex-col font-sans" style={{ fontFamily: \'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif\' }}"');
  }

  // Backgrounds
  content = content.replace(/bg-slate-950\/80/g, 'bg-white/90');
  content = content.replace(/bg-slate-950/g, 'bg-zinc-50');
  content = content.replace(/bg-slate-900\/50/g, 'bg-zinc-50');
  content = content.replace(/bg-slate-900\/30/g, 'bg-zinc-50');
  content = content.replace(/bg-slate-900\/20/g, 'bg-white');
  content = content.replace(/bg-slate-900\/10/g, 'bg-zinc-50');
  content = content.replace(/bg-slate-900/g, 'bg-white');
  content = content.replace(/bg-slate-850/g, 'bg-zinc-100');
  content = content.replace(/bg-slate-800/g, 'bg-zinc-100');
  content = content.replace(/bg-slate-700/g, 'bg-zinc-200');

  // Texts
  content = content.replace(/text-slate-100/g, 'text-zinc-900');
  content = content.replace(/text-slate-200/g, 'text-zinc-800');
  content = content.replace(/text-slate-300/g, 'text-zinc-700');
  content = content.replace(/text-slate-400/g, 'text-zinc-600');
  content = content.replace(/text-slate-500/g, 'text-zinc-500');
  
  // Borders
  content = content.replace(/border-slate-900\/60/g, 'border-zinc-200');
  content = content.replace(/border-slate-900/g, 'border-zinc-200');
  content = content.replace(/border-slate-850/g, 'border-zinc-200');
  content = content.replace(/border-slate-800/g, 'border-zinc-200');
  content = content.replace(/border-slate-700/g, 'border-zinc-300');

  // Gradients and Glows
  content = content.replace(/bg-gradient-to-r from-violet-600 to-fuchsia-600/g, 'bg-zinc-900');
  content = content.replace(/hover:from-violet-500 hover:to-fuchsia-500/g, 'hover:bg-zinc-800');
  content = content.replace(/text-violet-400/g, 'text-zinc-900');
  content = content.replace(/text-violet-300/g, 'text-zinc-800');
  content = content.replace(/border-violet-500\/50/g, 'border-zinc-900/50');
  content = content.replace(/border-violet-500/g, 'border-zinc-900');
  content = content.replace(/focus:border-violet-500/g, 'focus:border-zinc-900');
  content = content.replace(/shadow-violet-500\/10/g, 'shadow-sm');
  content = content.replace(/shadow-violet-500\/20/g, 'shadow');
  
  // Violet buttons
  content = content.replace(/bg-violet-600/g, 'bg-zinc-900');
  content = content.replace(/hover:bg-violet-500/g, 'hover:bg-zinc-800');

  // Fix button text issues
  content = content.replace(/bg-zinc-900 text-zinc-900/g, 'bg-zinc-900 text-white');
  content = content.replace(/bg-zinc-900 hover:bg-zinc-800 text-zinc-900/g, 'bg-zinc-900 hover:bg-zinc-800 text-white');
  
  // Fix the trailing quote issue on style attribute
  content = content.replace(/sans-serif' \}\}"/g, "sans-serif' }}");

  fs.writeFileSync(filePath, content, 'utf8');
}

updateUI(path.join(__dirname, 'client/src/pages/PracticePage.jsx'));
updateUI(path.join(__dirname, 'client/src/pages/AdaptivePractice.jsx'));
updateUI(path.join(__dirname, 'client/src/components/CodeEditor.jsx'));
updateUI(path.join(__dirname, 'client/src/components/Terminal.jsx'));

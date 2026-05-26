const fs = require('fs');
const path = require('path');

function updateEditor(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Change hex backgrounds to light mode equivalents
  content = content.replace(/bg-\[#0a0a0a\]/g, 'bg-zinc-50');
  content = content.replace(/bg-\[#1e1e1e\]\/80/g, 'bg-white/80');
  content = content.replace(/bg-\[#1e1e1e\]/g, 'bg-white');
  content = content.replace(/bg-\[#181818\]/g, 'bg-zinc-50');
  content = content.replace(/bg-\[#2d2d2d\]/g, 'bg-white');
  content = content.replace(/bg-\[#3d3d3d\]/g, 'bg-zinc-100');
  
  // Update borders that were matched with dark editors
  content = content.replace(/border-\[#2d2d2d\]/g, 'border-zinc-200');
  content = content.replace(/bg-slate-600/g, 'bg-zinc-300'); // separator handle

  // Switch Monaco Editor from vs-dark to light
  content = content.replace(/theme="vs-dark"/g, 'theme="light"');
  
  // Specific fix for "Evaluation results will appear here..." which is inside the Terminal panel
  // Currently terminal has bg-[#0a0a0a] or similar. Wait, the terminal panel is usually `client/src/components/Terminal.jsx` or inline.
  // In AdaptivePractice.jsx, it's inline. Let's see what terminal uses.
  // We've already replaced text-white with text-zinc-900 globally in these files, so the terminal text is likely text-zinc-900.
  // If the terminal background was #0a0a0a, it's now bg-zinc-50, which is correct for dark text.

  fs.writeFileSync(filePath, content, 'utf8');
}

updateEditor(path.join(__dirname, 'client/src/pages/PracticePage.jsx'));
updateEditor(path.join(__dirname, 'client/src/pages/AdaptivePractice.jsx'));

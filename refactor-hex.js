const fs = require('fs');
const path = require('path');

function refactorHex(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Background Hex replacements
  content = content.replace(/bg-\[#111111\]/g, 'bg-zinc-50');
  content = content.replace(/bg-\[#1a1a1a\]/g, 'bg-zinc-100');
  content = content.replace(/bg-\[#0a0d14\]/g, 'bg-zinc-50');
  content = content.replace(/bg-\[#0f172a\]/g, 'bg-white');

  // Iframe specific strings
  content = content.replace(/background: #0f172a/g, 'background: #ffffff');
  content = content.replace(/background:#0f172a/g, 'background:#ffffff');
  content = content.replace(/color: white/g, 'color: #18181b');
  content = content.replace(/color:white/g, 'color:#18181b');
  content = content.replace(/color:#fb7185/g, 'color:#e11d48'); // rose-400 to rose-600 equivalent

  // Text color contrast adjustments
  content = content.replace(/text-emerald-400/g, 'text-emerald-700');
  content = content.replace(/text-emerald-300/g, 'text-emerald-600');
  content = content.replace(/text-rose-400/g, 'text-rose-600');
  
  // Slate text left-overs
  content = content.replace(/text-slate-600/g, 'text-zinc-600');

  // One more check for Sidebar problem history invisible text:
  // In AdaptivePractice.jsx, line 269: <span className="text-[10px] text-zinc-900 font-bold">{hItem.topic}</span>
  // That text should be fine now that the background is bg-white / bg-zinc-50

  fs.writeFileSync(filePath, content, 'utf8');
}

refactorHex(path.join(__dirname, 'client/src/pages/PracticePage.jsx'));
refactorHex(path.join(__dirname, 'client/src/pages/AdaptivePractice.jsx'));

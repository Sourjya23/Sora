const fs = require('fs');
const path = require('path');

function cleanupFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix buttons that became text-zinc-900 instead of text-white
  content = content.replace(/bg-zinc-900 text-zinc-900/g, 'bg-zinc-900 text-white');
  content = content.replace(/bg-zinc-900 hover:bg-zinc-800 text-zinc-900/g, 'bg-zinc-900 hover:bg-zinc-800 text-white');
  
  // Fix violet shadows
  content = content.replace(/shadow-violet-600\/10/g, 'shadow-black/5');
  content = content.replace(/shadow-violet-600\/20/g, 'shadow-black/10');
  
  // File upload input button text
  content = content.replace(/file:bg-zinc-900 file:text-zinc-900/g, 'file:bg-zinc-900 file:text-white');
  
  // Any stray 'text-zinc-900' inside hover:text-white that might have broken
  content = content.replace(/hover:text-zinc-900/g, 'hover:text-zinc-900'); // Actually, hover:text-white became hover:text-zinc-900 which is fine for light theme

  // Some text-white might have been replaced wrongly.
  
  fs.writeFileSync(filePath, content, 'utf8');
}

cleanupFile(path.join(__dirname, 'client/src/pages/CandidateDashboard.jsx'));
cleanupFile(path.join(__dirname, 'client/src/pages/InterviewerDashboard.jsx'));
cleanupFile(path.join(__dirname, 'client/src/components/CompleteProfile.jsx'));

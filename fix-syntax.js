const fs = require('fs');
const path = require('path');

function fixSyntax(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix the trailing quote on style={{}}
  content = content.replace(/sans-serif' \}\}"/g, "sans-serif' }}");
  
  fs.writeFileSync(filePath, content, 'utf8');
}

fixSyntax(path.join(__dirname, 'client/src/pages/CandidateDashboard.jsx'));
fixSyntax(path.join(__dirname, 'client/src/pages/InterviewerDashboard.jsx'));

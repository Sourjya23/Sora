const fs = require('fs');
const path = require('path');

const clientDir = path.join(__dirname, 'client');
const srcDir = path.join(clientDir, 'src');

const BOILERPLATES_STR = `
const BOILERPLATES = {
  javascript: "function solve() {\\n  // Write your code here\\n}\\n\\nconsole.log(solve());",
  python: "def solve():\\n    # Write your code here\\n    pass\\n\\nif __name__ == '__main__':\\n    solve()",
  java: "public class Main {\\n    public static void main(String[] args) {\\n        // Write your code here\\n    }\\n}",
  cpp: "#include <iostream>\\nusing namespace std;\\n\\nint main() {\\n    // Write your code here\\n    return 0;\\n}",
  csharp: "using System;\\n\\nclass Program {\\n    static void Main() {\\n        // Write your code here\\n    }\\n}"
};
`;

const HANDLE_CHANGE_STR = `
  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    const isStarter = !code || code === "// Your code here" || code === "// Start coding here..." || Object.values(BOILERPLATES).includes(code);
    if (isStarter) {
      setCode(BOILERPLATES[newLang] || "// Your code here");
    }
  };

`;

function updatePracticeFile(filename) {
  const filePath = path.join(srcDir, 'pages', filename);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes('const BOILERPLATES')) {
    content = content.replace(/const LANGUAGES = \{[\s\S]*?\};\n/, match => match + BOILERPLATES_STR);
  }

  if (!content.includes('handleLanguageChange')) {
    content = content.replace(/const handleSubmitCode = /g, match => HANDLE_CHANGE_STR + match);
    content = content.replace(/onChange=\{\(e\) => setLanguage\(e\.target\.value\)\}/g, 'onChange={handleLanguageChange}');
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

updatePracticeFile('AdaptivePractice.jsx');
updatePracticeFile('PracticePage.jsx');

const soraLogoBlock = `<div className="flex items-center space-x-3">
            <div className="w-[30px] h-[30px] rounded-[8px] bg-white flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px]">
                <path d="M16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11C14.2091 11 16 12.7909 16 15C16 17.2091 14.2091 19 12 19C9.79086 19 8 17.2091 8 15" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }} className="text-[20px] font-extrabold text-white tracking-[-0.01em]">
              Sora
            </span>
          </div>`;

function updateDashboardBranding(filename) {
  const filePath = path.join(srcDir, 'pages', filename);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace old interview.io logo block
  const oldLogoRegex = /<div className="flex items-center space-x-3">[\s\S]*?interview\.io[\s\S]*?<\/div>/;
  content = content.replace(oldLogoRegex, soraLogoBlock);

  fs.writeFileSync(filePath, content, 'utf8');
}

updateDashboardBranding('CandidateDashboard.jsx');
updateDashboardBranding('InterviewerDashboard.jsx');

// Update index.html
const indexPath = path.join(clientDir, 'index.html');
if (fs.existsSync(indexPath)) {
  let indexHtml = fs.readFileSync(indexPath, 'utf8');
  indexHtml = indexHtml.replace('<title>interview.io — Technical Interview Platform</title>', '<title>Sora</title>');
  fs.writeFileSync(indexPath, indexHtml, 'utf8');
}

// Generate favicon.svg
const faviconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">' +
  '<path d="M16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11C14.2091 11 16 12.7909 16 15C16 17.2091 14.2091 19 12 19C9.79086 19 8 17.2091 8 15" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
'</svg>';
fs.writeFileSync(path.join(clientDir, 'public', 'favicon.svg'), faviconSvg, 'utf8');

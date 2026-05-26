const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'client/src/pages/PracticePage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const HANDLE_CHANGE_STR = `
  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    const isStarter = !editorCode || editorCode === "// Your code here" || editorCode === "// Start coding here...\\n" || Object.values(BOILERPLATES).includes(editorCode);
    if (isStarter) {
      setEditorCode(BOILERPLATES[newLang] || "// Your code here");
    }
  };

`;

if (!content.includes('const handleLanguageChange =')) {
  content = content.replace(/const handleRunCode =/g, match => HANDLE_CHANGE_STR + match);
  fs.writeFileSync(filePath, content, 'utf8');
}

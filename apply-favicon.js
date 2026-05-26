const fs = require('fs');
const path = require('path');

const srcLogo = path.join(__dirname, 'server/Asset/Sora_Favicon.jpg');
const destLogo = path.join(__dirname, 'client/public/Sora_Favicon.jpg');

// Copy logo
if (fs.existsSync(srcLogo)) {
  fs.copyFileSync(srcLogo, destLogo);
}

// 1. Update index.html
const indexHtmlPath = path.join(__dirname, 'client/index.html');
if (fs.existsSync(indexHtmlPath)) {
  let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  indexHtml = indexHtml.replace(/<link rel="icon" type="image\/svg\+xml" href="\/favicon\.svg" \/>/g, '<link rel="icon" type="image/jpeg" href="/Sora_Favicon.jpg" />');
  fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
}

// 2. Update LandingPage.jsx Navbar logo
const landingPath = path.join(__dirname, 'client/src/pages/LandingPage.jsx');
if (fs.existsSync(landingPath)) {
  let landing = fs.readFileSync(landingPath, 'utf8');
  const landingOldLogoRegex = /<div className="w-\[30px\] h-\[30px\] rounded-\[8px\] bg-zinc-900 flex items-center justify-center">[\s\S]*?<\/svg>\s*<\/div>/;
  const imgTagBlock = `<div className="w-[30px] h-[30px] rounded-[8px] bg-white flex items-center justify-center overflow-hidden">\n            <img src="/Sora_Favicon.jpg" alt="Sora Logo" className="w-full h-full object-cover" />\n          </div>`;
  landing = landing.replace(landingOldLogoRegex, imgTagBlock);
  fs.writeFileSync(landingPath, landing, 'utf8');
}

// 3. Update Dashboards
const dashboardBlock = `<div className="w-[30px] h-[30px] rounded-[8px] bg-white flex items-center justify-center">\n              <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px]">\n                <path d="M16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11C14.2091 11 16 12.7909 16 15C16 17.2091 14.2091 19 12 19C9.79086 19 8 17.2091 8 15" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>\n              </svg>\n            </div>`;
const newDashboardImgBlock = `<div className="w-[30px] h-[30px] rounded-[8px] bg-white flex items-center justify-center overflow-hidden">\n              <img src="/Sora_Favicon.jpg" alt="Sora Logo" className="w-full h-full object-cover" />\n            </div>`;

['CandidateDashboard.jsx', 'InterviewerDashboard.jsx'].forEach(file => {
  const fp = path.join(__dirname, 'client/src/pages', file);
  if (fs.existsSync(fp)) {
    let content = fs.readFileSync(fp, 'utf8');
    content = content.replace(dashboardBlock, newDashboardImgBlock);
    fs.writeFileSync(fp, content, 'utf8');
  }
});

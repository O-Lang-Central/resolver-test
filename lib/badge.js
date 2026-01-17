const fs = require("fs");
const path = require("path");

function generateBadge({ passed, outputDir }) {
  const badgePath = path.join(outputDir, "certified.svg");

  const svg = passed
    ? `
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="28">
  <rect rx="4" width="160" height="28" fill="#2d2d2d"/>
  <rect rx="4" x="80" width="80" height="28" fill="#4cbb17"/>
  <text x="40" y="18" fill="#fff" font-size="13" font-family="Arial" text-anchor="middle">O-lang</text>
  <text x="120" y="18" fill="#fff" font-size="13" font-family="Arial" text-anchor="middle">CERTIFIED</text>
</svg>`
    : `
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="28">
  <rect rx="4" width="160" height="28" fill="#2d2d2d"/>
  <rect rx="4" x="80" width="80" height="28" fill="#bb2124"/>
  <text x="40" y="18" fill="#fff" font-size="13" font-family="Arial" text-anchor="middle">O-lang</text>
  <text x="120" y="18" fill="#fff" font-size="13" font-family="Arial" text-anchor="middle">FAILED</text>
</svg>`;

  fs.writeFileSync(badgePath, svg.trim());
  return badgePath;
}

module.exports = { generateBadge };

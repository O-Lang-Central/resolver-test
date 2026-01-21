const fs = require("fs");
const path = require("path");
console.log("✅ O-lang badge generator loaded");

function generateBadge({
  resolverName = "Unknown",
  version = "",
  passed = false,
  outputDir = process.cwd()
}) {
  // Colors
  const olangColor = "#8A2BE2"; // Purple for "O-lang"
  const statusColor = passed ? "#4CAF50" : "#F44336"; // Green/Red for status

  const statusText = passed ? "Certified" : "Failed";
  const versionText = version ? ` v${version}` : "";
  const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Left label: "O-lang"
  const leftLabel = "O-lang";
  // Right message: "resolver-name v1.0 — Certified (2026-01-22)"
  const rightMessage = `${resolverName}${versionText} — ${statusText} (${timestamp})`;

  // Estimate text widths (approx. 7px per char + padding)
  const leftWidth = 12 + leftLabel.length * 7;
  const rightWidth = 12 + rightMessage.length * 7;
  const totalWidth = leftWidth + rightWidth;

  const badgeSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20">
  <!-- Left segment: O-lang (purple) -->
  <rect x="0" y="0" width="${leftWidth}" height="20" fill="${olangColor}" rx="3" ry="3"/>
  <text x="${leftWidth / 2}" y="14"
        fill="#fff"
        font-family="Verdana, DejaVu Sans, sans-serif"
        font-size="11"
        font-weight="bold"
        text-anchor="middle">
    ${leftLabel}
  </text>

  <!-- Right segment: status info (green/red) -->
  <rect x="${leftWidth}" y="0" width="${rightWidth}" height="20" fill="${statusColor}" rx="3" ry="3"/>
  <text x="${leftWidth + rightWidth / 2}" y="14"
        fill="#fff"
        font-family="Verdana, DejaVu Sans, sans-serif"
        font-size="11"
        text-anchor="middle">
    ${rightMessage}
  </text>
</svg>
`.trim();

  // Ensure badges folder exists
  const badgesDir = path.join(outputDir, "badges");
  if (!fs.existsSync(badgesDir)) {
    fs.mkdirSync(badgesDir, { recursive: true });
  }

  // Write badge file
  const safeName = resolverName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const badgePath = path.join(badgesDir, `${safeName}-badge.svg`);

  fs.writeFileSync(badgePath, badgeSvg, "utf8");
  console.log(`🏷 Badge written to ${badgePath}`);

  return badgePath;
}

module.exports = {
  generateBadges: generateBadge, // alias for backward compat if needed
  generateBadge
};
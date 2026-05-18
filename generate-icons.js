// Run with: node generate-icons.js
// Requires: npm install canvas

const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

const sizes = [16, 32, 48, 128];

for (const size of sizes) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, "#3E92DE");
  g.addColorStop(1, "#E58A32");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${Math.round(size * 0.62)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Z", size / 2, size / 2 + size * 0.04);

  const buffer = canvas.toBuffer("image/png");
  const outPath = path.join(__dirname, "icons", `icon${size}.png`);
  fs.writeFileSync(outPath, buffer);
  console.log(`✓ icon${size}.png`);
}

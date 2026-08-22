import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const { movies } = JSON.parse(
  readFileSync(join(root, "data", "movies.json"), "utf-8")
);

const outDir = join(root, "public", "posters");
mkdirSync(outDir, { recursive: true });

function escapeXml(s) {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]
  );
}

function wrap(text, max = 14) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const w of words) {
    if ((current + " " + w).trim().length > max && current) {
      lines.push(current.trim());
      current = w;
    } else {
      current += " " + w;
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines;
}

function poster(m) {
  const [c1, c2] = m.colors;
  const lines = wrap(m.title.toUpperCase(), 13);
  const fontSize = lines.length >= 4 ? 44 : 52;
  const lineH = fontSize + 12;
  const blockH = lines.length * lineH;
  const startY = 900 * 0.52 - blockH / 2;

  const titleText = lines
    .map(
      (l, i) =>
        `<text x="300" y="${startY + i * lineH}" font-size="${fontSize}" text-anchor="middle" fill="#ffffff" font-family="Arial Black, Arial, sans-serif" font-weight="900" letter-spacing="1">${escapeXml(l)}</text>`
    )
    .join("\n");

  const rings = Array.from({ length: 3 }, (_, i) => {
    const r = 140 + i * 90;
    return `<circle cx="480" cy="160" r="${r}" fill="none" stroke="#ffffff" stroke-opacity="${(0.14 - i * 0.04).toFixed(2)}" stroke-width="1.5"/>`;
  }).join("\n");

  const dots = Array.from({ length: 24 }, (_, i) => {
    const x = 30 + (i % 12) * 48;
    const y = i < 12 ? 26 : 874;
    return `<circle cx="${x}" cy="${y}" r="5" fill="#000000" fill-opacity="0.45"/>`;
  }).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="78%" cy="16%" r="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="45%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.72"/>
    </linearGradient>
  </defs>
  <rect width="600" height="900" fill="url(#bg)"/>
  ${rings}
  <rect width="600" height="900" fill="url(#glow)"/>
  <g opacity="0.35">
    <polygon points="0,900 190,430 380,900" fill="#000000" opacity="0.35"/>
    <polygon points="150,900 340,330 600,760 600,900" fill="#000000" opacity="0.25"/>
    <polygon points="360,900 520,560 600,660 600,900" fill="#000000" opacity="0.4"/>
  </g>
  <rect width="600" height="900" fill="url(#shade)"/>
  <rect x="0" y="0" width="600" height="60" fill="#000000" fill-opacity="0.35"/>
  <rect x="0" y="840" width="600" height="60" fill="#000000" fill-opacity="0.35"/>
  ${dots}
  ${titleText}
  <line x1="230" y1="700" x2="370" y2="700" stroke="#ffffff" stroke-opacity="0.5" stroke-width="2"/>
  <text x="300" y="740" font-size="24" text-anchor="middle" fill="#ffffff" fill-opacity="0.85" font-family="Arial, sans-serif" letter-spacing="6">${m.year}</text>
  <text x="300" y="790" font-size="20" text-anchor="middle" fill="#ffffff" fill-opacity="0.65" font-family="Arial, sans-serif" letter-spacing="3">${escapeXml(m.genres.join(" • ").toUpperCase())}</text>
</svg>`;
}

for (const m of movies) {
  const file = join(outDir, `${m.id}.svg`);
  writeFileSync(file, poster(m), "utf-8");
  console.log(`OK ${m.id}.svg`);
}

console.log(`\nGenerated ${movies.length} posters -> public/posters/`);

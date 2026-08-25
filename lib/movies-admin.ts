import { readFile, writeFile, mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import type { Movie } from "./types";

const MOVIES_PATH = path.join(process.cwd(), "data", "movies.json");
const POSTERS_DIR = path.join(process.cwd(), "public", "posters");

const COLOR_PAIRS: Array<[string, string]> = [
  ["#c41230", "#7f1d1d"],
  ["#0ea5e9", "#1e3a8a"],
  ["#22c55e", "#14532d"],
  ["#f97316", "#7c2d12"],
  ["#8b5cf6", "#4c1d95"],
  ["#ec4899", "#831843"],
  ["#06b6d4", "#164e63"],
  ["#eab308", "#713f12"],
];

const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e",
  ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
  н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
  ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

export function slugifyTitle(title: string): string {
  const slug = [...title.toLowerCase()]
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "film";
}

export interface NewMovieInput {
  title: string;
  originalTitle?: string;
  description: string;
  year: number;
  genres: string[];
  duration: number;
  ageRating: number;
  director: string;
  cast: string[];
  country: string;
  videoUrl: string;
}

export async function getMoviesRaw(): Promise<Movie[]> {
  const raw = await readFile(MOVIES_PATH, "utf-8");
  return (JSON.parse(raw) as { movies: Movie[] }).movies;
}

export async function addMovie(input: NewMovieInput): Promise<Movie> {
  const movies = await getMoviesRaw();

  let id = slugifyTitle(input.title);
  let n = 2;
  while (movies.some((m) => m.id === id)) {
    id = `${slugifyTitle(input.title)}-${n++}`;
  }

  const movie: Movie = {
    id,
    title: input.title,
    originalTitle: input.originalTitle?.trim() || input.title,
    description: input.description,
    year: input.year,
    genres: input.genres,
    rating: 0,
    votes: 0,
    duration: input.duration,
    ageRating: input.ageRating,
    director: input.director,
    cast: input.cast,
    country: input.country,
    colors: COLOR_PAIRS[Math.floor(Math.random() * COLOR_PAIRS.length)],
    videoUrl: input.videoUrl,
    isNew: true,
  };

  await mkdir(POSTERS_DIR, { recursive: true });
  await writeFile(
    path.join(POSTERS_DIR, `${id}.svg`),
    buildPosterSvg(movie),
    "utf-8"
  );

  await writeFile(
    MOVIES_PATH,
    JSON.stringify({ movies: [...movies, movie] }, null, 2),
    "utf-8"
  );
  return movie;
}

export async function removeMovie(id: string): Promise<boolean> {
  const movies = await getMoviesRaw();
  const target = movies.find((m) => m.id === id);
  if (!target) return false;

  await writeFile(
    MOVIES_PATH,
    JSON.stringify({ movies: movies.filter((m) => m.id !== id) }, null, 2),
    "utf-8"
  );
  try {
    await unlink(path.join(POSTERS_DIR, `${id}.svg`));
  } catch {
    /* постера могло не быть */
  }
  if (target.videoUrl.startsWith("/uploads/videos/")) {
    try {
      const rel = path
        .normalize(target.videoUrl)
        .replace(/^([/\\]public)?[/\\]+/, "");
      await unlink(path.join(process.cwd(), "public", rel));
    } catch {
      /* файла могло не быть */
    }
  }
  return true;
}

export function buildPosterSvg(m: {
  title: string;
  year: number;
  genres: string[];
  colors: [string, string];
}): string {
  function escapeXml(s: string): string {
    return s.replace(/[<>&'"]/g, (c) =>
      ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[
        c
      ] as string
    );
  }

  function wrap(text: string, max = 14): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
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

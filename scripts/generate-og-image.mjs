import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { deflateSync } from "node:zlib";

const WIDTH = 1200;
const HEIGHT = 630;
const pixels = Buffer.alloc(WIDTH * HEIGHT * 4);
const colors = {
  navy: [9, 17, 25],
  deep: [12, 26, 36],
  cyan: [98, 215, 219],
  pale: [232, 240, 244],
  muted: [147, 166, 178],
  amber: [242, 182, 109],
  grid: [27, 62, 75]
};

const FONT = {
  A: "01110,10001,10001,11111,10001,10001,10001", B: "11110,10001,10001,11110,10001,10001,11110",
  C: "01111,10000,10000,10000,10000,10000,01111", D: "11110,10001,10001,10001,10001,10001,11110",
  E: "11111,10000,10000,11110,10000,10000,11111", F: "11111,10000,10000,11110,10000,10000,10000",
  G: "01111,10000,10000,10111,10001,10001,01111", H: "10001,10001,10001,11111,10001,10001,10001",
  I: "11111,00100,00100,00100,00100,00100,11111", J: "00111,00010,00010,00010,10010,10010,01100",
  K: "10001,10010,10100,11000,10100,10010,10001", L: "10000,10000,10000,10000,10000,10000,11111",
  M: "10001,11011,10101,10101,10001,10001,10001", N: "10001,11001,10101,10011,10001,10001,10001",
  O: "01110,10001,10001,10001,10001,10001,01110", P: "11110,10001,10001,11110,10000,10000,10000",
  Q: "01110,10001,10001,10001,10101,10010,01101", R: "11110,10001,10001,11110,10100,10010,10001",
  S: "01111,10000,10000,01110,00001,00001,11110", T: "11111,00100,00100,00100,00100,00100,00100",
  U: "10001,10001,10001,10001,10001,10001,01110", V: "10001,10001,10001,10001,10001,01010,00100",
  W: "10001,10001,10001,10101,10101,10101,01010", X: "10001,10001,01010,00100,01010,10001,10001",
  Y: "10001,10001,01010,00100,00100,00100,00100", Z: "11111,00001,00010,00100,01000,10000,11111",
  "0": "01110,10001,10011,10101,11001,10001,01110", "1": "00100,01100,00100,00100,00100,00100,01110",
  "2": "01110,10001,00001,00010,00100,01000,11111", "3": "11110,00001,00001,01110,00001,00001,11110",
  ".": "00000,00000,00000,00000,00000,00110,00110", "/": "00001,00010,00010,00100,01000,01000,10000",
  ":": "00000,00110,00110,00000,00110,00110,00000", "-": "00000,00000,00000,11111,00000,00000,00000"
};
for (const letter of Object.keys(FONT)) FONT[letter] = FONT[letter].split(",");

function blendPixel(x, y, color, alpha = 1) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return;
  const offset = (y * WIDTH + x) * 4;
  const inverse = 1 - alpha;
  pixels[offset] = Math.round(pixels[offset] * inverse + color[0] * alpha);
  pixels[offset + 1] = Math.round(pixels[offset + 1] * inverse + color[1] * alpha);
  pixels[offset + 2] = Math.round(pixels[offset + 2] * inverse + color[2] * alpha);
  pixels[offset + 3] = 255;
}

function rect(x, y, width, height, color, alpha = 1) {
  const left = Math.max(0, Math.floor(x));
  const right = Math.min(WIDTH, Math.ceil(x + width));
  const top = Math.max(0, Math.floor(y));
  const bottom = Math.min(HEIGHT, Math.ceil(y + height));
  for (let py = top; py < bottom; py += 1) {
    for (let px = left; px < right; px += 1) blendPixel(px, py, color, alpha);
  }
}

function line(x1, y1, x2, y2, color, thickness = 1, alpha = 1) {
  const steps = Math.ceil(Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)));
  for (let index = 0; index <= steps; index += 1) {
    const ratio = steps ? index / steps : 0;
    rect(x1 + (x2 - x1) * ratio - thickness / 2, y1 + (y2 - y1) * ratio - thickness / 2, thickness, thickness, color, alpha);
  }
}

function circle(cx, cy, radius, color, thickness = 1, alpha = 1, filled = false) {
  const inner = Math.max(0, radius - thickness);
  const outerSquared = radius * radius;
  const innerSquared = inner * inner;
  for (let y = Math.floor(cy - radius); y <= cy + radius; y += 1) {
    for (let x = Math.floor(cx - radius); x <= cx + radius; x += 1) {
      const distance = (x - cx) ** 2 + (y - cy) ** 2;
      if (distance <= outerSquared && (filled || distance >= innerSquared)) blendPixel(x, y, color, alpha);
    }
  }
}

function polygon(points, color, alpha = 1) {
  const minX = Math.max(0, Math.floor(Math.min(...points.map(([x]) => x))));
  const maxX = Math.min(WIDTH - 1, Math.ceil(Math.max(...points.map(([x]) => x))));
  const minY = Math.max(0, Math.floor(Math.min(...points.map(([, y]) => y))));
  const maxY = Math.min(HEIGHT - 1, Math.ceil(Math.max(...points.map(([, y]) => y))));
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      let inside = false;
      for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
        const [xi, yi] = points[i];
        const [xj, yj] = points[j];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
      }
      if (inside) blendPixel(x, y, color, alpha);
    }
  }
}

function text(value, x, y, scale, color, alpha = 1) {
  let cursor = x;
  for (const character of value.toUpperCase()) {
    if (character === " ") {
      cursor += scale * 4;
      continue;
    }
    const glyph = FONT[character];
    if (!glyph) continue;
    glyph.forEach((row, rowIndex) => {
      [...row].forEach((pixel, columnIndex) => {
        if (pixel === "1") rect(cursor + columnIndex * scale, y + rowIndex * scale, scale - 1, scale - 1, color, alpha);
      });
    });
    cursor += scale * 6;
  }
}

for (let y = 0; y < HEIGHT; y += 1) {
  for (let x = 0; x < WIDTH; x += 1) {
    const horizontal = x / WIDTH;
    const verticalGlow = Math.max(0, 1 - Math.hypot((x - 930) / 400, (y - 300) / 350));
    const color = colors.navy.map((base, index) => Math.round(base * (1 - horizontal) + colors.deep[index] * horizontal + colors.cyan[index] * verticalGlow * 0.045));
    blendPixel(x, y, color);
  }
}
for (let x = 24; x < WIDTH; x += 40) line(x, 0, x, HEIGHT, colors.grid, 1, 0.28);
for (let y = 24; y < HEIGHT; y += 40) line(0, y, WIDTH, y, colors.grid, 1, 0.24);

text("T", 73, 62, 7, colors.navy);
rect(64, 54, 53, 53, colors.cyan, 0.95);
text("T", 78, 64, 6, colors.navy);
text("TURBINE LAB", 138, 64, 5, colors.pale);
text("A LIVE RANKINE CYCLE EXPLORER", 72, 152, 2, colors.cyan);
text("STEAM TO", 68, 215, 9, colors.pale);
text("ELECTRICITY.", 68, 306, 9, colors.cyan);
text("ADJUST THE CONDITIONS. FOLLOW THE ENERGY.", 74, 395, 2, colors.muted);

rect(72, 438, 386, 38, [20, 54, 63], 0.96);
text("PRESSURE / HEAT / WORK / POWER", 85, 450, 2, colors.cyan);

const cx = 925;
const cy = 294;
circle(cx, cy, 190, colors.muted, 1, 0.28);
circle(cx, cy, 162, colors.cyan, 2, 0.58);
circle(cx, cy, 132, colors.muted, 1, 0.34);
circle(cx, cy, 117, colors.cyan, 2, 0.25);
for (let index = 0; index < 12; index += 1) {
  const angle = index * Math.PI / 6 - 0.23;
  const rotate = (radius, lateral) => [
    cx + radius * Math.cos(angle) - lateral * Math.sin(angle),
    cy + radius * Math.sin(angle) + lateral * Math.cos(angle)
  ];
  polygon([rotate(25, -9), rotate(122, -18), rotate(139, 2), rotate(48, 14)], index % 3 === 0 ? colors.cyan : colors.muted, index % 3 === 0 ? 0.93 : 0.57);
}
circle(cx, cy, 33, colors.deep, 1, 1, true);
circle(cx, cy, 28, colors.cyan, 4, 0.95);
circle(cx, cy, 9, colors.cyan, 1, 1, true);
for (const [x, y, radius, color] of [
  [777, 273, 5, colors.amber], [801, 248, 3, colors.cyan], [1069, 285, 5, colors.amber],
  [1046, 319, 3, colors.cyan], [845, 185, 3, colors.amber], [1002, 390, 4, colors.cyan]
]) circle(x, y, radius, color, 1, 0.9, true);
line(72, 520, 1128, 520, colors.cyan, 1, 0.35);
text("LIVE MODEL", 74, 548, 2, colors.cyan);
text("ENERGY ACCOUNTING", 290, 548, 2, colors.amber);
text("CLASSROOM EXPLORATION", 588, 548, 2, colors.muted);
text("TURBINELAB.AADITYAHASABNIS.COM", 74, 590, 2, colors.muted);

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type, "ascii");
  const payload = Buffer.concat([name, data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(payload));
  return Buffer.concat([length, payload, checksum]);
}

const rows = Buffer.alloc((WIDTH * 4 + 1) * HEIGHT);
for (let y = 0; y < HEIGHT; y += 1) {
  const rowOffset = y * (WIDTH * 4 + 1);
  rows[rowOffset] = 0;
  pixels.copy(rows, rowOffset + 1, y * WIDTH * 4, (y + 1) * WIDTH * 4);
}
const header = Buffer.alloc(13);
header.writeUInt32BE(WIDTH, 0);
header.writeUInt32BE(HEIGHT, 4);
header[8] = 8;
header[9] = 6;
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk("IHDR", header),
  chunk("IDAT", deflateSync(rows, { level: 9 })),
  chunk("IEND", Buffer.alloc(0))
]);
const outputPath = resolve("assets", "turbine-lab-og.png");
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, png);
console.log(`Generated ${outputPath} (${WIDTH} x ${HEIGHT} PNG, ${png.length} bytes)`);

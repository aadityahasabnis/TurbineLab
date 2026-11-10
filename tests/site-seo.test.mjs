import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const origin = "https://turbinelab.aadityahasabnis.com";
const pages = [
  { file: "index.html", canonical: `${origin}/` },
  { file: "docs/index.html", canonical: `${origin}/docs/` },
  { file: "docs/quick-facts.html", canonical: `${origin}/docs/quick-facts.html` }
];

function read(relativePath) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

function getMetaContent(html, key, attribute = "name") {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tag = html.match(new RegExp(`<meta\\s+[^>]*\\b${attribute}=["']${escapedKey}["'][^>]*>`));
  assert.ok(tag, `Missing ${attribute}="${key}" metadata`);
  const content = tag[0].match(/\bcontent=["']([^"']*)["']/);
  assert.ok(content, `Missing content on ${attribute}="${key}"`);
  return content[1];
}

test("public pages have unique titles and page-specific canonical metadata", () => {
  const titles = new Set();
  for (const page of pages) {
    const html = read(page.file);
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    assert.ok(title, `${page.file} must have a title`);
    assert.ok(!titles.has(title), `Duplicate page title: ${title}`);
    titles.add(title);

    const description = getMetaContent(html, "description");
    assert.ok(description.length >= 70 && description.length <= 160, `${page.file} description should be 70–160 characters`);
    assert.match(html, new RegExp(`<link\\s+rel=["']canonical["']\\s+href=["']${page.canonical.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`));
    assert.equal(getMetaContent(html, "og:url", "property"), page.canonical);
    assert.equal(getMetaContent(html, "og:image", "property"), `${origin}/assets/turbine-lab-og.png`);
    assert.equal(getMetaContent(html, "twitter:image"), `${origin}/assets/turbine-lab-og.png`);
    assert.ok(getMetaContent(html, "og:image:alt", "property"));
    assert.ok(getMetaContent(html, "twitter:image:alt"));
  }
});

test("every public page links to the creator's website and About page", () => {
  for (const page of pages) {
    const html = read(page.file);
    assert.match(html, /aria-label="About the creator"/, `${page.file} must identify the creator links`);
    assert.match(html, /href="https:\/\/aadityahasabnis\.com\/"[^>]*>Aaditya Hasabnis<\/a>/, `${page.file} must link to the creator's homepage`);
    assert.match(html, /href="https:\/\/aadityahasabnis\.com\/about"[^>]*>About me ↗<\/a>/, `${page.file} must link to the creator's About page`);
    assert.equal((html.match(/target="_blank" rel="noopener noreferrer"/g) ?? []).length >= 2, true, `${page.file} external creator links should use safe new tabs`);
  }
});

test("home page structured data describes the simulator", () => {
  const html = read("index.html");
  const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(jsonLd, "Home page must include JSON-LD");
  const application = JSON.parse(jsonLd[1]);
  assert.equal(application["@type"], "SoftwareApplication");
  assert.equal(application.name, "Turbine Lab");
  assert.equal(application.url, `${origin}/`);
});

test("sitemap lists every canonical public page and robots points to it", () => {
  const sitemap = read("sitemap.xml");
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.deepEqual(new Set(sitemapUrls), new Set(pages.map((page) => page.canonical)));
  assert.match(read("robots.txt"), new RegExp(`Sitemap:\\s+${origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/sitemap\\.xml`));
});

test("social preview is a valid 1200 by 630 PNG", () => {
  const image = readFileSync(resolve(root, "assets/turbine-lab-og.png"));
  assert.equal(image.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(image.readUInt32BE(16), 1200);
  assert.equal(image.readUInt32BE(20), 630);
});

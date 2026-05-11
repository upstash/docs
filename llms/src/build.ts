import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { walkNavigation, type WalkItem } from "./generator.ts";
import { expandOpenApi, type OpenApiEntry } from "./openapi.ts";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DOCS_ROOT = join(SCRIPT_DIR, "..", "..");
const SITE_URL = "https://upstash.com/docs";

const LLMS_TXT = join(DOCS_ROOT, "llms.txt");
const LLMS_FULL_TXT = join(DOCS_ROOT, "llms-full.txt");

// Directories under docs/ that aren't published as pages — skipped by the
// orphan-MDX scan.
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".github",
  ".claude",
  ".skill-studio",
  "_snippets",
  "llms",
  "logo",
]);

interface DocsEntry {
  title: string;
  /** Site-relative path without the `.md` suffix, used as the sort key. */
  path: string;
  /** Full URL under the docs site, e.g. `https://upstash.com/docs/foo/bar.md`. */
  url: string;
  description?: string;
}

const docsEntries: DocsEntry[] = [];
const openApiSpecs: { url: string }[] = [];
const llmsFullParts: string[] = ["# Upstash Documentation", ""];

// README.mdx at the docs root isn't part of docs.json's navigation but is
// included in upstream's llms.txt.
addMdxEntry("README");

// Track the depth of the most recent group yield so we can decide whether
// a following openapi item belongs in the "OpenAPI Specs" footer. Upstream's
// llms.txt only footers a spec whose containing group is at depth 2 — i.e.
// a subcategory directly under a top-level tab group, not nested deeper.
let currentGroupDepth = 0;

for (const item of walkNavigation({ docsRoot: DOCS_ROOT })) {
  handle(item);
}

// Mintlify's upstream llms.txt also surfaces .mdx files that exist on disk
// but aren't referenced from docs.json (orphan pages still served by URL).
// Walk the docs root and add any we haven't seen yet.
addOrphanMdxFiles();

writeLlmsTxt();
writeLlmsFullTxt();

console.log(`Wrote ${LLMS_TXT}`);
console.log(`Wrote ${LLMS_FULL_TXT}`);

function handle(item: WalkItem): void {
  if (item.type === "group") {
    currentGroupDepth = item.depth;
    // Headings are only used in llms-full.txt — llms.txt is one flat list.
    const hashes = "#".repeat(Math.min(item.depth + 2, 6));
    pushHeading(llmsFullParts, `${hashes} ${item.group}`);
    return;
  }

  if (item.type === "openapi") {
    for (const op of expandOpenApi(DOCS_ROOT, item.source, item.directory)) {
      pushOpenApiEntry(op);
    }
    if (item.directory && currentGroupDepth === 2) {
      openApiSpecs.push({ url: `${SITE_URL}/${item.source}` });
    }
    return;
  }

  // type === "page"
  const url = `${SITE_URL}/${item.path}.md`;
  docsEntries.push({
    title: item.metadata.title,
    path: item.path,
    url,
    description: flatten(item.metadata.description),
  });
  pushFullBody(item.metadata.title, url, item.content);
}

function pushOpenApiEntry(op: OpenApiEntry): void {
  const url = `${SITE_URL}/${op.path}.md`;
  docsEntries.push({
    title: op.title,
    path: op.path,
    url,
    description: flatten(op.description),
  });
  pushFullBody(op.title, url, op.description ?? "");
}

function addOrphanMdxFiles(): void {
  const seen = new Set(docsEntries.map((e) => e.path));
  walkMdx(DOCS_ROOT);

  function walkMdx(dir: string): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const abs = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        walkMdx(abs);
        continue;
      }
      if (!entry.name.endsWith(".mdx")) continue;
      const rel = relative(DOCS_ROOT, abs).replace(/\.mdx$/, "");
      if (seen.has(rel)) continue;
      seen.add(rel);
      addMdxEntry(rel);
    }
  }
}

function addMdxEntry(path: string): void {
  const filePath = join(DOCS_ROOT, `${path}.mdx`);
  if (!existsSync(filePath)) return;
  const raw = readFileSync(filePath, "utf-8");
  const { metadata, body } = parseFrontmatter(raw);
  const title = metadata.title || titleFromBasename(path);
  const url = `${SITE_URL}/${path}.md`;
  docsEntries.push({
    title,
    path,
    url,
    description: flatten(metadata.description),
  });
  pushFullBody(title, url, body);
}

function writeLlmsTxt(): void {
  // Sort by site-relative path (no `.md`) so e.g. `get-qstash` precedes
  // `get-qstash-stats` — including `.md` would invert that pair because
  // `-` (0x2D) sorts before `.` (0x2E) in ASCII.
  docsEntries.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  const lines: string[] = ["# Upstash Documentation", "", "## Docs", ""];
  for (const e of docsEntries) {
    lines.push(formatBullet(e));
  }
  if (openApiSpecs.length > 0) {
    lines.push("", "## OpenAPI Specs", "");
    for (const s of openApiSpecs) {
      lines.push(`- [openapi](${s.url})`);
    }
  }
  writeFileSync(LLMS_TXT, lines.join("\n") + "\n");
}

function writeLlmsFullTxt(): void {
  writeFileSync(LLMS_FULL_TXT, llmsFullParts.join("\n").replace(/\n+$/, "\n"));
}

function formatBullet(e: DocsEntry): string {
  return e.description
    ? `- [${e.title}](${e.url}): ${e.description}`
    : `- [${e.title}](${e.url})`;
}

function pushHeading(out: string[], heading: string): void {
  if (out.length > 0 && out[out.length - 1] !== "") out.push("");
  out.push(heading, "");
}

/**
 * Title fallback for MDX files without a `title` frontmatter — matches
 * Mintlify's heuristic: take the basename, swap `-` for spaces, and
 * capitalize the first character only.
 */
function titleFromBasename(path: string): string {
  const base = path.split("/").pop() ?? path;
  const spaced = base.replace(/-/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function pushFullBody(title: string, url: string, body: string): void {
  llmsFullParts.push(`### ${title}`, "");
  llmsFullParts.push(`Source: ${url}`, "");
  llmsFullParts.push(body.trim(), "", "---", "");
}

/**
 * Mintlify's upstream llms.txt uses only the first paragraph of a description
 * (text up to the first blank line), with single newlines folded to single
 * spaces. Intra-paragraph multi-space runs are preserved verbatim.
 */
function flatten(s: string | undefined): string | undefined {
  if (!s) return undefined;
  const firstPara = s.split(/\r?\n\s*\r?\n/)[0];
  const out = firstPara.replace(/\r?\n/g, " ").trim();
  return out || undefined;
}

function parseFrontmatter(raw: string): {
  metadata: Record<string, string>;
  body: string;
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { metadata: {}, body: raw };
  const metadata: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    metadata[m[1]] = value;
  }
  return { metadata, body: match[2] };
}

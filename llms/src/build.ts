import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { walkNavigation, type WalkItem } from "./generator.ts";
import { expandOpenApi } from "./openapi.ts";

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

/**
 * Pages excluded from llms-full.txt because they're individually short but
 * collectively huge (~19K lines for ~390 pages) and not useful as a
 * pre-bundled context. They stay listed in llms.txt — an AI can fetch any
 * specific command page on demand via its link.
 */
const FULL_TXT_SKIP = [/^[^/]+\/sdks\/[a-z][a-z0-9-]*\/commands\//];

interface Entry {
  title: string;
  /** Site-relative path without leading slash, e.g. `agent-resources/cli`. */
  path: string;
  /** First-paragraph description used in llms.txt bullets. */
  shortDescription?: string;
  /**
   * The page body as it appears in llms-full.txt. For MDX pages this is the
   * frontmatter-stripped file body. For OpenAPI operations it's a synthesized
   * block: `<spec-source> <method> <api-path>\n<description>`.
   */
  fullBody: string;
  /**
   * Determines the blank-line spacing used in llms-full.txt: MDX pages get
   * three blank lines between Source and body, OpenAPI ops get one.
   */
  kind: "mdx" | "openapi";
}

const entries: Entry[] = [];
const openApiSpecs: { url: string }[] = [];

addMdxEntry("README");

let currentGroupDepth = 0;

for (const item of walkNavigation({ docsRoot: DOCS_ROOT })) {
  handle(item);
}

addOrphanMdxFiles();
entries.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));

writeLlmsTxt();
writeLlmsFullTxt();

console.log(`Wrote ${LLMS_TXT}`);
console.log(`Wrote ${LLMS_FULL_TXT}`);

function handle(item: WalkItem): void {
  if (item.type === "group") {
    currentGroupDepth = item.depth;
    return;
  }

  if (item.type === "openapi") {
    for (const op of expandOpenApi(DOCS_ROOT, item.source, item.directory)) {
      entries.push({
        title: op.title,
        path: op.path,
        shortDescription: firstParagraph(op.description),
        fullBody: openApiBody(item.source, op.method, op.apiPath, op.description),
        kind: "openapi",
      });
    }
    if (item.directory && currentGroupDepth === 2) {
      openApiSpecs.push({ url: `${SITE_URL}/${item.source}` });
    }
    return;
  }

  // type === "page"
  entries.push({
    title: item.metadata.title,
    path: item.path,
    shortDescription: firstParagraph(item.metadata.description),
    fullBody: item.content,
    kind: "mdx",
  });
}

function addMdxEntry(path: string): void {
  const filePath = join(DOCS_ROOT, `${path}.mdx`);
  if (!existsSync(filePath)) return;
  const raw = readFileSync(filePath, "utf-8");
  const { metadata, body } = parseFrontmatter(raw);
  entries.push({
    title: metadata.title || titleFromBasename(path),
    path,
    shortDescription: firstParagraph(metadata.description),
    fullBody: body,
    kind: "mdx",
  });
}

function addOrphanMdxFiles(): void {
  const seen = new Set(entries.map((e) => e.path));
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

function writeLlmsTxt(): void {
  const lines: string[] = ["# Upstash Documentation", "", "## Docs", ""];
  for (const e of entries) {
    const url = `${SITE_URL}/${e.path}.md`;
    lines.push(
      e.shortDescription
        ? `- [${e.title}](${url}): ${e.shortDescription}`
        : `- [${e.title}](${url})`,
    );
  }
  if (openApiSpecs.length > 0) {
    lines.push("", "## OpenAPI Specs", "");
    for (const s of openApiSpecs) {
      lines.push(`- [openapi](${s.url})`);
    }
  }
  writeFileSync(LLMS_TXT, lines.join("\n") + "\n");
}

function isExcludedFromFullTxt(path: string): boolean {
  return FULL_TXT_SKIP.some((re) => re.test(path));
}

function writeLlmsFullTxt(): void {
  // Two block kinds, mixed in alphabetical-by-path order:
  //
  //   Full page block (for normal pages):
  //     # <title>
  //     Source: <url>
  //
  //     <body>
  //
  //   Reference bullet (for paths in FULL_TXT_SKIP):
  //     - [<title>](<url>.md): <description>
  //
  // Bullets land at their natural sort position so consecutive ones form a
  // clean list. `collapseBlankRuns` squashes any 2+ blank-line runs the body
  // contributes; pages always carry leading/trailing blanks so they stay
  // visually separated from neighbours.
  const chunks: string[] = [];
  for (const e of entries) {
    if (isExcludedFromFullTxt(e.path)) {
      const url = `${SITE_URL}/${e.path}.md`;
      const desc = e.shortDescription ? `: ${e.shortDescription}` : "";
      chunks.push(`- [${e.title}](${url})${desc}\n`);
      continue;
    }
    const url = `${SITE_URL}/${e.path}`;
    const body =
      e.kind === "mdx"
        ? normalizeMdxBody(e.fullBody)
        : e.fullBody.replace(/^\n+/, "").replace(/\n+$/, "");
    chunks.push(`\n# ${e.title}\nSource: ${url}\n\n${body}\n\n`);
  }
  writeFileSync(LLMS_FULL_TXT, collapseBlankRuns(chunks.join("")).replace(/^\n+/, ""));
}

/** Collapse any run of 2+ blank lines down to a single blank line. */
function collapseBlankRuns(s: string): string {
  return s.replace(/\n{3,}/g, "\n\n");
}

/**
 * Normalize an MDX body for inclusion in llms-full.txt. Trims size and
 * presentational noise without losing prose:
 *   - drop leading/trailing blank lines
 *   - strip trailing whitespace on every line
 *   - rewrite `- ` bullets to `* ` and `---` HR to `***`
 *     (consistent with markdown serializer output)
 *   - rewrite internal links `/foo` → `/docs/foo` and unescape `\&` in URLs
 *   - drop `<Frame>` / `<Frame caption="…">` / `</Frame>` wrapper lines —
 *     purely visual scaffolding around images
 *   - drop image `src` URLs: `![alt](src)` → `![alt]()` and
 *     `<img alt="…" src="…long…" />` → `<img alt="…" />`
 *   - strip pre-existing `theme={"system"}` from code-fence info strings,
 *     since it's Mintlify-specific theming with no value to an LLM
 */
function normalizeMdxBody(body: string): string {
  const lines = body.replace(/^\n+/, "").replace(/\n+$/, "").split(/\r?\n/);
  let inFence = false;
  const out: string[] = [];
  for (const raw of lines) {
    const fenceMatch = /^(\s*```)(.*)$/.exec(raw);
    if (fenceMatch) {
      const trimmed = raw.replace(/[ \t]+$/, "");
      if (!inFence) {
        inFence = true;
        out.push(trimmed.replace(/\s*theme=\{"system"\}\s*$/, ""));
        continue;
      }
      inFence = false;
      out.push(trimmed);
      continue;
    }
    if (inFence) {
      out.push(raw.replace(/[ \t]+$/, ""));
      continue;
    }
    // Drop bare <Frame> wrappers (with or without caption attrs) so images
    // inside them stand alone. Match leading-whitespace forms too.
    if (/^\s*<Frame(\s[^>]*)?>\s*$/.test(raw)) continue;
    if (/^\s*<\/Frame>\s*$/.test(raw)) continue;

    let l = raw.replace(/[ \t]+$/, "");
    l = l.replace(/^(\s*)-(\s+)/, "$1*$2");
    if (/^---\s*$/.test(l)) l = "***";
    l = rewriteInternalLinks(l);
    l = stripImageSources(l);
    // Strip inline `<Frame …>…</Frame>` wrappers (one-line form).
    l = l.replace(/<Frame(\s[^>]*)?>/g, "").replace(/<\/Frame>/g, "");
    // If stripping leaves the line empty, drop it instead of emitting blank.
    if (l.trim() === "" && raw.trim() !== "") continue;
    out.push(l);
  }
  return out.join("\n");
}

/**
 * Strip image source URLs to shrink the bundle — AI consumers don't follow
 * image links, and badge / asset URLs run into the hundreds of bytes.
 *
 *   `![alt](https://…)` → `![alt]()`
 *   `<img src="https://…" alt="…" />` → `<img alt="…" />`
 */
function stripImageSources(line: string): string {
  let l = line.replace(/(!\[[^\]]*\])\([^)]*\)/g, "$1()");
  l = l.replace(/(<img\b[^>]*?)\s+src="[^"]*"/g, "$1");
  l = l.replace(/(<img\b[^>]*?)\s+src='[^']*'/g, "$1");
  return l;
}

/**
 * Mintlify mounts the docs site under `/docs/`, so internal links like
 * `[X](/agent-resources/cli)` are rewritten to `[X](/docs/agent-resources/cli)`
 * in the published markdown. Also unescape `\&` in link URLs (MDX often
 * writes `\&` to avoid HTML-entity ambiguity, but the upstream txt is
 * plain).
 */
function rewriteInternalLinks(line: string): string {
  return line.replace(/\]\(([^)]*)\)/g, (_match, url: string) => {
    let u = url.replace(/\\&/g, "&");
    if (u.startsWith("/") && !u.startsWith("/docs/") && u !== "/docs") {
      u = `/docs${u}`;
    }
    return `](${u})`;
  });
}

function openApiBody(
  source: string,
  method: string,
  apiPath: string,
  description: string | undefined,
): string {
  const header = `/${source} ${method} ${apiPath}`;
  return description ? `${header}\n${description}` : header;
}

/**
 * Mintlify's upstream llms.txt uses only the first paragraph of a description
 * (text up to the first blank line), with single newlines folded to single
 * spaces. Intra-paragraph multi-space runs are preserved verbatim.
 */
function firstParagraph(s: string | undefined): string | undefined {
  if (!s) return undefined;
  const firstPara = s.split(/\r?\n\s*\r?\n/)[0];
  const out = firstPara.replace(/\r?\n/g, " ").trim();
  return out || undefined;
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

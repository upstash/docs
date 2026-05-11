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

function writeLlmsFullTxt(): void {
  // Upstream's per-page block, with visible-blank counts noted:
  //
  //   MDX page:
  //     # <title>
  //     Source: <url>          ← then 3 blank lines
  //     <body>                 ← then 2 blank lines before next page
  //
  //   OpenAPI op:
  //     # <title>
  //     Source: <url>          ← then 1 blank line
  //     <body>                 ← then 2 blank lines before next page
  const chunks: string[] = [];
  for (const e of entries) {
    const url = `${SITE_URL}/${e.path}`;
    const body =
      e.kind === "mdx"
        ? normalizeMdxBody(e.fullBody)
        : e.fullBody.replace(/^\n+/, "").replace(/\n+$/, "");
    const blanksAfterSource = e.kind === "mdx" ? "\n\n\n\n" : "\n\n";
    chunks.push(`# ${e.title}\nSource: ${url}${blanksAfterSource}${body}\n\n\n`);
  }
  writeFileSync(LLMS_FULL_TXT, chunks.join(""));
}

/**
 * Normalize an MDX body the way Mintlify's llms-full.txt pipeline does:
 *   - strip leading/trailing blank lines
 *   - rewrite dash-style bullets (`- `, `  - `) to asterisk-style (`* `, `  * `)
 *   - rewrite plain `---` horizontal-rule lines to `***`
 *   - strip trailing whitespace from every line
 *
 * This isn't a full markdown serializer — fence-attribute injection
 * (`bash` -> `bash theme={"system"}`) and JSX re-indentation are still
 * missing — but it covers the highest-frequency content diffs.
 */
function normalizeMdxBody(body: string): string {
  const lines = body.replace(/^\n+/, "").replace(/\n+$/, "").split(/\r?\n/);
  let inFence = false;
  const out = lines.map((line) => {
    const fenceMatch = /^(\s*```)(.*)$/.exec(line);
    if (fenceMatch) {
      const trimmed = line.replace(/[ \t]+$/, "");
      if (!inFence) {
        inFence = true;
        // Mintlify appends ` theme={"system"}` to every opening fence whose
        // info string isn't empty (i.e. any fence that declares a language
        // or attributes), unless one is already present.
        const info = fenceMatch[2].trim();
        if (info.length > 0 && !/theme=\{"system"\}/.test(info)) {
          return `${trimmed} theme={"system"}`;
        }
        return trimmed;
      }
      inFence = false;
      return trimmed;
    }
    if (inFence) return line.replace(/[ \t]+$/, "");
    let l = line.replace(/[ \t]+$/, "");
    l = l.replace(/^(\s*)-(\s+)/, "$1*$2");
    if (/^---\s*$/.test(l)) l = "***";
    l = rewriteInternalLinks(l);
    return l;
  });
  return out.join("\n");
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

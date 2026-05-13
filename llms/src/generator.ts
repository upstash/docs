import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// docs.json navigation types (subset — only what we use).
// See https://www.mintlify.com/docs/organize/navigation for the full schema.

// An OpenAPI reference may be either a bare spec path or an object that
// also specifies the rendered directory. Both forms appear in docs.json.
type OpenApiRef = string | { source: string; directory: string };

// A page entry is either a path string or a nested group.
type PageEntry = string | GroupEntry;

// A group has a name and either explicit pages OR an OpenAPI reference,
// never both — the two forms are mutually exclusive.
type GroupEntry = { group: string } & (
  | { pages: PageEntry[]; openapi?: never }
  | { openapi: OpenApiRef; pages?: never }
);

// A tab can organize content with `groups` or flat `pages` (never both).
// Independently, a tab may carry a top-level `openapi` ref pointing at a
// spec file — this is how Mintlify wires operation-ID page entries
// (e.g. "GET /redis/databases") inside the tab's groups back to a spec.
type TabEntry = { tab: string; openapi?: OpenApiRef } & (
  | { groups: GroupEntry[]; pages?: never }
  | { pages: PageEntry[]; groups?: never }
);

interface DocsJson {
  navigation: {
    tabs: TabEntry[];
  };
}

export interface PageMetadata {
  title: string;
  description?: string;
}

export type WalkItem =
  | { type: "group"; group: string; depth: number }
  // `directory` is only present when the OpenAPI ref was given in object form.
  // Bare-string refs (`"openapi": "spec.yml"`) yield with source only.
  | { type: "openapi"; source: string; directory?: string }
  | {
      type: "page";
      path: string;
      metadata: PageMetadata;
      content: string;
    };

export interface WalkOptions {
  /** Repo root that contains docs.json and the .mdx files. */
  docsRoot: string;
  /** Optional filter: return false to skip a tab entirely. */
  includeTab?: (tabName: string) => boolean;
}

/**
 * Walks the navigation tree in docs.json.
 *
 * Emits a "group" item every time we enter a new named section
 * (tab, group, or nested group). depth starts at 0 for tabs and
 * increases with each level of nesting.
 *
 * Emits a "page" item for each leaf page, with the parsed frontmatter
 * and the raw file body (frontmatter stripped).
 */
export function* walkNavigation(opts: WalkOptions): Generator<WalkItem> {
  const docsJsonPath = join(opts.docsRoot, "docs.json");
  const docs: DocsJson = JSON.parse(readFileSync(docsJsonPath, "utf-8"));

  for (const tab of docs.navigation.tabs) {
    if (opts.includeTab && !opts.includeTab(tab.tab)) continue;

    yield { type: "group", group: tab.tab, depth: 0 };

    // A tab can also carry a top-level OpenAPI spec (e.g. Developer API).
    // Yield it before iterating groups/pages so callers see the spec
    // associated with the tab.
    if (tab.openapi) {
      yield openApiItem(tab.openapi);
    }

    // A tab uses `groups` (most common) or `pages` directly — never both.
    if (tab.groups) {
      for (const group of tab.groups) {
        yield* walkGroup(group, 1, opts.docsRoot);
      }
    } else {
      for (const entry of tab.pages) {
        yield* walkEntry(entry, 1, opts.docsRoot);
      }
    }
  }
}

function* walkGroup(
  group: GroupEntry,
  depth: number,
  docsRoot: string,
): Generator<WalkItem> {
  yield { type: "group", group: group.group, depth };
  if (group.pages) {
    for (const entry of group.pages) {
      yield* walkEntry(entry, depth + 1, docsRoot);
    }
    return;
  }
  yield openApiItem(group.openapi);
}

function openApiItem(ref: OpenApiRef): WalkItem {
  return typeof ref === "string"
    ? { type: "openapi", source: ref }
    : { type: "openapi", source: ref.source, directory: ref.directory };
}

function* walkEntry(
  entry: PageEntry,
  depth: number,
  docsRoot: string,
): Generator<WalkItem> {
  if (typeof entry === "string") {
    const page = readPage(entry, docsRoot);
    if (page) yield page;
  } else {
    yield* walkGroup(entry, depth, docsRoot);
  }
}

function readPage(path: string, docsRoot: string): WalkItem | null {
  // Pages in docs.json omit the .mdx extension.
  // Some entries (e.g. "GET /redis/databases") reference operations inside
  // an OpenAPI spec rather than literal files. Skip those — the OpenAPI
  // tab itself is yielded as a group, which is enough for an initial llms.txt.
  const filePath = join(docsRoot, `${path}.mdx`);
  if (!existsSync(filePath)) {
    console.warn(`  skip (no .mdx): ${path}`);
    return null;
  }
  const raw = readFileSync(filePath, "utf-8");
  const { metadata, body } = parseFrontmatter(raw);

  return {
    type: "page",
    path,
    metadata: {
      title: metadata.title || deriveTitleFromPath(path),
      description: metadata.description,
    },
    content: body,
  };
}

function deriveTitleFromPath(path: string): string {
  const last = path.split("/").pop() ?? path;
  return last
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

/**
 * Minimal YAML-frontmatter parser. Handles the keys we care about
 * (title, description) with quoted or unquoted values. We deliberately
 * don't pull in a full YAML library — Mintlify frontmatter is simple.
 */
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

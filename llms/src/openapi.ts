import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

export interface OpenApiEntry {
  title: string;
  /** Path under the docs site, without leading slash and without `.md`. */
  path: string;
  description?: string;
}

interface OpenApiOperation {
  summary?: string;
  description?: string;
  tags?: string[];
  "x-mint"?: { href?: string };
}

interface OpenApiSpec {
  paths?: Record<string, Record<string, OpenApiOperation>>;
}

const HTTP_METHODS = new Set([
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
]);

/**
 * Loads an OpenAPI spec and returns one entry per operation, mirroring how
 * Mintlify renders pages from a spec:
 *
 *   - If the op has `x-mint.href`, use that path verbatim.
 *   - Else if a `directory` is supplied, the path is `<directory>/<tag>/<slug>`.
 *   - Else the path is `api-reference/<tag>/<slug>`.
 *
 * `slug` is the kebab-case of the operation's `summary`. `tag` is the first
 * tag, also kebab-cased.
 */
export function expandOpenApi(
  docsRoot: string,
  source: string,
  directory: string | undefined,
): OpenApiEntry[] {
  const raw = readFileSync(join(docsRoot, source), "utf-8");
  const spec = parseYaml(raw) as OpenApiSpec;
  if (!spec.paths) return [];

  const entries: OpenApiEntry[] = [];
  // Mintlify disambiguates colliding slugs by suffixing `-1`, `-2`, … to the
  // second-and-later occurrences within a single spec.
  const seenPaths = new Map<string, number>();

  for (const methods of Object.values(spec.paths)) {
    for (const [method, op] of Object.entries(methods)) {
      if (!HTTP_METHODS.has(method)) continue;
      if (!op.summary) continue;

      const href = op["x-mint"]?.href;
      let path: string;
      if (href) {
        path = href.replace(/^\//, "");
      } else {
        const tag = kebab(op.tags?.[0] ?? "default");
        const slug = kebab(op.summary);
        const base = directory ?? "api-reference";
        path = `${base}/${tag}/${slug}`;
      }

      const count = seenPaths.get(path) ?? 0;
      seenPaths.set(path, count + 1);
      if (count > 0) path = `${path}-${count}`;

      entries.push({
        title: op.summary,
        path,
        description: op.description?.trim() || undefined,
      });
    }
  }
  return entries;
}

function kebab(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

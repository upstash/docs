import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { walkNavigation, type WalkItem } from "./generator.ts";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DOCS_ROOT = resolveDocsRoot(SCRIPT_DIR);
const SITE_URL = "https://upstash.com/docs";

const LLMS_TXT = join(DOCS_ROOT, "llms.txt");
const LLMS_FULL_TXT = join(DOCS_ROOT, "llms-full.txt");

function resolveDocsRoot(scriptDir: string): string {
  // src -> llms -> docs
  return join(scriptDir, "..", "..");
}

const llmsLines: string[] = ["# Upstash Documentation", ""];
const llmsFullLines: string[] = ["# Upstash Documentation", ""];

for (const item of walkNavigation({ docsRoot: DOCS_ROOT })) {
  renderItem(item);
}

writeFileSync(LLMS_TXT, llmsLines.join("\n").replace(/\n+$/, "\n"));
writeFileSync(LLMS_FULL_TXT, llmsFullLines.join("\n").replace(/\n+$/, "\n"));

console.log(`Wrote ${LLMS_TXT}`);
console.log(`Wrote ${LLMS_FULL_TXT}`);

function renderItem(item: WalkItem): void {
  if (item.type === "group") {
    // depth 0 (tab) -> ##, depth 1 -> ###, etc. We reserve # for the doc title.
    const hashes = "#".repeat(Math.min(item.depth + 2, 6));
    const heading = `${hashes} ${item.group}`;
    pushHeading(llmsLines, heading);
    pushHeading(llmsFullLines, heading);
    return;
  }

  if (item.type === "openapi") {
    // We don't expand the spec yet — just note its location (and, when
    // available, link to the rendered docs directory).
    const line = item.directory
      ? `- OpenAPI reference: [${item.directory}](${SITE_URL}/${item.directory}) (source: \`${item.source}\`)`
      : `- OpenAPI spec: \`${item.source}\``;
    llmsLines.push(line);
    llmsFullLines.push(line);
    return;
  }

  // type === "page"
  const url = `${SITE_URL}/${item.path}`;
  const desc = item.metadata.description
    ? `: ${item.metadata.description}`
    : "";
  llmsLines.push(`- [${item.metadata.title}](${url})${desc}`);

  // Full bundle: include the page body verbatim, under a heading.
  llmsFullLines.push(`### ${item.metadata.title}`, "");
  llmsFullLines.push(`Source: ${url}`, "");
  llmsFullLines.push(item.content.trim(), "", "---", "");
}

function pushHeading(out: string[], heading: string): void {
  // Ensure a blank line precedes every heading so list bullets don't run
  // straight into the next section.
  if (out.length > 0 && out[out.length - 1] !== "") out.push("");
  out.push(heading, "");
}

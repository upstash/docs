import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DOCS_ROOT = join(SCRIPT_DIR, "..", "..");

// Step 1: regenerate
execSync("npx tsx src/build.ts", {
  cwd: join(DOCS_ROOT, "llms"),
  stdio: "inherit",
});

// Step 2: check whether the generated files differ from what's committed
const status = execSync("git status --porcelain -- llms.txt llms-full.txt", {
  cwd: DOCS_ROOT,
  encoding: "utf-8",
}).trim();

if (status) {
  console.error(
    "\n >> Error: llms.txt / llms-full.txt are out of date. Run `npm run build` in llms/ and commit the result.\n",
  );
  console.error("Changed files:\n");
  console.error(status);
  console.error();
  process.exit(1);
}

console.log("llms.txt and llms-full.txt are up to date.");

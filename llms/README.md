# llms.txt generator

Generates `llms.txt` and `llms-full.txt` at the docs root from `docs.json`
and the MDX files in this repo. Replaces the auto-generated versions Mintlify
ships so we can control exactly what lands at
`https://upstash.com/docs/llms.txt` and `/llms-full.txt`.

## Layout

```
llms/
├── package.json
├── tsconfig.json
└── src/
    ├── generator.ts   # walks docs.json; yields groups, pages, openapi refs
    ├── openapi.ts     # loads OpenAPI specs and expands operations
    ├── build.ts       # consumes the generator; writes both .txt files
    └── check.ts       # rebuilds and fails if the files are out of date
```

Outputs are written to the docs root:

- `docs/llms.txt`
- `docs/llms-full.txt`

## Scripts

```sh
npm install      # one-time, from this folder
npm run build    # regenerate llms.txt and llms-full.txt
npm run check    # rebuild, then exit non-zero if either file changed
```

`check` is what the GitHub workflow runs on every PR. If it finds the files
stale, the workflow commits the regenerated output back to the PR branch and
fails the run so the reviewer notices.

## How it works

### 1. `walkNavigation` (generator.ts)

A generator that walks the `navigation.tabs` tree in `docs.json` and yields
one item per node:

```ts
type WalkItem =
  | { type: "group";   group: string; depth: number }
  | { type: "openapi"; source: string; directory?: string }
  | { type: "page";    path: string; metadata: { title; description? };
                       content: string };
```

- Tab names are emitted as groups at `depth: 0`. Nested groups increase
  the depth by one per level.
- `pages` and `groups` are mutually exclusive at every level — the types
  enforce that.
- A bare-string `openapi` (used at the tab level, e.g. Developer API) is
  yielded with only `source`. The object form `{source, directory}` is
  yielded with both.

### 2. `expandOpenApi` (openapi.ts)

Loads an OpenAPI spec and emits one entry per operation, mirroring how
Mintlify resolves spec-driven pages:

1. If the op has `x-mint.href`, use it verbatim (with the leading `/`
   stripped).
2. Else if a `directory` is given, the path is
   `<directory>/<tag>/<kebab-summary>`.
3. Else the path is `api-reference/<tag>/<kebab-summary>` (the fallback
   Mintlify uses when only a tab-level openapi string is set).

Duplicate slugs within a single spec are disambiguated with `-1`, `-2`, …
matching upstream.

### 3. `build.ts`

Collects entries from three sources:

1. `README.mdx` at the docs root (Mintlify includes it even though it isn't
   in `docs.json`).
2. `walkNavigation` — every MDX page and every OpenAPI operation.
3. An orphan-MDX scan — any `.mdx` file in the tree that isn't referenced
   from `docs.json`, since Mintlify still publishes them.

Entries are sorted alphabetically by site-relative path (without `.md`).
Two files are then written:

- **`llms.txt`** — flat `## Docs` list, then a `## OpenAPI Specs` footer
  for object-form openapi refs whose containing group sits at depth 2.
  The depth filter is an empirical match to upstream and excludes deeper
  specs (e.g. QStash REST API at depth 3).

- **`llms-full.txt`** — per-page blocks in this shape:

  ```
  # <title>
  Source: <url-without-.md>
  <blank lines>          # 3 for MDX pages, 1 for OpenAPI ops
  <body>
  <blank lines>          # 2 before the next page
  ```

  For OpenAPI ops the body is a synthesized
  `<spec> <method> <api-path>\n<description>` block.

  For MDX pages the body is the file body (frontmatter stripped) with a
  few transforms Mintlify applies at build time:

  - bullet `- ` → `* `
  - horizontal rule `---` → `***`
  - opening code fences with a language → ``` ```lang theme={"system"} ```
  - internal link URLs `/foo` → `/docs/foo`
  - `\&` → `&` inside link URLs
  - trailing whitespace stripped from every line

## Known divergences from upstream

`llms.txt` is byte-identical to `https://upstash.com/docs/llms.txt`.

`llms-full.txt` is structurally identical to upstream but its MDX bodies
still differ in roughly 53K of 87K lines, all from transformations that
require a real MDX/JSX parser:

- **JSX child re-indentation.** Mintlify indents content inside
  `<Tabs>`, `<Tab>`, `<Accordion>`, `<Steps>`, etc. by 4 spaces per
  nesting level. We emit those bodies verbatim.
- **Markdown table column padding.** Upstream pads every cell so column
  boundaries align vertically. We don't.
- **`<img>` attribute injection.** Some image tags receive `src=…` URLs
  injected from external data (e.g. shields.io badges). We can't
  reproduce these without Mintlify's component resolution data.
- **Blank-line spacing around components** occasionally differs as a
  knock-on effect of the above.

Closing the gap would mean integrating a Mintlify-compatible MDX
serializer (`@mdx-js/mdx` or `remark-mdx` + `remark-stringify`) with
component-aware rules. It's tracked as future work.

## Editing rules

- **Don't edit `llms.txt` or `llms-full.txt` by hand.** CI will overwrite
  any manual edit.
- To change the output, edit the source under `src/` and re-run
  `npm run build`.
- When updating `docs.json` or adding/removing MDX files, the workflow
  will regenerate the outputs automatically on the next PR push.

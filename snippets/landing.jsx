// Full-custom landing components (used by introduction.mdx with `mode: frame`).
// Styling lives in style.css (.u-* classes). Each component keeps its own data
// locally (Mintlify compiles exports in isolation — no cross-references).

export const Hero = () => (
  <div className="u-hero">
    <h1>Build with Upstash</h1>
    <p>
      Serverless data and messaging — Redis, Vector, QStash, Workflow, Search,
      and Box. Scale to zero, pay per request.
    </p>
  </div>
);

export const SectionHead = ({ eyebrow, title, sub }) => (
  <div className="u-section">
    {eyebrow ? <div className="u-eyebrow">{eyebrow}</div> : null}
    <h2>{title}</h2>
    {sub ? <p className="u-sub">{sub}</p> : null}
  </div>
);

export const ProductGrid = () => {
  const products = [
    { name: "Redis", desc: "Serverless Redis with per-request pricing.", href: "/redis/overall/getstarted", icon: "redis" },
    { name: "QStash", desc: "Message queue and scheduler over HTTP.", href: "/qstash/overall/getstarted", icon: "qstash" },
    { name: "Workflow", desc: "Durable serverless functions.", href: "/workflow/getstarted", icon: "workflow" },
    { name: "Box", desc: "Secure sandboxes for AI agents and code.", href: "/box/overall/quickstart", icon: "box" },
    { name: "Vector", desc: "Vector database for AI and LLM apps.", href: "/vector/overall/getstarted", icon: "vector" },
    { name: "Search", desc: "Full-text and semantic search.", href: "/search/overall/getstarted", icon: "search" },
  ];
  return (
    <div className="u-grid u-grid--fixed3">
      {products.map((p) => (
        <a key={p.href} href={p.href} className="u-card u-product">
          <img className="u-card__icon" src={`/img/icons/${p.icon}.svg`} alt="" />
          <div className="u-card__body">
            <div className="u-card__title">{p.name}</div>
            <div className="u-card__desc">{p.desc}</div>
          </div>
        </a>
      ))}
    </div>
  );
};

export const AgentResources = () => {
  // Tabler icons (MIT) — https://tabler.io/icons
  const items = [
    { name: "MCP Server", desc: "Manage Upstash from AI agents over MCP.", href: "/agent-resources/mcp", paths: ["M7 12l5 5l-1.5 1.5a3.536 3.536 0 1 1 -5 -5l1.5 -1.5", "M17 12l-5 -5l1.5 -1.5a3.536 3.536 0 1 1 5 5l-1.5 1.5", "M3 21l2.5 -2.5", "M18.5 5.5l2.5 -2.5", "M10 11l-2 2", "M13 14l-2 2"] },
    { name: "Skills", desc: "Ready-made skills for coding agents.", href: "/agent-resources/skills", paths: ["M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2m0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2m-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6"] },
    { name: "CLI", desc: "Manage Upstash from your terminal.", href: "/agent-resources/cli", paths: ["M8 9l3 3l-3 3", "M13 15l3 0", "M3 6a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2l0 -12"] },
    { name: "Context7", desc: "Up-to-date code docs for LLMs and agents.", href: "https://context7.com", icon: "/img/icons/context7.svg" },
  ];
  return (
    <div className="u-grid u-grid--fixed2">
      {items.map((it) => (
        <a key={it.href} href={it.href} className="u-card">
          {it.icon ? (
            <img className="u-card__icon" src={it.icon} alt="" />
          ) : (
            <div className="u-card__icon u-card__icon--muted">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {it.paths.map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </svg>
            </div>
          )}
          <div className="u-card__body">
            <div className="u-card__title">{it.name}</div>
            <div className="u-card__desc">{it.desc}</div>
          </div>
        </a>
      ))}
    </div>
  );
};

export const Concepts = () => {
  // Tabler icons (MIT) — https://tabler.io/icons
  const items = [
    { name: "Serverless", desc: "No infrastructure to provision — just create and use.", href: "/common/concepts/serverless", paths: ["M6.657 18c-2.572 0 -4.657 -2.007 -4.657 -4.483c0 -2.475 2.085 -4.482 4.657 -4.482c.393 -1.762 1.794 -3.2 3.675 -3.773c1.88 -.572 3.956 -.193 5.444 1c1.488 1.19 2.162 3.007 1.77 4.769h.99c1.913 0 3.464 1.56 3.464 3.486c0 1.927 -1.551 3.487 -3.465 3.487h-11.878"] },
    { name: "Scale to Zero", desc: "Pay only for what you use, nothing for idle resources.", href: "/common/concepts/scale-to-zero", paths: ["M12 5l0 14", "M18 13l-6 6", "M6 13l6 6"] },
    { name: "Global Replication", desc: "Low latency worldwide with multi-region replication.", href: "/common/concepts/global-replication", paths: ["M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0", "M3.6 9h16.8", "M3.6 15h16.8", "M11.5 3a17 17 0 0 0 0 18", "M12.5 3a17 17 0 0 1 0 18"] },
    { name: "Access Anywhere", desc: "REST APIs for edge and serverless runtimes.", href: "/common/concepts/access-anywhere", paths: ["M4 13h5", "M12 16v-8h3a2 2 0 0 1 2 2v1a2 2 0 0 1 -2 2h-3", "M20 8v8", "M9 16v-5.5a2.5 2.5 0 0 0 -5 0v5.5"] },
  ];
  return (
    <div className="u-grid u-grid--fixed2">
      {items.map((it) => (
        <a key={it.href} href={it.href} className="u-card">
          <div className="u-card__icon u-card__icon--muted">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {it.paths.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </svg>
          </div>
          <div className="u-card__body">
            <div className="u-card__title">{it.name}</div>
            <div className="u-card__desc">{it.desc}</div>
          </div>
        </a>
      ))}
    </div>
  );
};

export const Community = () => (
  <div className="u-grid u-grid--2">
    <a className="u-card" href="https://x.com/upstash">
      <div className="u-card__body">
        <div className="u-card__title">X / Twitter</div>
        <div className="u-card__desc">Latest news and product updates.</div>
      </div>
    </a>
    <a className="u-card" href="https://upstash.com/discord">
      <div className="u-card__body">
        <div className="u-card__title">Discord</div>
        <div className="u-card__desc">
          Ask the team and other developers your questions.
        </div>
      </div>
    </a>
  </div>
);

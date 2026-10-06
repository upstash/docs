// "Building with an AI coding agent?" card for product landing pages: `npx upstash`
// installs the Upstash MCP server and skills, with links to both pages.
// Usage: <AgentSetup product="Redis" /> (`product` is accepted for existing pages; the command covers every product).
// Everything lives inside the exported component: Mintlify does not expose non-exported top-level consts to snippet components.

export const AgentSetup = () => (
  <div className="u-card u-card--static u-agent-setup">
    <div className="u-card__icon u-card__icon--muted">
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8V4H8" />
        <rect width="16" height="12" x="4" y="8" rx="2" />
        <path d="M2 14h2" />
        <path d="M20 14h2" />
        <path d="M15 13v2" />
        <path d="M9 13v2" />
      </svg>
    </div>
    <div className="u-card__body">
      <div className="u-card__title">Building with an AI coding agent?</div>
      <div className="u-card__desc">
        Run <code>npx upstash</code> to install the Upstash <a href="/agent-resources/mcp">MCP server</a> and{" "}
        <a href="/agent-resources/skills">skills</a> in Claude Code, Cursor, Codex, and other agents.
      </div>
    </div>
  </div>
);

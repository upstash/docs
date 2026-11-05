// "Set up your coding agent" card for product landing pages. Links to /agent-resources/overview.
// Usage: <AgentSetup product="Redis" />
// Everything lives inside the exported component: Mintlify does not expose non-exported top-level consts to snippet components.

export const AgentSetup = ({ product }) => {
  const desc = product
    ? `Connect the Upstash MCP server and the ${product} skill to Claude Code, Cursor, Codex, and other agents.`
    : "Connect the Upstash MCP server and skills to Claude Code, Cursor, Codex, and other agents.";

  return (
    <a className="u-card u-agent-setup" href="/agent-resources/overview">
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
        <div className="u-card__desc">{desc}</div>
      </div>
    </a>
  );
};

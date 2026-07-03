// "Migrate to Upstash" stub. Guides are added later — for now this renders the
// grid of source platforms in a "coming soon" state. Cards are intentionally
// link-less until the destination pages exist.
//
// Custom-styled cards (see .u-card in style.css). Same Mintlify constraint as
// catalog.jsx: the data lives inside the component.

export const Migrate = ({ product, cols = 3 }) => {
  const sources = [
    { name: "Redis Cloud", product: "redis" },
    { name: "AWS ElastiCache", product: "redis" },
    { name: "Amazon DynamoDB", product: "redis" },
    { name: "GCP Memorystore", product: "redis" },
    { name: "Azure Cache for Redis", product: "redis" },
    { name: "Self-hosted Redis", product: "redis" },
  ];

  const items = sources.filter((s) => !product || s.product === product);
  const gridClass = "u-grid " + (cols >= 3 ? "u-grid--3" : "u-grid--2");

  return (
    <div className={gridClass}>
      {items.map((s) => (
        <div key={s.name} className="u-card u-card--static">
          <div className="u-card__icon u-card__icon--muted">⇄</div>
          <div className="u-card__body">
            <div className="u-card__title">{s.name}</div>
            <div className="u-card__desc">Guide coming soon</div>
          </div>
        </div>
      ))}
    </div>
  );
};

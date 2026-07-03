// "Migrate to Upstash" stub. Guides are added later — for now this renders the
// grid of source platforms with a "coming soon" state. Cards are intentionally
// link-less until the destination pages exist.
//
// Same Mintlify constraint as catalog.jsx: data lives inside the component.

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

  return (
    <CardGroup cols={cols}>
      {items.map((s) => (
        <Card key={s.name} title={s.name} icon="arrow-right-arrow-left">
          Guide coming soon
        </Card>
      ))}
    </CardGroup>
  );
};

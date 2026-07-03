// Full-custom landing components (used by introduction.mdx with `mode: custom`).
// Styling lives in style.css (.u-* classes). Each component keeps its own data
// locally (Mintlify compiles exports in isolation — no cross-references).

export const Hero = () => (
  <div className="u-hero">
    <h1>Build with Upstash</h1>
    <p>
      Serverless data and messaging — Redis, Vector, QStash, Workflow, Search,
      and Box. Scale to zero, pay per request.
    </p>
    <div className="u-cta">
      <a className="u-btn u-btn--primary" href="/redis/overall/getstarted">
        Get started
      </a>
      <a className="u-btn u-btn--ghost" href="#products">
        Browse products
      </a>
    </div>
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
    { name: "Vector", desc: "Vector database for AI and LLM apps.", href: "/vector/overall/getstarted", icon: "vector" },
    { name: "QStash", desc: "Message queue and scheduler over HTTP.", href: "/qstash/overall/getstarted", icon: "qstash" },
    { name: "Workflow", desc: "Durable serverless functions.", href: "/workflow/getstarted", icon: "workflow" },
    { name: "Search", desc: "Full-text and semantic search.", href: "/search/overall/getstarted", icon: "search" },
    { name: "Box", desc: "Secure sandboxes for AI agents and code.", href: "/box/overall/quickstart", icon: "box" },
  ];
  return (
    <div className="u-grid u-grid--3">
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

export const Console = () => {
  const shots = [
    { src: "/img/getting_started/charts.png", cap: "Redis — real-time metrics" },
    { src: "/img/ratelimit/dashboard.png", cap: "Ratelimit — analytics" },
    { src: "/img/qstash/log.png", cap: "QStash — message logs" },
    { src: "/img/qstash-workflow/run-view.png", cap: "Workflow — run inspector" },
  ];
  return (
    <div className="u-grid u-grid--2">
      {shots.map((s) => (
        <figure key={s.src} className="u-console">
          <img src={s.src} alt={s.cap} />
          <figcaption className="u-console__cap">{s.cap}</figcaption>
        </figure>
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

// Single source of truth for SDKs, integrations, and demos across the docs.
//
// Renders custom-styled cards (see .u-card in style.css) with a programming-language
// icon per card. Used on each product landing (filtered via the `product` prop).
//
// NOTE (Mintlify constraint, validated): an exported component CANNOT reference a
// sibling module-level `export const`. Mintlify compiles each export in isolation,
// so the data array MUST live inside the component's own function body.
//
// Fields: { title, description, href, product, type, lang, featured? }
//   product: "redis" | "vector" | "qstash" | "workflow" | "search" | "box"  (or an array)
//   type:    "sdk" | "integration" | "demo"
//   lang:    "typescript" | "python" | "ruby"  (icon in img/icons/lang/<lang>.svg)

export const Catalog = ({ product, type, featured, search, cols = 3 }) => {
  const catalog = [
    // ---------- SDKs ----------
    { title: "@upstash/redis", description: "HTTP-based Redis client for serverless and edge.", href: "/redis/sdks/ts/overview", product: "redis", type: "sdk", lang: "typescript", featured: true },
    { title: "upstash-redis (Python)", description: "Serverless Redis client for Python.", href: "/redis/sdks/py/overview", product: "redis", type: "sdk", lang: "python" },
    { title: "@upstash/ratelimit", description: "Rate limiting for serverless, built on Redis.", href: "/redis/sdks/ratelimit-ts/overview", product: "redis", type: "sdk", lang: "typescript", featured: true },
    { title: "ratelimit (Python)", description: "Rate limiting SDK for Python.", href: "/redis/sdks/ratelimit-py/overview", product: "redis", type: "sdk", lang: "python" },
    { title: "Realtime", description: "Add realtime features to any Next.js app.", href: "/redis/sdks/realtime", product: "redis", type: "sdk", lang: "typescript" },
    { title: "AgentKit", description: "Agent memory, RAG, and chat history on Redis.", href: "/redis/sdks/agentkit/ai-sdk", product: "redis", type: "sdk", lang: "typescript" },
    { title: "Redis Analytics", description: "Event tracking, flags, and A/B testing, powered by Redis.", href: "/redis/sdks/redis-analytics", product: "redis", type: "sdk", lang: "typescript" },
    { title: "Agent Analytics", description: "Track AI agent traffic hitting your website.", href: "/redis/sdks/agent-analytics", product: "redis", type: "sdk", lang: "typescript" },
    { title: "@upstash/vector", description: "Vector database client for AI and LLM apps.", href: "/vector/sdks/ts/getting-started", product: "vector", type: "sdk", lang: "typescript", featured: true },
    { title: "upstash-vector (Python)", description: "Vector database client for Python.", href: "/vector/sdks/py/gettingstarted", product: "vector", type: "sdk", lang: "python" },
    { title: "@upstash/qstash", description: "Publish messages and schedule jobs over HTTP.", href: "/qstash/sdks/ts/overview", product: "qstash", type: "sdk", lang: "typescript", featured: true },
    { title: "qstash-py", description: "QStash messaging and scheduling for Python.", href: "/qstash/sdks/py/overview", product: "qstash", type: "sdk", lang: "python" },
    { title: "@upstash/workflow", description: "Durable serverless functions and workflows.", href: "/workflow/getstarted", product: "workflow", type: "sdk", lang: "typescript", featured: true },
    { title: "workflow-py", description: "Durable workflows for Python.", href: "https://github.com/upstash/workflow-py", product: "workflow", type: "sdk", lang: "python" },
    { title: "@upstash/search", description: "Full-text and semantic search client.", href: "/search/sdks/ts/getting-started", product: "search", type: "sdk", lang: "typescript", featured: true },
    { title: "upstash-search (Python)", description: "Search client for Python.", href: "/search/sdks/py/gettingstarted", product: "search", type: "sdk", lang: "python" },
    { title: "@upstash/box", description: "TypeScript SDK for Upstash Box.", href: "https://github.com/upstash/box/tree/main/packages/sdk", product: "box", type: "sdk", lang: "typescript", featured: true },
    { title: "box (Python)", description: "Python SDK for Upstash Box.", href: "https://github.com/upstash/box/tree/main/packages/python-sdk", product: "box", type: "sdk", lang: "python" },
    { title: "Box CLI", description: "Create and manage boxes from your terminal.", href: "https://github.com/upstash/box/tree/main/packages/cli", product: "box", type: "sdk", lang: "typescript" },

    // ---------- Integrations ----------
    { title: "BullMQ", description: "Message queue built on Redis.", href: "/redis/integrations/bullmq", product: "redis", type: "integration", lang: "typescript", featured: true },
    { title: "Drizzle", description: "Cache Drizzle ORM queries with Upstash Redis.", href: "/redis/integrations/drizzle", product: "redis", type: "integration", lang: "typescript", featured: true },
    { title: "Celery", description: "Use Upstash Redis as a Celery broker.", href: "/redis/integrations/celery", product: "redis", type: "integration", lang: "python" },
    { title: "Sidekiq", description: "Background jobs for Ruby on Upstash Redis.", href: "/redis/integrations/sidekiq", product: "redis", type: "integration", lang: "ruby" },
    { title: "MCP Server", description: "Manage Upstash Redis from AI agents via MCP.", href: "/agent-resources/mcp", product: "redis", type: "integration", lang: "typescript" },
    { title: "n8n (Redis)", description: "Automate workflows with Redis nodes in n8n.", href: "/redis/integrations/n8n", product: "redis", type: "integration", lang: "typescript" },
    { title: "Prometheus (Redis)", description: "Scrape Upstash Redis metrics into Prometheus.", href: "/redis/integrations/prometheus", product: "redis", type: "integration", lang: "typescript" },
    { title: "LangChain", description: "Vector store integration for LLM apps.", href: "/vector/integrations/langchain", product: "vector", type: "integration", lang: "python", featured: true },
    { title: "Vercel AI SDK", description: "Back the AI SDK with Upstash Vector.", href: "/vector/integrations/ai-sdk", product: "vector", type: "integration", lang: "typescript", featured: true },
    { title: "LlamaIndex", description: "Use Upstash Vector as a LlamaIndex store.", href: "/vector/integrations/llamaindex", product: "vector", type: "integration", lang: "python" },
    { title: "Flowise", description: "Build LLM flows on Upstash Vector.", href: "/vector/integrations/flowise", product: "vector", type: "integration", lang: "typescript" },
    { title: "Langflow", description: "Visual LLM apps backed by Upstash Vector.", href: "/vector/integrations/langflow", product: "vector", type: "integration", lang: "python" },
    { title: "LlamaParse", description: "Parse and index documents into Upstash Vector.", href: "/vector/integrations/llamaparse", product: "vector", type: "integration", lang: "python" },
    { title: "Resend", description: "Send emails from QStash workflows.", href: "/qstash/integrations/resend", product: "qstash", type: "integration", lang: "typescript", featured: true },
    { title: "Anthropic", description: "Call Claude reliably through QStash.", href: "/qstash/integrations/anthropic", product: "qstash", type: "integration", lang: "typescript" },
    { title: "LLM APIs", description: "Queue and retry LLM calls with QStash.", href: "/qstash/integrations/llm", product: "qstash", type: "integration", lang: "typescript" },
    { title: "Datadog", description: "Monitor QStash with Datadog.", href: "/qstash/integrations/datadog", product: "qstash", type: "integration", lang: "typescript" },
    { title: "Pipedream", description: "Trigger Pipedream workflows from QStash.", href: "/qstash/integrations/pipedream", product: "qstash", type: "integration", lang: "typescript" },
    { title: "n8n (QStash)", description: "Publish QStash messages from n8n.", href: "/qstash/integrations/n8n", product: "qstash", type: "integration", lang: "typescript" },
    { title: "Docusaurus", description: "Add full-text search to a Docusaurus site.", href: "/search/integrations/docusaurus", product: "search", type: "integration", lang: "typescript" },

    // ---------- Demos ----------
    { title: "Hacker News Trends", description: "Trend search over Hacker News, built on Upstash.", href: "https://hackernewstrends.com", product: "redis", type: "demo", lang: "typescript", search: true, featured: true },
    { title: "Eve — Hacker News Agent", description: "A Hacker News agent built with the Vercel Eve framework.", href: "https://upstash-hackernews-eve-agent.vercel.app", product: "redis", type: "demo", lang: "typescript", search: true, featured: true },
    { title: "AI SDK Code Interpreter", description: "Run AI-generated code in a Box sandbox.", href: "/box/guides/ai-sdk-code-interpreter", product: "box", type: "demo", lang: "typescript", featured: true },
    { title: "E-commerce Order Fulfillment", description: "Durable order processing with Workflow.", href: "/workflow/examples/eCommerceOrderFulfillment", product: "workflow", type: "demo", lang: "typescript", featured: true },
    { title: "Image Processing", description: "Fan-out image jobs with Workflow.", href: "/workflow/examples/imageProcessing", product: "workflow", type: "demo", lang: "typescript", featured: true },
    { title: "Customer Onboarding", description: "Multi-step onboarding flow with delays.", href: "/workflow/examples/customerOnboarding", product: "workflow", type: "demo", lang: "typescript" },
    { title: "Payment Retry", description: "Retry failed payments with backoff.", href: "/workflow/examples/paymentRetry", product: "workflow", type: "demo", lang: "typescript" },
    { title: "Wait for Event", description: "Pause a workflow until an external event.", href: "/workflow/examples/waitForEvent", product: "workflow", type: "demo", lang: "typescript" },
    { title: "Auth Webhook", description: "Handle auth webhooks durably.", href: "/workflow/examples/authWebhook", product: "workflow", type: "demo", lang: "typescript" },
  ];

  const matchesProduct = (entry) =>
    !product ||
    (Array.isArray(entry.product)
      ? entry.product.includes(product)
      : entry.product === product);

  const items = catalog.filter(
    (entry) =>
      matchesProduct(entry) &&
      (!type || entry.type === type) &&
      (!featured || entry.featured) &&
      (!search || entry.search),
  );

  const gridClass = "u-grid " + (cols >= 3 ? "u-grid--3" : "u-grid--2");

  return (
    <div className={gridClass}>
      {items.map((entry) => (
        <a key={entry.href} href={entry.href} className="u-card">
          <img
            className="u-card__icon"
            src={`/img/icons/lang/${entry.lang}.${entry.lang === "ruby" ? "png" : "svg"}`}
            alt={entry.lang}
          />
          <div className="u-card__body">
            <div className="u-card__title">{entry.title}</div>
            <div className="u-card__desc">{entry.description}</div>
          </div>
        </a>
      ))}
    </div>
  );
};

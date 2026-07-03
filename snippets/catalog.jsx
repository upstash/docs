// Single source of truth for SDKs, integrations, and demos across the docs.
//
// Used on the main Get Started page (all products, with a product icon per card)
// and on each product landing (filtered via the `product` prop, icon hidden).
//
// NOTE (Mintlify constraint, validated): an exported component CANNOT reference a
// sibling module-level `export const`. Mintlify compiles each export in isolation,
// so the data array MUST live inside the component's own function body.
// `.map`, `Card`/`CardGroup`, and cross-file imports all work fine.
//
// Fields: { title, description, href, product, type, featured? }
//   product: "redis" | "vector" | "qstash" | "workflow" | "search" | "box"
//            (or an array for multi-product entries)
//   type:    "sdk" | "integration" | "demo"

export const Catalog = ({ product, type, featured, cols = 2 }) => {
  const catalog = [
    // ---------- SDKs ----------
    { title: "@upstash/redis", description: "HTTP-based Redis client for serverless and edge.", href: "/redis/sdks/ts/overview", product: "redis", type: "sdk", featured: true },
    { title: "upstash-redis (Python)", description: "Serverless Redis client for Python.", href: "/redis/sdks/py/overview", product: "redis", type: "sdk" },
    { title: "@upstash/ratelimit", description: "Rate limiting for serverless, built on Redis.", href: "/redis/sdks/ratelimit-ts/overview", product: "redis", type: "sdk", featured: true },
    { title: "ratelimit (Python)", description: "Rate limiting SDK for Python.", href: "/redis/sdks/ratelimit-py/overview", product: "redis", type: "sdk" },
    { title: "@upstash/vector", description: "Vector database client for AI and LLM apps.", href: "/vector/sdks/ts/getting-started", product: "vector", type: "sdk", featured: true },
    { title: "upstash-vector (Python)", description: "Vector database client for Python.", href: "/vector/sdks/py/gettingstarted", product: "vector", type: "sdk" },
    { title: "@upstash/qstash", description: "Publish messages and schedule jobs over HTTP.", href: "/qstash/sdks/ts/overview", product: "qstash", type: "sdk", featured: true },
    { title: "qstash-py", description: "QStash messaging and scheduling for Python.", href: "/qstash/sdks/py/overview", product: "qstash", type: "sdk" },
    { title: "@upstash/workflow", description: "Durable serverless functions and workflows.", href: "/workflow/getstarted", product: "workflow", type: "sdk", featured: true },
    { title: "@upstash/search", description: "Full-text and semantic search client.", href: "/search/sdks/ts/getting-started", product: "search", type: "sdk", featured: true },

    // ---------- Integrations ----------
    { title: "BullMQ", description: "Message queue built on Redis.", href: "/redis/integrations/bullmq", product: "redis", type: "integration", featured: true },
    { title: "Drizzle", description: "Cache Drizzle ORM queries with Upstash Redis.", href: "/redis/integrations/drizzle", product: "redis", type: "integration", featured: true },
    { title: "Celery", description: "Use Upstash Redis as a Celery broker.", href: "/redis/integrations/celery", product: "redis", type: "integration" },
    { title: "Sidekiq", description: "Background jobs for Ruby on Upstash Redis.", href: "/redis/integrations/sidekiq", product: "redis", type: "integration" },
    { title: "MCP Server", description: "Manage Upstash Redis from AI agents via MCP.", href: "/redis/integrations/mcp", product: "redis", type: "integration" },
    { title: "n8n (Redis)", description: "Automate workflows with Redis nodes in n8n.", href: "/redis/integrations/n8n", product: "redis", type: "integration" },
    { title: "Prometheus (Redis)", description: "Scrape Upstash Redis metrics into Prometheus.", href: "/redis/integrations/prometheus", product: "redis", type: "integration" },
    { title: "LangChain", description: "Vector store integration for LLM apps.", href: "/vector/integrations/langchain", product: "vector", type: "integration", featured: true },
    { title: "Vercel AI SDK", description: "Back the AI SDK with Upstash Vector.", href: "/vector/integrations/ai-sdk", product: "vector", type: "integration", featured: true },
    { title: "LlamaIndex", description: "Use Upstash Vector as a LlamaIndex store.", href: "/vector/integrations/llamaindex", product: "vector", type: "integration" },
    { title: "Flowise", description: "Build LLM flows on Upstash Vector.", href: "/vector/integrations/flowise", product: "vector", type: "integration" },
    { title: "Langflow", description: "Visual LLM apps backed by Upstash Vector.", href: "/vector/integrations/langflow", product: "vector", type: "integration" },
    { title: "LlamaParse", description: "Parse and index documents into Upstash Vector.", href: "/vector/integrations/llamaparse", product: "vector", type: "integration" },
    { title: "Resend", description: "Send emails from QStash workflows.", href: "/qstash/integrations/resend", product: "qstash", type: "integration", featured: true },
    { title: "Anthropic", description: "Call Claude reliably through QStash.", href: "/qstash/integrations/anthropic", product: "qstash", type: "integration" },
    { title: "LLM APIs", description: "Queue and retry LLM calls with QStash.", href: "/qstash/integrations/llm", product: "qstash", type: "integration" },
    { title: "Datadog", description: "Monitor QStash with Datadog.", href: "/qstash/integrations/datadog", product: "qstash", type: "integration" },
    { title: "Pipedream", description: "Trigger Pipedream workflows from QStash.", href: "/qstash/integrations/pipedream", product: "qstash", type: "integration" },
    { title: "n8n (QStash)", description: "Publish QStash messages from n8n.", href: "/qstash/integrations/n8n", product: "qstash", type: "integration" },

    // ---------- Demos ----------
    { title: "E-commerce Order Fulfillment", description: "Durable order processing with Workflow.", href: "/workflow/examples/eCommerceOrderFulfillment", product: "workflow", type: "demo", featured: true },
    { title: "Image Processing", description: "Fan-out image jobs with Workflow.", href: "/workflow/examples/imageProcessing", product: "workflow", type: "demo", featured: true },
    { title: "Customer Onboarding", description: "Multi-step onboarding flow with delays.", href: "/workflow/examples/customerOnboarding", product: "workflow", type: "demo" },
    { title: "Payment Retry", description: "Retry failed payments with backoff.", href: "/workflow/examples/paymentRetry", product: "workflow", type: "demo" },
    { title: "Wait for Event", description: "Pause a workflow until an external event.", href: "/workflow/examples/waitForEvent", product: "workflow", type: "demo" },
    { title: "Auth Webhook", description: "Handle auth webhooks durably.", href: "/workflow/examples/authWebhook", product: "workflow", type: "demo" },
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
      (!featured || entry.featured),
  );

  // Show the product icon only on the main (cross-product) page; on a product
  // landing the product is implicit, so the icon would be redundant.
  const showIcon = !product;

  return (
    <CardGroup cols={cols}>
      {items.map((entry) => {
        const prod = Array.isArray(entry.product)
          ? entry.product[0]
          : entry.product;
        return (
          <Card
            key={entry.href}
            title={entry.title}
            href={entry.href}
            icon={showIcon ? `/img/icons/${prod}.svg` : undefined}
          >
            {entry.description}
          </Card>
        );
      })}
    </CardGroup>
  );
};

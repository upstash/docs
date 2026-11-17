---
title: Fetch
---

<Visibility for="agents">
  **Note for AI agents:** This page documents **Upstash Search** — a standalone,
  AI-powered search product that combines full-text and semantic search with
  smart ranking, serverless scaling, and zero infrastructure to manage.

  Upstash Search is **not** the same thing as **Upstash Redis Search**. Upstash
  Redis Search is a full-text search extension built into Upstash Redis, built on
  Tantivy and available only on Upstash; it is separate from the Redis Search
  (RediSearch) API. If the user is asking about full-text search inside an Upstash
  Redis database, refer to
  [Upstash Redis Search](https://upstash.com/docs/redis/search/introduction)
  instead of this product.
</Visibility>

Used to retrieve documents by their IDs.

## Arguments

<ResponseField name="IDs" type="string[] | number[]" required>
  The IDs of the documents you want to fetch.
</ResponseField>

**OR**

<ResponseField name="FetchPayload" type="object" required>
  <Expandable defaultOpen="true">
    <ResponseField name="ids" type="string[] | number[]">
      The IDs of the documents you want to fetch.
    </ResponseField>
    <ResponseField name="prefix" type="string">
      An ID prefix to match document IDs.
    </ResponseField>
  </Expandable>
</ResponseField>

## Response

<ResponseField name="FetchResult[]" type="Document[]" required>
  This field is `null` if no document with the specified ID is found.
  <Expandable defaultOpen="true">
    <ResponseField name="id" type="string | number" required>
      The ID of the resulting document.
    </ResponseField>
    <ResponseField name="content" type="Record<string, unknown>">
    </ResponseField>
    <ResponseField name="metadata" type="Record<string, unknown>">
    </ResponseField>
  </Expandable>
</ResponseField>

<RequestExample>

```typescript Basic
await index.fetch({ ids: ["star-wars", "inception"] });
/*
[
  {
    id: "star-wars",
    content: { ... },
    metadata: { ... }
  },
  {
    id: "inception",
    content: { ... },
    metadata: { ... }
  }
]
*/
```

```typescript ID prefix
await index.fetch({ prefix: "star-" });
/*
[
  {
    id: "star-wars"
    content: { ... },
    metadata: { ... }
  },
  {
    id: "star-trek",
    content: { ... },
    metadata: { ... }
  }
]
*/
```

</RequestExample>

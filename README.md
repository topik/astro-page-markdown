# astro-page-markdown

An Astro integration that exposes pages as `.md` endpoints. During development, any page can be accessed as markdown by appending `.md` to its URL. In production builds, corresponding `.md` files are generated alongside your HTML output.

> **Attribution**: This project is a fork of [`@nuasite/llm-enhancements`](https://github.com/nuasite/nuasite/tree/main/packages/llm-enhancements) by Contember Limited, licensed under Apache 2.0. See [NOTICE](./NOTICE) for details.

## Features

- **Dev Server Support**: Access any page as markdown (e.g., `/about.md`)
- **Build Output**: Generates `.md` files during `astro build`
- **HTML to Markdown**: Converts static pages to clean markdown
- **Alternate Links**: Injects `<link rel="alternate" type="text/markdown">` into HTML
- **Frontmatter**: Includes metadata like title, description, and source path
- **LLM Discovery**: Auto-generated `/.well-known/llm.md` endpoint for LLM-friendly site discovery
- **llms.txt**: Auto-generated `/llms.txt` following the [llms.txt convention](https://llmstxt.org/) for crawler/LLM guidance

## Installation

```bash
npm install astro-page-markdown
```

## Usage

Add the integration to your `astro.config.mjs`:

```js
import pageMarkdown from 'astro-page-markdown'
import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://example.com',
  integrations: [
    pageMarkdown({
      includeStaticPages: true,
      includeFrontmatter: true,
      llmEndpoint: true,
      llmsTxt: true,
    }),
  ],
})
```

## How It Works

### Development Mode

When running `astro dev`, any page can be accessed as markdown by appending `.md` to its URL:

```
/about       → /about.md
/blog/hello  → /blog/hello.md
/            → /index.md
```

### Production Build

During `astro build`, the integration generates a corresponding `.md` file for each page:

```
dist/
├── index.html
├── index.md
├── about/
│   ├── index.html
├── about.md
└── .well-known/
    └── llm.md
└── llms.txt
```

### HTML Alternate Links

The integration automatically injects a `<link>` tag into HTML pages pointing to their markdown version:

```html
<head>
  <link rel="alternate" type="text/markdown" href="/about.md">
</head>
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `includeStaticPages` | `boolean` | `true` | Generate markdown for static pages |
| `includeFrontmatter` | `boolean` | `true` | Include YAML frontmatter in output |
| `llmEndpoint` | `boolean \| LlmEndpointOptions` | `true` | Enable `/.well-known/llm.md` |
| `llmsTxt` | `boolean \| LlmsTxtOptions` | `true` | Enable `/llms.txt` |

### LlmEndpointOptions

| Option | Type | Description |
|--------|------|-------------|
| `siteName` | `string` | Override the site name |
| `description` | `string` | Override the site description |
| `baseUrl` | `string` | Override base URL (defaults to Astro's `site`) |
| `additionalContent` | `string` | Additional markdown content to append |

### LlmsTxtOptions

| Option | Type | Description |
|--------|------|-------------|
| `siteName` | `string` | Override the site name |
| `description` | `string` | Override the site description |
| `baseUrl` | `string` | Override base URL (defaults to Astro's `site`) |
| `allowCrawling` | `boolean` | Whether crawling is allowed (default: true) |
| `instructions` | `string` | Custom instructions for LLMs |
| `additionalContent` | `string` | Additional content to append |

## License

Apache-2.0 — see [LICENSE](./LICENSE) and [NOTICE](./NOTICE).

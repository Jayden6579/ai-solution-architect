# AI Solution Architect Generator

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FJayden6579%2Fai-solution-architect)
[![Deploy with Vercel](https://img.shields.io/badge/Deploy-1_click-563ACC?logo=vercel&logoColor=white)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FJayden6579%2Fai-solution-architect)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](#license)

> 🔗 **Live demo:** _add your Vercel URL here after deploying_ — see [Deploy](#-deploy) below.

An enterprise-grade web application that simulates a real **pre-sales Solution Architect** workflow. Given a customer's natural-language requirements, it generates a complete, defensible enterprise architecture proposal — proposed architecture, a Mermaid diagram, design decisions, risks, mitigations, and a deployment recommendation — styled like an internal enterprise tool.

Built to showcase Solution Architect / Pre-sales Engineer / Technical Consultant skills.

---

## ✨ Features

- **Natural-language input** — describe the customer's workload, scale, country, HA/DR, and budget.
- **Structured output** across 7 sections: Executive Summary, Proposed Architecture, Architecture Diagram (Mermaid), Design Decisions, Risks, Mitigations, Deployment Recommendation.
- **Loading animation** with staged status messages + skeleton cards.
- **Exports** — Copy to clipboard, **Download as Markdown**, **Download as PDF** (print-to-PDF with the rendered diagram embedded).
- **Refine the proposal** (bonus) — Improve Design · Reduce Cost · Improve Performance · Improve Security · Improve High Availability. Each regenerates **only the related sections** without redoing the whole proposal.
- **Dark mode** toggle (persisted, no flash of incorrect theme).
- **Demo Mode** — runs fully offline with a built-in mock provider when no API key is configured, so the UI is always demonstrable.
- **Provider-agnostic** — works with any OpenAI-compatible Chat Completions endpoint (OpenAI, Azure OpenAI, Ollama, vLLM, …).

---

## 🧱 Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 14 (App Router, Server Actions) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS (class-based dark mode) |
| LLM | OpenAI-compatible SDK (`openai`) |
| Validation | Zod (LLM output schema) |
| Diagrams | Mermaid (lazy client import) |
| Markdown | `react-markdown` + `remark-gfm` |
| Icons | `lucide-react` |

---

## 🚀 Getting started

```bash
# 1. Install dependencies
npm install

# 2. (Optional) configure an LLM provider. Copy the example env file:
cp .env.example .env
#    then set LLM_API_KEY. Leave it empty to run in Demo Mode.

# 3. Run the dev server
npm run dev
```

Open <http://localhost:3000>. Click **Sample** to load an example requirement, then **Generate Architecture**.

### Configuration (`.env`)

| Variable | Default | Description |
| --- | --- | --- |
| `LLM_API_KEY` | _(empty)_ | API key. Leave empty for Demo Mode. |
| `LLM_BASE_URL` | `https://api.openai.com/v1` | Any OpenAI-compatible base URL. |
| `LLM_MODEL` | `gpt-4o` | Chat model id. |
| `LLM_PROVIDER_NAME` | `OpenAI` | Display name in the UI badge. |
| `LLM_TEMPERATURE` | `0.4` | Sampling temperature. |
| `LLM_JSON_MODE` | `true` | Request `response_format: { type: "json_object" }`. Disable if your provider doesn't support it. |

---

## 🏗️ Architecture

```
app/
  layout.tsx          Root layout, theme no-flash script, header
  page.tsx            Server component — reads provider config, renders <AppShell/>
  actions.ts          "use server" — generateArchitecture / regenerateArchitecture
  globals.css         Tailwind + .md / .skeleton / mermaid styles

components/
  AppShell.tsx        Client orchestrator: state + action calls + layout
  ControlPanel.tsx    Requirement input, sample/clear/generate, provider badge
  SolutionView.tsx    Composes all section cards + export + improvement actions
  ExportControls.tsx  Copy / Markdown / PDF (PDF via hidden print iframe)
  ImprovementActions.tsx  The 5 "refine" buttons
  Mermaid.tsx          Lazy client mermaid renderer (theme-aware)
  Markdown.tsx         react-markdown wrapper
  Header.tsx, ThemeToggle.tsx, ThemeProvider.tsx
  sections/            SectionCard + one component per output section
  ui/                  Button, Card, Badge, Spinner, Skeleton (design system)

lib/
  llm/
    provider.ts       Env-driven config + demo/live selection
    prompts.ts        System/user prompts + JSON contract + regeneration prompt
    schema.ts         Zod schemas for LLM output validation
    generate.ts       Orchestration: call LLM, parse, validate, merge
    improvements.ts   Maps each "refine" focus → sections to regenerate
    mock.ts           Built-in demo provider (keyword-aware sample solution)
  download.ts         Markdown + PDF + clipboard export helpers
  samples.ts          Sample requirement presets
  utils.ts            cn() class merge

types/index.ts        Shared domain model (single source of truth)
```

### How generation works

1. The client calls the **server action** `generateArchitectureAction` (defined in `app/actions.ts`). The API key and provider SDK never reach the browser.
2. `lib/llm/generate.ts` builds the prompt (persona + pinned JSON contract), calls the OpenAI-compatible endpoint, and validates the response with **Zod**. If the provider rejects JSON-object mode, it transparently retries without it.
3. The validated object is merged with metadata (model, provider, mode, timestamp) and returned to the UI.

### How "refine" works

Each refine button maps (via `lib/llm/improvements.ts`) to a subset of sections. `regenerateArchitectureAction` sends the current solution as context and asks the model to return **only** those sections given a focus directive (cost, security, …). The returned patch is merged into the existing solution, so unrelated sections are preserved and only the targeted cards show a "regenerating" overlay.

### Demo Mode

When `LLM_API_KEY` is empty, the app uses `lib/llm/mock.ts`, which performs lightweight keyword detection (database, country, scale, HA/DR, budget, app type) and produces a coherent, realistic architecture — including regeneration of the same sections the real provider would. This lets you run and showcase the app with **zero external dependencies**.

---

## 🧩 Extending

- **New output section** — add the field to `types/index.ts` + the Zod schema in `lib/llm/schema.ts`, add it to the prompt contract in `lib/llm/prompts.ts`, render a card in `components/sections/`, and compose it in `SolutionView.tsx`.
- **New LLM provider** — point `LLM_BASE_URL` at any OpenAI-compatible endpoint; no code change needed.
- **New refine action** — add an entry to `IMPROVEMENT_CONFIG` in `lib/llm/improvements.ts` and the icon map in `ImprovementActions.tsx`.

---

## 📦 Scripts

```bash
npm run dev        # start dev server
npm run build      # production build
npm run start      # serve production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

---

## ⚠️ Disclaimer

AI-generated proposals are a starting point. Always validate technical fit, pricing, licensing, and regional/compliance requirements with your cloud provider before committing to an architecture.

---

## 🚀 Deploy

The fastest way to get a live `https://` URL is **Vercel** (the makers of Next.js):

1. Open **https://vercel.com/new**
2. Import the `ai-solution-architect` repo from GitHub.
3. Click **Deploy** — no configuration needed. It runs in **Demo Mode** by default (no API key required, fully free).
4. You'll get a live URL like `https://ai-solution-architect-xxxx.vercel.app`.

**Use a real LLM instead of Demo Mode?** After deploying, go to
*Settings → Environment Variables* and add:

| Variable | Required | Example |
| --- | --- | --- |
| `LLM_API_KEY` | Yes (to leave Demo Mode) | `sk-...` |
| `LLM_BASE_URL` | No | `https://api.openai.com/v1` |
| `LLM_MODEL` | No | `gpt-4o` |
| `LLM_PROVIDER_NAME` | No | `OpenAI` |

Then **Redeploy**. Any provider with an OpenAI-compatible Chat Completions endpoint works (OpenAI, Azure OpenAI, Ollama, vLLM, …).

<details>
<summary><b>One-click deploy button</b></summary>

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FJayden6579%2Fai-solution-architect)

</details>

---

## License

MIT — free to use, modify, and share. See [LICENSE](LICENSE) for details.

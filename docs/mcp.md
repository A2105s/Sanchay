# MCP setup for this project

## What this is

Model Context Protocol (MCP) lets GitHub Copilot chat connect to external tools. Here we wire up the shadcn MCP server so Copilot can browse/search/install components defined by registries in `components.json`.

## Quick start (VS Code)

1. Ensure Node/npm are available locally.
2. Set required env vars in `.env.local` (see below).
3. Start servers: **Command Palette → "MCP: Start Server"** and start the ones you need (see list below).
4. Try prompts like "Show me all available components in the shadcn registry" or "Add the button, dialog, and card components".

## Servers included (.vscode/mcp.json)

- `github` (remote http) — needs `GITHUB_TOKEN`.
- `supabase-stdio` / `supabase-remote` — needs `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (or anon key for read-only) or `SUPABASE_REMOTE_TOKEN`.
- `notion-stdio` / `notion-remote` — needs `NOTION_API_TOKEN`.
- `sequential-thinking` (stdio) — no secrets.
- `memory` (stdio) — optional `MCP_MEMORY_STORAGE_PATH`.
- `tavily` (stdio) — needs `TAVILY_API_KEY`.
- `shadcn` (stdio) — uses project registries.

## Registries

- Registries are declared in [components.json](../components.json) under `registries`.
- For private registries, add tokens to `.env.local` (do not commit):

```bash
REGISTRY_TOKEN=your_token_here
```

## Manual config (if needed)

If the config is missing, recreate `.vscode/mcp.json`:

```json
{
  "servers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"],
      "transport": "stdio"
    }
  }
}
```

## Usage tips

- Restart the Copilot MCP server after editing `components.json` or env vars.
- Keep the MCP server running only when needed; stop it if you see runaway processes.

## Security & hygiene

- Never store API keys in MCP config. Use `.env.local` and your platform secret store.
- Avoid committing `.env*` or auth headers; they are already gitignored.
- Rotate any key that was exposed in terminal history or chat.

## Troubleshooting

- Server not listed: Re-open VS Code, confirm `.vscode/mcp.json` exists, and run "MCP: Start Server".
- No tools/prompts: Run `npx clear-npx-cache`, then restart the server.
- Registry failures: Validate `components.json` URLs and your network; recheck tokens for private registries.

## Maintenance

- Pin upgrades intentionally: `npx shadcn@<version> mcp` when stability matters.
- Log issues clearly: Capture command output (excluding secrets) when reporting problems.

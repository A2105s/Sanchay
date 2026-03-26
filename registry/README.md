# NationTrack Component Registry

This directory contains the shared component registry structure for the NationTrack design system.

## Structure

```
registry/
├── index.json              # Registry manifest
├── components/             # UI component definitions
├── blocks/                 # Composite block patterns
└── themes/                 # Theme configurations
```

## Using Components from Registry

Components can be installed via the shadcn CLI or MCP:

```bash
# Via CLI
npx shadcn@latest add @nationtrack/header

# Via MCP (in VS Code)
"Add the header component from nationtrack registry"
```

## Adding New Components

1. Define component in `components/[name].json`
2. Follow the shadcn registry schema
3. Include dependencies, files, and types
4. Test locally before publishing

## Registry Schema

Each component definition follows this structure:

```json
{
  "name": "component-name",
  "type": "registry:ui",
  "dependencies": ["dependency1", "dependency2"],
  "files": [
    {
      "path": "components/ui/component-name.tsx",
      "content": "...",
      "type": "registry:ui"
    }
  ]
}
```

## See Also

- [shadcn Registry Docs](https://ui.shadcn.com/docs/registry)

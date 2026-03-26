# Context7 Integration Guide

## Overview

Your project now has **Context7 API key** integrated globally for enhanced code analysis, understanding, and insights throughout your development workflow.

**API Key**: `${CONTEXT7_API_KEY}`

## What is Context7?

Context7 is an advanced codebase intelligence platform that provides:

- **Deep Code Analysis**: Understand complex codebases instantly
- **Related Code Discovery**: Find all files related to a specific function/component
- **Architecture Insights**: View and understand application architecture
- **Dependency Tracking**: See what depends on what
- **Code Navigation**: Jump between related code files effortlessly
- **Pattern Recognition**: Identify patterns and anti-patterns

## How to Use Context7

### 1. In GitHub Copilot Chat

Use the `@context7` mention to leverage Context7's analysis:

```
@context7 Explain the authentication flow in this project
@context7 Show me all files that use the useAuth hook
@context7 What's the architecture of the apps management system?
@context7 Find all Firebase queries in the codebase
```

### 2. For Code Analysis

Ask Context7 to analyze specific patterns:

```
@context7 Analyze the error handling patterns across all components
@context7 Show me all async operations and their error handling
@context7 What components use TanStack Query?
@context7 Find all instances where we interact with Firestore
```

### 3. For Architecture Understanding

Visualize your project structure:

```
@context7 Create a dependency graph for the admin system
@context7 Show the component hierarchy for app submission
@context7 Map out data flow from Firebase to components
@context7 What's the relationship between these files?
```

### 4. For Refactoring

Get intelligent refactoring suggestions:

```
@context7 Suggest optimizations for the AppCard component
@context7 Are there duplicate utility functions in the codebase?
@context7 Which components could be combined or simplified?
@context7 Find all uses of inline styles that should be Tailwind
```

## Advanced Usage Patterns

### Finding Related Code

```
@context7 Show all places where the App type is used
@context7 What files import from @/lib/firebase?
@context7 Which components render the AppCard component?
```

### Understanding Complex Features

```
@context7 Walk me through the app submission process
@context7 Explain the admin approval workflow
@context7 How does filtering work in the apps page?
```

### Performance Analysis

```
@context7 Identify potential performance bottlenecks
@context7 Which components might cause unnecessary re-renders?
@context7 Are there any missing React.memo optimizations?
```

### Security Analysis

```
@context7 Are there any security vulnerabilities in Firebase rules?
@context7 Check for proper input validation
@context7 Are secrets properly handled in environment variables?
```

## Integration Points

### With Copilot Instructions

Context7 respects your `.github/copilot/instructions.md`, enhancing code generation with project-specific context.

### With Custom Prompts

Use Context7 with the prompts in `docs/COPILOT_PROMPTS.md` for more accurate and contextual results.

### With MCP Servers

Context7 works alongside other MCPs:

- **GitHub MCP**: Repository context
- **Shadcn MCP**: UI component registry
- **Memory MCP**: Session persistence

## Best Practices

### 1. Be Specific

```
✅ Good: Show me all components that fetch data from Firestore
❌ Bad: Show me data fetching components
```

### 2. Include File Types

```
✅ Good: Find all .tsx files that use useQuery
❌ Bad: Find query hooks
```

### 3. Ask About Patterns

```
✅ Good: What error handling patterns are used?
❌ Bad: Are there errors?
```

### 4. Request Comparisons

```
✅ Good: Compare the two form components
❌ Bad: Show the form components
```

## Configuration

Context7 is configured in `.vscode/mcp.json`:

```json
"context7": {
  "command": "npx",
  "args": ["@context7/mcp-server"],
  "env": {
    "CONTEXT7_API_KEY": "${CONTEXT7_API_KEY}",
    "CONTEXT7_ENABLE_GLOBAL": "true"
  },
  "transport": "stdio",
  "type": "stdio"
}
```

The API key is stored in `.env.local` and automatically used.

## Common Use Cases

### When Starting on New Code

```
@context7 Give me an overview of the [component/module] structure and how it works
```

### When Adding Features

```
@context7 Show me all places I need to update for [feature]
@context7 What existing patterns should I follow for [feature]?
```

### When Debugging

```
@context7 Trace the data flow for this error
@context7 Show me all functions that might affect this variable
```

### When Refactoring

```
@context7 Is this pattern used elsewhere in the codebase?
@context7 What components depend on this code I'm changing?
```

### When Optimizing

```
@context7 Show me the biggest bundle size contributors
@context7 Which components are most frequently rendered?
```

## Tips for Maximum Value

1. **Use with custom instructions**: Context7 understands your `.github/copilot/instructions.md`
2. **Combine with GitHub MCP**: Together they provide complete understanding
3. **Ask follow-up questions**: Build on previous answers for deeper insights
4. **Request visualizations**: Context7 can create dependency diagrams
5. **Leverage for documentation**: Use Context7 findings to improve docs

## Troubleshooting

### MCP Not Connecting

1. Restart VS Code
2. Check `.vscode/mcp.json` syntax
3. Verify `CONTEXT7_API_KEY` in `.env.local`
4. Run `npm run dev` to ensure environment loads

### Limited Results

1. Be more specific with queries
2. Include file extensions (.tsx, .ts, etc.)
3. Use full path names
4. Ask about specific patterns

### Rate Limiting

- Context7 has API rate limits
- Space out requests appropriately
- Batch similar queries together

## Privacy & Security

- Context7 API key is stored in `.env.local` (not committed)
- Analysis happens server-side
- Your code is not stored or used for training
- Enterprise plans available for additional security

## Support

For issues or questions:

1. Check Context7 documentation
2. Ask in GitHub Copilot Chat: `@context7 help`
3. Review logs in VS Code output panel
4. Visit context7.dev for more information

## Next Steps

1. Restart VS Code to activate Context7
2. Try your first query: `@context7 Show me the project structure`
3. Use Context7 with custom prompts from `docs/COPILOT_PROMPTS.md`
4. Explore your codebase with confidence!

Happy coding with Context7! 🚀

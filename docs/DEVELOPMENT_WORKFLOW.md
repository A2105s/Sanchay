# Development Workflow Guide

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Firebase credentials

# Start development server
npm run dev

# Open http://localhost:3000
```

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format with Prettier
npm run format:check # Check formatting
npm run type-check   # TypeScript type checking
```

## Development Best Practices

### Before Starting Work

1. Pull latest changes: `git pull origin main`
2. Create feature branch: `git checkout -b feature/your-feature-name`
3. Install dependencies: `npm install`
4. Check environment variables are set

### During Development

1. **Use GitHub Copilot effectively**
   - Leverage the custom instructions in `.github/copilot/instructions.md`
   - Use `/awesome-copilot` commands for specialized tasks
   - Ask Copilot to explain complex code before modifying

2. **Follow code standards**
   - TypeScript strict mode enabled
   - Use type imports: `import type { ... }`
   - Follow component structure guidelines
   - Use shadcn/ui components from `@/components/ui/`

3. **Test as you go**
   - Check your changes in the browser
   - Test responsive designs (mobile, tablet, desktop)
   - Verify accessibility with keyboard navigation
   - Test error states and loading states

4. **Keep commits atomic**
   - Small, focused commits
   - Use conventional commit messages
   - Example: `feat: add app filtering by category`

### Before Committing

1. **Run checks**

   ```bash
   npm run lint:fix        # Fix linting issues
   npm run format          # Format code
   npm run type-check      # Check types
   npm run build           # Ensure build works
   ```

2. **Review your changes**
   - Use `git diff` to review changes
   - Remove console.logs and debug code
   - Update documentation if needed
   - Add comments for complex logic

3. **Commit with meaningful message**
   ```bash
   git add .
   git commit -m "feat: implement user authentication"
   git push origin feature/your-feature-name
   ```

### Creating Pull Requests

1. **Write clear description**
   - What changes were made
   - Why changes were necessary
   - How to test the changes
   - Screenshots for UI changes

2. **Self-review before requesting review**
   - Read through your code changes
   - Test the feature thoroughly
   - Check for edge cases
   - Verify no breaking changes

3. **Request reviews**
   - Tag appropriate reviewers
   - Respond to feedback promptly
   - Make requested changes
   - Re-request review after changes

## MCP Servers Usage

### GitHub Copilot MCP

Access GitHub features directly through Copilot:

- Create issues and PRs
- Review code
- Search repositories
- Manage branches

### Awesome Copilot MCP

Access community prompts and instructions:

- Use `/awesome-copilot` commands
- Explore best practices
- Find code patterns
- Use specialized agents

### Shadcn MCP

Manage UI components:

- Search for components
- Add new components
- View usage examples
- Check component documentation

### Context7 MCP (if available)

Enhanced codebase understanding:

- Deep code analysis
- Find related code
- Understand dependencies
- Architecture insights

## Troubleshooting

### Firebase Connection Issues

1. Check `.env.local` has correct credentials
2. Verify Firebase project settings
3. Check Firestore rules
4. Ensure billing is enabled (if using Blaze plan)

### Build Errors

1. Clear `.next` folder: `rm -rf .next`
2. Clear node_modules: `rm -rf node_modules && npm install`
3. Check TypeScript errors: `npm run type-check`
4. Verify imports and exports

### Styling Issues

1. Check Tailwind classes are correct
2. Verify CSS variables in `globals.css`
3. Check shadcn/ui component usage
4. Use browser DevTools to inspect

### Git Issues

1. Check branch is up to date: `git pull origin main`
2. Resolve merge conflicts carefully
3. Use `git status` to see current state
4. Ask for help if unsure

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)

## Getting Help

1. Check existing documentation
2. Search codebase for similar patterns
3. Ask GitHub Copilot for guidance
4. Consult with team members
5. Create issue for bugs or unclear requirements

# Contributing to KASA

Thank you for your interest in contributing to KASA! This guide will help you get started.

---

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

---

## How to Contribute

### Reporting Bugs

1. Check [existing issues](https://github.com/theekshana-sudeepa/kasa/issues) to avoid duplicates
2. Create a new issue with:
   - Clear title describing the bug
   - Steps to reproduce
   - Expected vs. actual behavior
   - Browser/OS information
   - Screenshots if applicable

### Suggesting Features

1. Open a [Feature Request](https://github.com/theekshana-sudeepa/kasa/issues/new) issue
2. Describe the feature and its use case
3. Explain why it would benefit KASA users

### Submitting Code

1. **Fork** the repository
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** following the coding standards below
4. **Test** your changes:
   ```bash
   npm run lint
   npm run build
   ```
5. **Commit** with clear messages:
   ```bash
   git commit -m "feat: add voice input language detection"
   ```
6. **Push** to your fork and create a **Pull Request**

---

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/kasa.git
cd kasa

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local

# Start dev server
npm run dev
```

---

## Coding Standards

### TypeScript

- Use strict TypeScript — avoid `any` types
- Define interfaces for all data structures
- Use proper error types (`unknown` instead of `any` in catch blocks)

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `ProductCard.tsx` |
| Utilities | camelCase | `response-parser.ts` |
| Constants | UPPER_SNAKE_CASE | `MAX_HISTORY` |
| Interfaces | PascalCase | `ChatMessage` |
| CSS classes | kebab-case | `.message-bubble` |

### File Organization

- Components go in `app/components/`
- API routes go in `app/api/`
- Library code goes in `app/lib/`
- Keep files focused — one component per file

### CSS

- Use the design system variables (e.g., `var(--kasa-primary-500)`)
- Support both light and dark modes
- Use responsive breakpoints for mobile compatibility

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Usage |
|--------|-------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation changes |
| `style:` | Code style (formatting, no logic change) |
| `refactor:` | Code refactoring |
| `perf:` | Performance improvement |
| `test:` | Adding or updating tests |
| `chore:` | Build/tooling changes |

---

## Pull Request Guidelines

- Keep PRs focused on a single change
- Include a clear description of what changed and why
- Ensure all checks pass (lint, build)
- Update documentation if needed
- Add screenshots for UI changes

---

## Areas Where Help Is Needed

- 🌐 **Tamil language support** — Full native Tamil translations
- 🧪 **Test coverage** — Unit and integration tests
- ♿ **Accessibility** — WCAG compliance improvements
- 📱 **PWA support** — Service worker and offline functionality
- 📊 **Analytics** — Conversion tracking and insights

---

## Questions?

Open a [Discussion](https://github.com/theekshana-sudeepa/kasa/discussions) or reach out to the maintainers.

---

*Thank you for helping make KASA better! — [Theekshana Sudeepa](https://github.com/theekshana-sudeepa)*

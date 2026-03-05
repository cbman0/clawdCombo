# Commit Helper

Interactive CLI tool for generating standardized [Conventional Commits](https://www.conventionalcommits.org/) messages.

## Features

- Interactive type selection with emojis and descriptions
- Scope input with validation
- Subject validation (max 50 chars, lowercase start, no trailing period)
- Optional body and breaking change footer
- Preview before committing
- Actions: commit directly, copy to clipboard, edit in $EDITOR, or cancel
- Colorful terminal output

## Usage

```bash
# Run directly
node tools/commit-helper.js

# Or via npm
npm run commit
```

## Workflow

1. **Select type**: Choose from feat, fix, docs, style, refactor, perf, test, chore, ci, build
2. **Enter scope**: Optional (e.g., `ui`, `contracts`, `api`)
3. **Write subject**: Concise description (max 50 chars, lowercase start)
4. **Add body** (optional): Detailed explanation
5. **Breaking change?** (optional): Mark as breaking and describe
6. **Add footer** (optional): e.g., `Closes #123`, `Co-authored-by: Name <email>`
7. **Preview**: Review the formatted commit message
8. **Choose action**:
   - `Y` or Enter: Commit directly
   - `e`: Edit in $EDITOR
   - `c`: Copy to clipboard (without committing)
   - `n` or anything else: Cancel

## Examples

### Interactive Session

```
┌─────────────────────────────────────────────────────────────┐
│         clawdCombo Commit Helper                          │
└─────────────────────────────────────────────────────────────┘

Select commit type:
  1) ✨ feat      - A new feature
  2) 🐛 fix       - A bug fix
  3) 📚 docs      - Documentation changes
  4) 💅 style     - Code style changes (formatting, no code change)
  5) ♻️ refactor   - Code refactoring
  6) ✅ test      - Adding or fixing tests
  7) 🧹 chore     - Build process, tooling, etc.
  8) 🤖 ci        - CI/CD changes
  9) 🔨 build     - Build system changes
 10) ⚡ perf      - Performance improvements

Enter number (1-10): 1
Scope (optional, e.g., "ui", "contracts", "api"): api
Subject (required, max 50 chars, lowercase start): add health check endpoint
Body (optional, press Enter to skip):
Breaking change? (y/N): n
Footer (optional, e.g., "Closes #123", "Co-authored-by: ..."). Press Enter to skip:

┌─────────────────────────────────────────────────────────────┐
│         Commit Message Preview                            │
└─────────────────────────────────────────────────────────────┘
feat(api): add health check endpoint

Format: feat(api): <subject>

Action: (Y)es, (e)dit, (c)opy, (n)o: y
✓ Commit created successfully!
```

### Generated Messages

- `feat(api): add health check endpoint`
- `fix(contracts): handle reentrancy in withdraw`
- `docs: update README with deployment instructions`
- `refactor(ui): split button component into separate file`
- `test: add unit tests for token registry`
- `chore: update dependencies to latest versions`
- `feat: add new AaveV3 flashloan adapter` (no scope)

## Requirements

- Node.js 12+
- Git
- Optional: `xclip` (Linux), `pbcopy` (macOS), `clip` (Windows) for clipboard

## Integration

### NPM Script

Already configured in `package.json`:

```json
{
  "scripts": {
    "commit": "node tools/commit-helper.js"
  }
}
```

Usage: `npm run commit`

### Pre-commit Hook

You can integrate with Husky by creating `.husky/commit-msg` or adding a wrapper. However, the commit helper is meant to be used voluntarily before committing, not enforced by hooks.

## Validation Rules

| Rule | Description |
|------|-------------|
| Max 50 chars | Subject line length limited to 50 characters |
| Lowercase start | First character must be lowercase |
| No trailing period | Don't end subject with a period |
| Single line | Subject must be a single line (no line breaks) |
| Type required | Must be one of the Conventional Commits types |
| Optional scope | Parenthesized scope like `(api)` or `(contracts)` |

## Troubleshooting

### Clipboard not working

- **Linux**: Install xclip: `sudo apt-get install xclip` or `sudo yum install xclip`
- **macOS**: pbcopy is built-in
- **Windows**: clip is built-in

If clipboard fails, the message is printed so you can copy manually.

### No changes to commit

Stage files first:

```bash
git add <files>
# or
git add -A
```

Then run `npm run commit` again.

## Customization

To change the list of commit types, edit the `TYPES` array in the script.

Example: Add a `wip` type for work-in-progress commits:

```javascript
{ value: 'wip', emoji: '🚧', desc: 'Work in progress' }
```

Then add it to the appropriate position in the array.

## Why This Over the Old Bash Script?

- **Better UX**: Colors, emojis, clear prompts
- **Validation**: Immediate feedback on subject line format
- **More actions**: Copy, edit, cancel
- **Modern**: Node.js instead of bash (easier to extend)
- **Consistent**: Uses same conventions as other tools

## License

Part of clawdCombo – MIT licensed.

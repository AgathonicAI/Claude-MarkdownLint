---
name: lint-markdown
description: Check markdown files for style and formatting issues
allowed-tools:
  - mcp__plugin_markdownlint_markdownlint__lint_markdown
argument-hint: "[--scope changed|all] [--files file1.md file2.md]"
---

# Markdown Lint Command

Check markdown files for issues using markdownlint.

## Execution Steps

1. Parse any arguments provided from the user's command:
   - `--scope changed` (default): Lint files changed in git
   - `--scope all`: Lint all markdown files
   - `--files <paths>`: Lint specific files

   **Argument Parsing:**
   - If user says `/lint-markdown --scope all` → use `scope: "all"`
   - If user says `/lint-markdown --files README.md docs/guide.md` → use `files: ["README.md", "docs/guide.md"]`
   - If user says `/lint-markdown` with no args → use `scope: "changed"` (default)
   - The `--files` flag takes precedence over `--scope`

2. Call the `lint_markdown` MCP tool with the parsed parameters:
   - For scope: `{ "scope": "changed" }` or `{ "scope": "all" }`
   - For files: `{ "files": ["path1.md", "path2.md"] }`

3. Present results to the user:
   - If no issues: Report success briefly
   - If issues found: Show them grouped by file with line numbers and rule IDs
   - Mention how many are auto-fixable
   - Suggest running `/markdownlint:fix-markdown` if issues were found

## Example Output

When issues are found:

```text
Found 3 issues in 2 files:

**README.md**
- Line 12: MD022 - Headings should be surrounded by blank lines
- Line 45: MD031 - Fenced code blocks should be surrounded by blank lines

**docs/guide.md**
- Line 8: MD001 - Heading levels should only increment by one level at a time

2 issues are auto-fixable. Run `/markdownlint:fix-markdown` to fix them.
```

When no issues:

```text
All markdown files pass linting.
```

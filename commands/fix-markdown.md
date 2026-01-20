---
name: fix-markdown
description: Auto-fix markdown issues, with Claude assistance for non-fixable ones
allowed-tools:
  - mcp__plugin_markdownlint_markdownlint__fix_markdown
  - mcp__plugin_markdownlint_markdownlint__lint_markdown
  - mcp__plugin_markdownlint_markdownlint__decline_fix
  - Read
  - Edit
argument-hint: "[--auto-only] [--files file1.md file2.md]"
---

# Markdown Fix Command

Fix markdown issues using markdownlint auto-fix, then offer Claude-assisted fixes for remaining issues.

## Execution Steps

1. Parse any arguments provided:
   - `--auto-only`: Only apply markdownlint auto-fixes, don't offer Claude assistance
   - `--files <paths>`: Fix specific files (default: changed files in git)

2. Call the `fix_markdown` MCP tool with the parsed parameters

3. Report auto-fix results:
   - How many issues were auto-fixed
   - List any remaining issues

4. For remaining issues (unless `--auto-only`):
   - For each issue, offer to fix it manually
   - If user agrees: Read the file, apply the fix using Edit, then re-lint to verify
   - If user declines: Call `decline_fix` to remember their preference for this session
   - Group similar issues when possible (e.g., "Fix all MD022 issues in this file?")

## Claude-Assisted Fix Guidelines

When fixing issues manually:

- **MD001 (heading-increment)**: Adjust heading levels to increment by one
- **MD022 (blanks-around-headings)**: Add blank lines before/after headings
- **MD024 (no-duplicate-heading)**: Suggest alternative heading text
- **MD031 (blanks-around-fences)**: Add blank lines before/after code blocks
- **MD042 (no-empty-links)**: Ask user for link destination or remove link
- **MD047 (single-trailing-newline)**: Ensure file ends with exactly one newline

Always:

- Show the user what change you'll make before applying it
- Make minimal changes - only fix the specific issue
- Re-lint after fixing to verify the issue is resolved

## Example Interaction

```text
Auto-fixed 2 issues.

1 issue remaining:

**README.md:8** - MD001: Heading levels should only increment by one level at a time
  Current: ## Overview followed by #### Details

Would you like me to fix this? I'll change `#### Details` to `### Details`.

[User: yes]

Fixed. Re-running lint... All issues resolved.
```

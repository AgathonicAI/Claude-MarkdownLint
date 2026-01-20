---
name: Markdown Fixing
description: This skill should be used when the user needs help "fixing markdown issues", "repairing markdown lint errors", "resolving markdownlint violations", "MD001", "MD022", "MD024", "MD031", "MD042", "lint error", or when markdownlint/fix_markdown reports issues that cannot be auto-fixed. Provides guidance for manually fixing common markdown formatting and style issues.
version: 1.0.0
---

# Markdown Fixing Skill

Guidance for manually fixing markdown issues that markdownlint cannot auto-fix, ensuring consistent and readable markdown files.

## When This Skill Activates

This skill activates when:
- The `fix_markdown` MCP tool reports remaining issues after auto-fix
- A user asks for help fixing specific markdownlint violations
- Manual intervention is needed for issues markdownlint cannot automatically repair

## Core Fixing Principles

### Minimal Changes

Make only the changes necessary to fix the specific issue:
- Do not reformat surrounding content
- Do not "improve" unrelated sections
- Do not add or remove content beyond what's needed

### Verify After Fixing

After applying a fix:
1. Re-run `lint_markdown` on the affected file
2. Confirm the issue is resolved
3. Check that no new issues were introduced

### When Uncertain

If a fix is ambiguous or could break intended formatting:
- Show the user the current state
- Explain the issue and potential fixes
- Ask which approach they prefer

## Quick Fix Reference

| Rule | Issue | Fix |
|------|-------|-----|
| MD001 | Heading level skip | Adjust heading level to increment by one |
| MD022 | No blank around heading | Add blank line before/after heading |
| MD024 | Duplicate heading | Rename to be unique |
| MD031 | No blank around fence | Add blank line before/after code block |
| MD042 | Empty link | Add URL or remove link markup |
| MD047 | Missing trailing newline | Add single newline at end of file |

## Common Fix Patterns

### Heading Issues

**MD001 - Heading Increment**

Headings must increment by one level (h1 → h2 → h3, not h1 → h3).

Before:
```markdown
# Title
### Subsection  <!-- Error: skipped h2 -->
```

After:
```markdown
# Title
## Subsection  <!-- Fixed: now h2 -->
```

**MD022 - Blanks Around Headings**

Headings need blank lines before and after (except at document start).

Before:
```markdown
Some text.
## Heading
More text.
```

After:
```markdown
Some text.

## Heading

More text.
```

**MD024 - Duplicate Headings**

Same heading text appears multiple times. Fix by making each unique.

Before:
```markdown
## Setup
...
## Setup  <!-- Duplicate -->
```

After:
```markdown
## Setup
...
## Database Setup  <!-- Now unique -->
```

### Code Block Issues

**MD031 - Blanks Around Fences**

Code blocks need blank lines before and after.

Before:
```markdown
Some text:
\`\`\`javascript
code()
\`\`\`
More text.
```

After:
```markdown
Some text:

\`\`\`javascript
code()
\`\`\`

More text.
```

### Link Issues

**MD042 - Empty Links**

Links with no URL. Either add destination or remove link markup.

Before:
```markdown
Click [here]() for more.
```

After (option 1 - add URL):
```markdown
Click [here](https://example.com) for more.
```

After (option 2 - remove link):
```markdown
Click here for more.
```

### File Structure Issues

**MD047 - Single Trailing Newline**

File must end with exactly one newline character.

To fix: Ensure file ends with `\n` but not `\n\n`.

## Handling User Preferences

### When User Declines a Fix

If a user declines a suggested fix:
1. Call `decline_fix` MCP tool with file, line, and ruleId
2. The issue will be hidden from future lint results this session
3. Inform user: "I won't prompt about this issue again this session."

### Batch Fixing

When multiple similar issues exist, offer batch fixes:
- "Found 5 MD022 violations in README.md. Fix all of them?"
- If yes, apply all fixes in one edit operation
- Re-lint once after all fixes applied

## Workflow Integration

### After Auto-Fix Reports Remaining Issues

1. Review the remaining issues list
2. For each issue:
   - Identify the rule and location
   - Determine the appropriate fix
   - Show the user what will change
   - Apply if approved, or call `decline_fix` if declined
3. Re-lint to verify all issues resolved

### Proactive Hook Context

When activated by the PostToolUse hook after a markdown edit:
1. Issues found immediately after editing
2. Offer to fix: "Found 2 markdown issues. Want me to fix them?"
3. If yes, apply auto-fix first, then handle remaining manually
4. Be brief - user is focused on their edit, not linting

## Additional Resources

### Reference Files

For detailed information on all markdownlint rules:

- **`references/rules.md`** - Comprehensive guide to ~20 common rules, their purposes, and fix strategies

### MCP Tools Available

- `lint_markdown` - Check files for issues
- `fix_markdown` - Auto-fix and report remaining
- `decline_fix` - Mark issue as declined for session
- `get_declined_fixes` - See all declined issues
- `clear_declined_fixes` - Reset declined list

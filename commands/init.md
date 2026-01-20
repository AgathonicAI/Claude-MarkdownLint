---
name: init
description: Create a starter .markdownlint.jsonc configuration file
allowed-tools:
  - mcp__plugin_markdownlint_markdownlint__init_markdownlint_config
---

# Initialize Markdownlint Config Command

Create a starter `.markdownlint.jsonc` configuration file with sensible defaults.

## Execution Steps

1. Call the `init_markdownlint_config` MCP tool

2. Report the result:
   - If config was created: Show the path and briefly describe what rules are enabled/disabled
   - If config already exists: Inform the user and suggest they edit it manually

## Starter Config Explanation

The starter config:
- Enables most rules by default (`"default": true`)
- Disables commonly problematic rules:
  - **MD013** (line-length): Often impractical for prose
  - **MD033** (no-inline-html): Needed for badges, details tags, etc.
  - **MD041** (first-line-heading): Not always wanted

- Keeps strict rules that catch real issues:
  - **MD001** (heading-increment): No skipping h1 to h3
  - **MD012** (no-multiple-blanks): Max 1 blank line
  - **MD022** (blanks-around-headings): Readability
  - **MD031** (blanks-around-fences): Code block formatting
  - **MD047** (single-trailing-newline): File hygiene

## Example Output

```
Created .markdownlint.jsonc with starter configuration.

Rules configured:
- Disabled: MD013 (line length), MD033 (inline HTML), MD041 (first line heading)
- Enabled: All other rules with sensible defaults

Edit .markdownlint.jsonc to customize rules for your project.
```

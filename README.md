# claude-skill-markdownlint

A Claude Code plugin for linting and fixing markdown files using markdownlint.

## Features

- Lint markdown files for style and formatting issues
- Auto-fix issues that markdownlint can fix
- Claude-assisted fixes for issues that can't be auto-fixed
- Proactive linting after markdown edits
- Starter config generation

## Installation

```bash
claude plugins add github:username/claude-skill-markdownlint
```

## Usage

The plugin provides three tools:

### lint_markdown

Check markdown files for issues.

```
/markdownlint check
```

### fix_markdown

Fix markdown issues (auto-fix first, then Claude-assisted).

```
/markdownlint fix
```

### init_markdownlint_config

Create a starter `.markdownlint.jsonc` configuration.

```
/markdownlint init
```

## Configuration

Plugin behavior is configured in `.claude/plugins/markdownlint.json`:

```json
{
  "claude_assisted_fixes": "ask",
  "proactive_linting": true,
  "default_scope": "changed"
}
```

Linting rules are configured in `.markdownlint.jsonc` (standard markdownlint config).

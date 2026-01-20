# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

A Claude Code plugin that provides markdownlint capabilities - linting markdown files for style/format issues and automatically repairing them, with Claude-assisted fixes for issues that can't be auto-fixed.

## Commands

- `npm install` - Install dependencies
- `npm run build` - Compile TypeScript to dist/
- `npm run watch` - Compile in watch mode
- `npm test` - Run tests
- `npm run lint` - Lint markdown files in this repo

## Plugin Architecture

```
.claude-plugin/plugin.json  # Plugin manifest + MCP server config
commands/                   # Slash commands
  ├── lint-markdown.md     # /markdownlint:lint-markdown
  ├── fix-markdown.md      # /markdownlint:fix-markdown
  └── init-markdownlint.md # /markdownlint:init-markdownlint
skills/markdown-fixing/     # Claude-assisted fix guidance
  ├── SKILL.md
  └── references/rules.md
hooks/hooks.json            # SessionStart setup + PostToolUse auto-linting
```

## MCP Server Architecture

```
src/
├── server.ts             # MCP server entry point (stdio transport)
├── index.ts              # Tool exports
├── utils/
│   ├── exec.ts           # Safe command execution with execFile
│   ├── prerequisites.ts  # Node.js/npx availability checking
│   └── git.ts            # Git integration for changed files
├── core/
│   ├── linter.ts         # markdownlint-cli2 runner and output parser
│   ├── fixer.ts          # Auto-fix functionality
│   └── config.ts         # Config file detection and creation
└── tools/
    ├── lint-markdown.ts  # lint_markdown tool implementation
    ├── fix-markdown.ts   # fix_markdown tool implementation
    └── init-config.ts    # init_markdownlint_config tool implementation
```

## MCP Tools

- **lint_markdown** - Check markdown files for issues
- **fix_markdown** - Auto-fix issues, report remaining for Claude assistance
- **init_markdownlint_config** - Create starter .markdownlint.jsonc
- **decline_fix** - Mark issue as declined for session (won't re-prompt)
- **get_declined_fixes** - List all declined issues
- **clear_declined_fixes** - Reset declined list

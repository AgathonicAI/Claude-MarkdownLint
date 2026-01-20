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

## Architecture

```
src/
├── index.ts              # Plugin entry point, exports all tools
├── utils/
│   ├── exec.ts           # Safe command execution with execFile
│   ├── prerequisites.ts  # Node.js/npx availability checking
│   └── git.ts            # Git integration for changed files
├── core/
│   ├── linter.ts         # markdownlint-cli2 runner and output parser
│   ├── fixer.ts          # Auto-fix functionality
│   └── config.ts         # Config file detection and creation
└── tools/
    ├── lint-markdown.ts  # lint_markdown MCP tool
    ├── fix-markdown.ts   # fix_markdown MCP tool
    └── init-config.ts    # init_markdownlint_config MCP tool
```

## MCP Tools

- **lint_markdown** - Check markdown files for issues
- **fix_markdown** - Auto-fix issues, report remaining for Claude assistance
- **init_markdownlint_config** - Create starter .markdownlint.jsonc

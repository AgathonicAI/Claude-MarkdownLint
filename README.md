# Markdownlint Plugin for Claude Code

A Claude Code plugin for linting and fixing markdown files using markdownlint, with Claude-assisted fixes for issues that can't be auto-fixed.

## Features

- **Lint markdown files** for style and formatting issues
- **Auto-fix** issues that markdownlint can fix
- **Claude-assisted fixes** for issues that can't be auto-fixed
- **Proactive linting** - automatically lint after markdown edits
- **Session memory** - tracks declined fixes to avoid re-prompting
- **Starter config generation** for markdownlint

## Installation

```bash
claude plugins add AgathonicAI/claude-skill-markdownlint
```

### Prerequisites

- Node.js 18+ (for the MCP server)
- npx available in PATH

**Note:** Dependencies are installed and the MCP server is built automatically on first use via the SessionStart hook. No manual setup required.

## Commands

### `/markdownlint:lint-markdown`

Check markdown files for issues.

```bash
/markdownlint:lint-markdown                    # Lint changed files (git diff)
/markdownlint:lint-markdown --scope all        # Lint all markdown files
/markdownlint:lint-markdown --files README.md  # Lint specific files
```

### `/markdownlint:fix-markdown`

Fix markdown issues (auto-fix first, then Claude-assisted).

```bash
/markdownlint:fix-markdown                     # Fix changed files
/markdownlint:fix-markdown --auto-only         # Only apply auto-fixes
/markdownlint:fix-markdown --files docs/*.md   # Fix specific files
```

### `/markdownlint:init-markdownlint`

Create a starter `.markdownlint.jsonc` configuration.

```bash
/markdownlint:init-markdownlint
```

## Proactive Linting

The plugin automatically lints markdown files after you edit them. When issues are found, it will ask if you want them fixed.

To disable proactive linting, disable the plugin's hooks in your Claude Code settings.

## Configuration

### Markdownlint Rules

Linting rules are configured in `.markdownlint.jsonc` (standard markdownlint config).

Run `/markdownlint:init-markdownlint` to create a starter config with sensible defaults:

- Disabled: MD013 (line length), MD033 (inline HTML), MD041 (first line heading)
- Enabled: All other rules

### Customizing Rules

```jsonc
{
  "default": true,
  "MD013": false,           // Disable line length
  "MD012": { "maximum": 2 } // Allow 2 blank lines
}
```

## MCP Tools

The plugin provides an MCP server with these tools:

| Tool | Description |
|------|-------------|
| `lint_markdown` | Check files for issues |
| `fix_markdown` | Auto-fix and report remaining |
| `init_markdownlint_config` | Create starter config |
| `decline_fix` | Mark issue as declined for session |
| `get_declined_fixes` | List declined issues |
| `clear_declined_fixes` | Reset declined list |

## Troubleshooting

### MCP tools not available

If the `/markdownlint:lint-markdown` command says the MCP tool is unavailable:

1. **Restart Claude Code** - MCP servers are registered at startup. After installing the plugin, restart Claude Code.

2. **Check plugin installation** - Run `claude plugins list` to verify the plugin is installed.

3. **Manual server test** - Test the MCP server directly:

   ```bash
   echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node ~/.claude/plugins/cache/AgathonicAI-claude-skill-markdownlint/dist/server.js
   ```

4. **Check build** - Ensure the server was built. The SessionStart hook should build it automatically, but you can run `npm run build` in the plugin directory.

### Commands work but MCP tools don't

The commands can still work without MCP by using `npx markdownlint-cli2` directly, but the full MCP integration requires the server to be running. The MCP server provides:

- Structured JSON responses for issue tracking
- Session state for declined fixes
- Proper tool integration with Claude Code

## Architecture

```text
markdownlint/
├── .claude-plugin/plugin.json  # Plugin manifest + MCP server config
├── commands/                   # Slash commands
├── skills/markdown-fixing/     # Claude-assisted fix guidance
├── hooks/hooks.json            # SessionStart setup + PostToolUse auto-linting
└── src/                        # MCP server (TypeScript)
```

## License

MIT

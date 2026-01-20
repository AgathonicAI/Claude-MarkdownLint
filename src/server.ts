#!/usr/bin/env node
// src/server.ts - MCP Server for markdownlint plugin

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { lintMarkdownTool } from './tools/lint-markdown.js';
import { fixMarkdownTool } from './tools/fix-markdown.js';
import { initConfigTool } from './tools/init-config.js';

// Session state for tracking declined fixes
// Key format: "file:line:ruleId"
const declinedFixes = new Set<string>();

function makeDeclinedKey(file: string, line: number, ruleId: string): string {
  return `${file}:${line}:${ruleId}`;
}

// Create the MCP server
const server = new Server(
  {
    name: 'markdownlint',
    version: '1.0.1',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'lint_markdown',
        description:
          'Check markdown files for style and formatting issues using markdownlint. Returns structured list of issues with file, line, rule ID, and whether each is auto-fixable.',
        inputSchema: {
          type: 'object',
          properties: {
            files: {
              type: 'array',
              items: { type: 'string' },
              description:
                'Array of file paths to lint. If empty, lints changed files (git diff).',
            },
            scope: {
              type: 'string',
              enum: ['changed', 'all', 'file'],
              description:
                'Scope of files to lint: "changed" (git diff), "all" (all .md files), or "file" (specific files). Defaults to "changed".',
            },
          },
        },
      },
      {
        name: 'fix_markdown',
        description:
          'Auto-fix markdown issues using markdownlint --fix. Returns count of fixed issues and any remaining issues that need manual/Claude-assisted fixing.',
        inputSchema: {
          type: 'object',
          properties: {
            files: {
              type: 'array',
              items: { type: 'string' },
              description:
                'Array of file paths to fix. If empty, fixes changed files (git diff).',
            },
            auto_only: {
              type: 'boolean',
              description:
                'If true, only apply auto-fixes. If false (default), remaining issues are flagged for Claude-assisted fixing.',
            },
          },
        },
      },
      {
        name: 'init_markdownlint_config',
        description:
          'Create a starter .markdownlint.jsonc configuration file with sensible defaults. Will not overwrite existing config.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'decline_fix',
        description:
          'Mark a specific issue as declined for this session. The plugin will not prompt about this issue again until the session ends.',
        inputSchema: {
          type: 'object',
          properties: {
            file: {
              type: 'string',
              description: 'File path of the issue',
            },
            line: {
              type: 'number',
              description: 'Line number of the issue',
            },
            ruleId: {
              type: 'string',
              description: 'Rule ID (e.g., MD001, MD022)',
            },
          },
          required: ['file', 'line', 'ruleId'],
        },
      },
      {
        name: 'get_declined_fixes',
        description:
          'Get list of issues that have been declined this session.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'clear_declined_fixes',
        description: 'Clear all declined fixes, re-enabling prompts for them.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'lint_markdown': {
        const result = await lintMarkdownTool({
          files: args?.files as string[] | undefined,
          scope: args?.scope as 'changed' | 'all' | 'file' | undefined,
        });

        // Filter out declined issues from the response
        const filteredIssues = result.issues.filter((issue) => {
          const key = makeDeclinedKey(issue.file, issue.line, issue.ruleId);
          return !declinedFixes.has(key);
        });

        const declinedCount = result.issues.length - filteredIssues.length;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  ...result,
                  issues: filteredIssues,
                  totalIssues: result.issues.length,
                  declinedIssuesHidden: declinedCount,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'fix_markdown': {
        const result = await fixMarkdownTool({
          files: args?.files as string[] | undefined,
          auto_only: args?.auto_only as boolean | undefined,
        });

        // Filter out declined issues from remaining issues
        const filteredRemaining = result.remainingIssues.filter((issue) => {
          const key = makeDeclinedKey(issue.file, issue.line, issue.ruleId);
          return !declinedFixes.has(key);
        });

        const declinedCount =
          result.remainingIssues.length - filteredRemaining.length;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  ...result,
                  remainingIssues: filteredRemaining,
                  totalRemainingIssues: result.remainingIssues.length,
                  declinedIssuesHidden: declinedCount,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'init_markdownlint_config': {
        const result = await initConfigTool();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'decline_fix': {
        const file = args?.file as string;
        const line = args?.line as number;
        const ruleId = args?.ruleId as string;

        if (!file || !line || !ruleId) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: 'Missing required parameters: file, line, ruleId',
                }),
              },
            ],
          };
        }

        const key = makeDeclinedKey(file, line, ruleId);
        declinedFixes.add(key);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Declined fix for ${ruleId} at ${file}:${line}. Will not prompt again this session.`,
                declinedCount: declinedFixes.size,
              }),
            },
          ],
        };
      }

      case 'get_declined_fixes': {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                declinedFixes: Array.from(declinedFixes),
                count: declinedFixes.size,
              }),
            },
          ],
        };
      }

      case 'clear_declined_fixes': {
        const previousCount = declinedFixes.size;
        declinedFixes.clear();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Cleared ${previousCount} declined fixes. All issues will be shown again.`,
              }),
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: `Unknown tool: ${name}`,
              }),
            },
          ],
        };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: errorMessage,
          }),
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Markdownlint MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});

// src/index.ts
export { lintMarkdownTool } from './tools/lint-markdown.js';
export type {
  LintMarkdownParams,
  LintMarkdownResult,
} from './tools/lint-markdown.js';

export { fixMarkdownTool } from './tools/fix-markdown.js';
export type {
  FixMarkdownParams,
  FixMarkdownResult,
} from './tools/fix-markdown.js';

export { initConfigTool } from './tools/init-config.js';
export type {
  InitConfigParams,
  InitConfigToolResult,
} from './tools/init-config.js';

// Re-export types that may be useful
export type { LintIssue, LintResult } from './core/linter.js';
export type { FixResult } from './core/fixer.js';

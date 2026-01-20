// src/core/linter.ts
import { execCommand } from '../utils/exec.js';
import { checkPrerequisites } from '../utils/prerequisites.js';

// Rules that markdownlint-cli2 can auto-fix with --fix
const AUTO_FIXABLE_RULES = new Set([
  'MD003', 'MD004', 'MD005', 'MD007', 'MD009', 'MD010',
  'MD012', 'MD022', 'MD023', 'MD027', 'MD030', 'MD031',
  'MD032', 'MD034', 'MD037', 'MD038', 'MD039', 'MD044',
  'MD047', 'MD049', 'MD050', 'MD051', 'MD053', 'MD054',
]);

export interface LintIssue {
  file: string;
  line: number;
  column: number;
  ruleId: string;
  ruleDescription: string;
  message: string;
  fixable: boolean;
}

export interface LintResult {
  success: boolean;
  issues: LintIssue[];
  error?: string;
}

export async function runMarkdownlint(files: string[]): Promise<LintResult> {
  // Check prerequisites first
  const prereq = await checkPrerequisites();
  if (!prereq.success) {
    return {
      success: false,
      issues: [],
      error: prereq.error?.message,
    };
  }

  if (files.length === 0) {
    return { success: true, issues: [] };
  }

  // Run markdownlint-cli2 with a 60-second timeout to prevent hanging
  const result = await execCommand('npx', ['markdownlint-cli2', ...files], {
    timeout: 60000,
  });

  // Exit code 0 = no issues, 1 = issues found, other = error
  if (result.exitCode === 0) {
    return { success: true, issues: [] };
  }

  // Parse text output - markdownlint-cli2 outputs errors to stderr
  // Combine both stdout and stderr to ensure we capture all output
  const output = result.stderr + '\n' + result.stdout;
  const issues = parseMarkdownlintOutput(output);

  if (issues.length > 0) {
    return {
      success: false,
      issues,
    };
  }

  // If no issues were parsed but exit code was non-zero, report as error
  return {
    success: false,
    issues: [],
    error: result.stderr || result.stdout || 'Unknown markdownlint error',
  };
}

/**
 * Parse markdownlint-cli2 text output
 * Format: filepath:line ruleId/ruleName description [details]
 * Example: test.md:3 MD012/no-multiple-blanks Multiple consecutive blank lines [Expected: 1; Actual: 2]
 */
function parseMarkdownlintOutput(output: string): LintIssue[] {
  const issues: LintIssue[] = [];

  // Match lines like: file.md:123 MD001/heading-increment description [details]
  // Also handle file.md:123:45 format with column
  const issueRegex =
    /^(.+?):(\d+)(?::(\d+))?\s+(MD\d+)\/(\S+)\s+(.+?)(?:\s+\[(.+)\])?$/gm;

  let match;
  while ((match = issueRegex.exec(output)) !== null) {
    const [, file, lineStr, colStr, ruleId, ruleName, description, details] =
      match;
    issues.push({
      file,
      line: parseInt(lineStr, 10),
      column: colStr ? parseInt(colStr, 10) : 1,
      ruleId,
      ruleDescription: `${ruleName}: ${description}`,
      message: details || description,
      fixable: AUTO_FIXABLE_RULES.has(ruleId),
    });
  }

  return issues;
}

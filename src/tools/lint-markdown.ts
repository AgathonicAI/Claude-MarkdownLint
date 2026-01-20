// src/tools/lint-markdown.ts
import { runMarkdownlint, LintIssue } from '../core/linter.js';
import { getChangedMarkdownFiles, getAllMarkdownFiles } from '../utils/git.js';

export interface LintMarkdownParams {
  files?: string[];
  scope?: 'changed' | 'all' | 'file';
}

export interface LintMarkdownResult {
  success: boolean;
  issues: LintIssue[];
  summary: string;
  autoFixableCount: number;
  error?: string;
}

export async function lintMarkdownTool(
  params: LintMarkdownParams = {}
): Promise<LintMarkdownResult> {
  const { files, scope = 'changed' } = params;

  // Determine which files to lint
  let filesToLint: string[];

  if (files && files.length > 0) {
    filesToLint = files;
  } else if (scope === 'changed') {
    filesToLint = await getChangedMarkdownFiles();
  } else {
    // scope === 'all'
    filesToLint = await getAllMarkdownFiles();
  }

  if (filesToLint.length === 0) {
    return {
      success: true,
      issues: [],
      summary: 'No markdown files to check.',
      autoFixableCount: 0,
    };
  }

  const result = await runMarkdownlint(filesToLint);

  if (result.error) {
    return {
      success: false,
      issues: [],
      summary: result.error,
      autoFixableCount: 0,
      error: result.error,
    };
  }

  const autoFixableCount = result.issues.filter((i) => i.fixable).length;
  const summary = formatSummary(result.issues, autoFixableCount);

  return {
    success: result.success,
    issues: result.issues,
    summary,
    autoFixableCount,
  };
}

function formatSummary(issues: LintIssue[], autoFixableCount: number): string {
  if (issues.length === 0) {
    return 'All markdown files pass linting.';
  }

  const fileCount = new Set(issues.map((i) => i.file)).size;
  const lines = [
    `Found ${issues.length} issue${issues.length === 1 ? '' : 's'} in ${fileCount} file${fileCount === 1 ? '' : 's'}:`,
    '',
  ];

  // Group by file
  const byFile = new Map<string, LintIssue[]>();
  for (const issue of issues) {
    const existing = byFile.get(issue.file) || [];
    existing.push(issue);
    byFile.set(issue.file, existing);
  }

  for (const [file, fileIssues] of byFile) {
    lines.push(`**${file}**`);
    for (const issue of fileIssues) {
      lines.push(`- Line ${issue.line}: ${issue.ruleId} - ${issue.message}`);
    }
    lines.push('');
  }

  if (autoFixableCount > 0) {
    lines.push(
      `${autoFixableCount} issue${autoFixableCount === 1 ? ' is' : 's are'} auto-fixable.`
    );
  }

  return lines.join('\n');
}

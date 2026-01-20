// src/tools/fix-markdown.ts
import { autoFix } from '../core/fixer.js';
import { getChangedMarkdownFiles } from '../utils/git.js';
import { LintIssue } from '../core/linter.js';

export interface FixMarkdownParams {
  files?: string[];
  auto_only?: boolean;
}

export interface FixMarkdownResult {
  success: boolean;
  fixedCount: number;
  remainingIssues: LintIssue[];
  summary: string;
  claudeFixAvailable: boolean;
  error?: string;
}

export async function fixMarkdownTool(
  params: FixMarkdownParams = {}
): Promise<FixMarkdownResult> {
  const { files, auto_only = false } = params;

  // Determine which files to fix
  let filesToFix: string[];

  if (files && files.length > 0) {
    filesToFix = files;
  } else {
    filesToFix = await getChangedMarkdownFiles();
  }

  if (filesToFix.length === 0) {
    return {
      success: true,
      fixedCount: 0,
      remainingIssues: [],
      summary: 'No markdown files to fix.',
      claudeFixAvailable: false,
    };
  }

  const result = await autoFix(filesToFix);

  if (result.error) {
    return {
      success: false,
      fixedCount: 0,
      remainingIssues: [],
      summary: result.error,
      claudeFixAvailable: false,
      error: result.error,
    };
  }

  const claudeFixAvailable =
    !auto_only && result.remainingIssues.length > 0;

  const summary = formatFixSummary(
    result.fixedCount,
    result.remainingIssues,
    claudeFixAvailable
  );

  return {
    success: true,
    fixedCount: result.fixedCount,
    remainingIssues: result.remainingIssues,
    summary,
    claudeFixAvailable,
  };
}

function formatFixSummary(
  fixedCount: number,
  remainingIssues: LintIssue[],
  claudeFixAvailable: boolean
): string {
  const lines: string[] = [];

  if (fixedCount > 0) {
    lines.push(
      `Auto-fixed ${fixedCount} issue${fixedCount === 1 ? '' : 's'}.`
    );
  }

  if (remainingIssues.length === 0) {
    lines.push('All markdown files now pass linting.');
  } else {
    lines.push('');
    lines.push(
      `${remainingIssues.length} issue${remainingIssues.length === 1 ? '' : 's'} remaining:`
    );

    for (const issue of remainingIssues) {
      lines.push(
        `- ${issue.file}:${issue.line}: ${issue.ruleId} - ${issue.message}`
      );
    }

    if (claudeFixAvailable) {
      lines.push('');
      lines.push(
        'Autofix is not available for these issues, but I can fix them myself. Would you like that?'
      );
    }
  }

  return lines.join('\n');
}

// src/core/fixer.ts
import { execCommand } from '../utils/exec.js';
import { checkPrerequisites } from '../utils/prerequisites.js';
import { runMarkdownlint, LintIssue } from './linter.js';

export interface FixResult {
  success: boolean;
  fixedCount: number;
  remainingIssues: LintIssue[];
  error?: string;
}

export async function autoFix(files: string[]): Promise<FixResult> {
  // Check prerequisites first
  const prereq = await checkPrerequisites();
  if (!prereq.success) {
    return {
      success: false,
      fixedCount: 0,
      remainingIssues: [],
      error: prereq.error?.message,
    };
  }

  if (files.length === 0) {
    return { success: true, fixedCount: 0, remainingIssues: [] };
  }

  // Get issues before fix
  const beforeResult = await runMarkdownlint(files);
  const beforeCount = beforeResult.issues.length;

  // Run markdownlint-cli2 with --fix (60-second timeout)
  await execCommand('npx', ['markdownlint-cli2', '--fix', ...files], {
    timeout: 60000,
  });

  // Re-lint to see what remains
  const afterResult = await runMarkdownlint(files);
  const fixedCount = beforeCount - afterResult.issues.length;

  return {
    success: true,
    fixedCount,
    remainingIssues: afterResult.issues,
  };
}

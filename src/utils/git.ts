// src/utils/git.ts
import { readdir } from 'node:fs/promises';
import { execCommand } from './exec.js';

export async function isGitRepo(): Promise<boolean> {
  const result = await execCommand('git', ['rev-parse', '--git-dir']);
  return result.exitCode === 0;
}

export async function getChangedMarkdownFiles(): Promise<string[]> {
  const inRepo = await isGitRepo();

  if (!inRepo) {
    // Fall back to all markdown files if not in a git repo
    return getAllMarkdownFiles();
  }

  // Get staged and unstaged changed files
  const staged = await execCommand('git', [
    'diff',
    '--name-only',
    '--diff-filter=ACMR',
    '--cached',
  ]);

  const unstaged = await execCommand('git', [
    'diff',
    '--name-only',
    '--diff-filter=ACMR',
  ]);

  // Get untracked files
  const untracked = await execCommand('git', [
    'ls-files',
    '--others',
    '--exclude-standard',
  ]);

  const allFiles = [
    ...staged.stdout.split('\n'),
    ...unstaged.stdout.split('\n'),
    ...untracked.stdout.split('\n'),
  ];

  // Filter to .md files and remove duplicates/empty
  const mdFiles = [...new Set(allFiles)]
    .filter((f) => f.endsWith('.md') && f.length > 0);

  return mdFiles;
}

async function getAllMarkdownFiles(): Promise<string[]> {
  // Use Node.js fs APIs for cross-platform compatibility (no Unix find command)
  const files = await readdir('.', { recursive: true });

  return files
    .filter(
      (f) =>
        f.endsWith('.md') &&
        !f.startsWith('node_modules') &&
        !f.includes('/node_modules/') &&
        !f.includes('\\node_modules\\')
    )
    .map((f) => f.replace(/\\/g, '/')); // Normalize path separators
}

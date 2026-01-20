// src/utils/git.ts
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
  const result = await execCommand('find', [
    '.',
    '-name',
    '*.md',
    '-not',
    '-path',
    './node_modules/*',
  ]);

  return result.stdout
    .split('\n')
    .filter((f) => f.length > 0)
    .map((f) => f.replace(/^\.\//, ''));
}

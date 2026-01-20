// src/utils/git.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getChangedMarkdownFiles, isGitRepo } from './git.js';

describe('isGitRepo', () => {
  it('should return true when in a git repository', async () => {
    // This test runs inside the plugin repo which is a git repo
    const result = await isGitRepo();
    assert.strictEqual(result, true);
  });
});

describe('getChangedMarkdownFiles', () => {
  it('should return an array', async () => {
    const files = await getChangedMarkdownFiles();
    assert.ok(Array.isArray(files));
  });

  it('should only include .md files', async () => {
    const files = await getChangedMarkdownFiles();
    for (const file of files) {
      assert.ok(file.endsWith('.md'), `Expected .md file, got: ${file}`);
    }
  });
});

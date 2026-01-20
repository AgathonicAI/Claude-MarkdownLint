// src/utils/git.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getChangedMarkdownFiles, getAllMarkdownFiles, isGitRepo } from './git.js';

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

describe('getAllMarkdownFiles', () => {
  it('should return an array of markdown files', async () => {
    const files = await getAllMarkdownFiles();
    assert.ok(Array.isArray(files));
    assert.ok(files.length > 0, 'Should find at least one markdown file');
  });

  it('should only include .md files', async () => {
    const files = await getAllMarkdownFiles();
    for (const file of files) {
      assert.ok(file.endsWith('.md'), `Expected .md file, got: ${file}`);
    }
  });

  it('should exclude node_modules', async () => {
    const files = await getAllMarkdownFiles();
    for (const file of files) {
      assert.ok(!file.includes('node_modules'), `Should exclude node_modules: ${file}`);
    }
  });

  it('should exclude dist directory', async () => {
    const files = await getAllMarkdownFiles();
    for (const file of files) {
      assert.ok(!file.startsWith('dist/') && !file.includes('/dist/'), `Should exclude dist: ${file}`);
    }
  });
});

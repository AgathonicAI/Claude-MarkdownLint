// src/tools/lint-markdown.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { lintMarkdownTool } from './lint-markdown.js';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';

describe('lintMarkdownTool', () => {
  const testDir = `./test-fixtures-lint-${process.pid}-${Date.now()}`;
  const testFile = `${testDir}/test.md`;

  const setup = () => {
    mkdirSync(testDir, { recursive: true });
  };

  const teardown = () => {
    rmSync(testDir, { recursive: true, force: true });
  };

  it('should return structured result with issues', async () => {
    setup();
    try {
      writeFileSync(testFile, '# Heading\n\n\n\nContent\n');
      const result = await lintMarkdownTool({ files: [testFile] });

      assert.ok('success' in result);
      assert.ok('issues' in result);
      assert.ok('summary' in result);
    } finally {
      teardown();
    }
  });

  it('should respect scope parameter', async () => {
    setup();
    try {
      writeFileSync(testFile, '# Valid\n\nContent\n');
      const result = await lintMarkdownTool({
        files: [testFile],
        scope: 'file',
      });

      assert.strictEqual(result.success, true);
    } finally {
      teardown();
    }
  });
});

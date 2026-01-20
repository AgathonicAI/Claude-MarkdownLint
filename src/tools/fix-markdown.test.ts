// src/tools/fix-markdown.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { fixMarkdownTool } from './fix-markdown.js';
import { writeFileSync, readFileSync, mkdirSync, rmSync } from 'node:fs';

describe('fixMarkdownTool', () => {
  const testDir = './test-fixtures';
  const testFile = `${testDir}/fixme.md`;

  const setup = () => {
    mkdirSync(testDir, { recursive: true });
  };

  const teardown = () => {
    rmSync(testDir, { recursive: true, force: true });
  };

  it('should fix issues and return summary', async () => {
    setup();
    try {
      writeFileSync(testFile, '# Heading   \n\nContent\n');
      const result = await fixMarkdownTool({ files: [testFile] });

      assert.ok('success' in result);
      assert.ok('fixedCount' in result);
      assert.ok('remainingIssues' in result);
      assert.ok('summary' in result);
    } finally {
      teardown();
    }
  });

  it('should support auto_only mode', async () => {
    setup();
    try {
      writeFileSync(testFile, '# Heading\n\n### Skipped\n');
      const result = await fixMarkdownTool({
        files: [testFile],
        auto_only: true,
      });

      // Should not attempt Claude fixes in auto_only mode
      assert.ok(result.remainingIssues.length > 0);
    } finally {
      teardown();
    }
  });
});

// src/core/linter.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { runMarkdownlint, LintResult } from './linter.js';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';

describe('runMarkdownlint', () => {
  const testDir = './test-fixtures';
  const testFile = `${testDir}/test.md`;

  // Setup and teardown
  const setup = () => {
    mkdirSync(testDir, { recursive: true });
  };

  const teardown = () => {
    rmSync(testDir, { recursive: true, force: true });
  };

  it('should return no issues for valid markdown', async () => {
    setup();
    try {
      writeFileSync(testFile, '# Valid Heading\n\nSome content.\n');
      const result = await runMarkdownlint([testFile]);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.issues.length, 0);
    } finally {
      teardown();
    }
  });

  it('should detect issues in invalid markdown', async () => {
    setup();
    try {
      // Multiple blank lines violates MD012
      writeFileSync(testFile, '# Heading\n\n\n\nContent\n');
      const result = await runMarkdownlint([testFile]);
      assert.strictEqual(result.success, false);
      assert.ok(result.issues.length > 0);
      assert.ok(result.issues[0].ruleId);
      assert.ok(result.issues[0].line);
    } finally {
      teardown();
    }
  });
});

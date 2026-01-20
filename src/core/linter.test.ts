// src/core/linter.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { runMarkdownlint } from './linter.js';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';

describe('runMarkdownlint', () => {
  // Create fresh directory paths per test run to avoid collisions
  let testDir: string;
  let testFile: string;

  // Setup and teardown
  const setup = () => {
    testDir = `./test-fixtures-linter-${process.pid}-${Date.now()}`;
    testFile = `${testDir}/test.md`;
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

// src/core/fixer.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { autoFix, FixResult } from './fixer.js';
import { writeFileSync, readFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

describe('autoFix', () => {
  const testDir = './test-fixtures-fixer';

  const setup = () => {
    mkdirSync(testDir, { recursive: true });
  };

  const teardown = () => {
    rmSync(testDir, { recursive: true, force: true });
  };

  it('should fix auto-fixable issues', async () => {
    setup();
    const testFile = join(testDir, 'fixable.md');
    try {
      // Trailing spaces are auto-fixable (MD009)
      writeFileSync(testFile, '# Heading   \n\nContent\n');
      const result = await autoFix([testFile]);
      assert.strictEqual(result.success, true);

      // Verify file was modified
      const content = readFileSync(testFile, 'utf-8');
      assert.ok(!content.includes('   \n'), 'Trailing spaces should be removed');
    } finally {
      teardown();
    }
  });

  it('should return remaining issues after fix', async () => {
    setup();
    const testFile = join(testDir, 'unfixable.md');
    try {
      // MD001 (heading increment) is not auto-fixable
      writeFileSync(testFile, '# Heading\n\n### Skipped Level\n');
      const result = await autoFix([testFile]);

      // Should still have the non-fixable issue
      assert.ok(result.remainingIssues.length > 0);
    } finally {
      teardown();
    }
  });
});

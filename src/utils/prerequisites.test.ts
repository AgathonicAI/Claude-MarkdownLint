// src/utils/prerequisites.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { checkPrerequisites, PrerequisiteError } from './prerequisites.js';

describe('checkPrerequisites', () => {
  it('should return success when npx is available', async () => {
    const result = await checkPrerequisites();
    // npx should be available in test environment
    assert.strictEqual(result.success, true);
    assert.ok(result.npxVersion);
  });

  it('should include installation guidance in error', async () => {
    // This tests the error message format
    const error = new PrerequisiteError('npx');
    assert.ok(error.message.includes('Node.js'));
    assert.ok(error.installationGuide.includes('nodejs.org'));
  });
});

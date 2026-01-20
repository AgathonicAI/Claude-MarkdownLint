// src/tools/init-config.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { initConfigTool } from './init-config.js';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';

describe('initConfigTool', () => {
  const testDir = `./test-fixtures-init-tool-${process.pid}-${Date.now()}`;

  const setup = () => {
    mkdirSync(testDir, { recursive: true });
  };

  const teardown = () => {
    rmSync(testDir, { recursive: true, force: true });
  };

  it('should create config and return success', async () => {
    setup();
    try {
      const result = await initConfigTool({ directory: testDir });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.created, true);
      assert.ok(existsSync(result.path));
    } finally {
      teardown();
    }
  });

  it('should report existing config', async () => {
    setup();
    try {
      writeFileSync(`${testDir}/.markdownlint.json`, '{}');
      const result = await initConfigTool({ directory: testDir });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.created, false);
      assert.ok(result.message.includes('already exists'));
    } finally {
      teardown();
    }
  });
});

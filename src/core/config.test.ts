// src/core/config.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { initConfig, findExistingConfig, STARTER_CONFIG } from './config.js';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';

describe('findExistingConfig', () => {
  const testDir = './test-fixtures';

  const setup = () => {
    mkdirSync(testDir, { recursive: true });
  };

  const teardown = () => {
    rmSync(testDir, { recursive: true, force: true });
  };

  it('should return null when no config exists', async () => {
    setup();
    try {
      const result = await findExistingConfig(testDir);
      assert.strictEqual(result, null);
    } finally {
      teardown();
    }
  });

  it('should find .markdownlint.jsonc', async () => {
    setup();
    try {
      writeFileSync(`${testDir}/.markdownlint.jsonc`, '{}');
      const result = await findExistingConfig(testDir);
      assert.ok(result?.includes('.markdownlint.jsonc'));
    } finally {
      teardown();
    }
  });
});

describe('initConfig', () => {
  const testDir = './test-fixtures';

  const setup = () => {
    mkdirSync(testDir, { recursive: true });
  };

  const teardown = () => {
    rmSync(testDir, { recursive: true, force: true });
  };

  it('should create config when none exists', async () => {
    setup();
    try {
      const result = await initConfig(testDir);
      assert.strictEqual(result.created, true);
      assert.ok(existsSync(result.path));
    } finally {
      teardown();
    }
  });

  it('should not overwrite existing config', async () => {
    setup();
    try {
      writeFileSync(`${testDir}/.markdownlint.jsonc`, '{"custom": true}');
      const result = await initConfig(testDir);
      assert.strictEqual(result.created, false);
      assert.ok(result.existingPath);
    } finally {
      teardown();
    }
  });
});

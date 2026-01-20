// src/utils/exec.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { execCommand } from './exec.js';

describe('execCommand', () => {
  it('should execute a command and return stdout', async () => {
    const result = await execCommand('echo', ['hello']);
    assert.strictEqual(result.stdout.trim(), 'hello');
    assert.strictEqual(result.exitCode, 0);
  });

  it('should return exitCode for failed commands', async () => {
    const result = await execCommand('node', ['-e', 'process.exit(1)']);
    assert.strictEqual(result.exitCode, 1);
  });

  it('should capture stderr', async () => {
    const result = await execCommand('node', ['-e', 'console.error("oops")']);
    assert.ok(result.stderr.includes('oops'));
  });

  it('should return exitCode 127 for non-existent command', async () => {
    const result = await execCommand('nonexistent-command-xyz', []);
    assert.strictEqual(result.exitCode, 127);
  });
});

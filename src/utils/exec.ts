// src/utils/exec.ts
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface ExecOptions {
  timeout?: number; // milliseconds
}

export async function execCommand(
  command: string,
  args: string[],
  options: ExecOptions = {}
): Promise<ExecResult> {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      timeout: options.timeout,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
    });
    return { stdout, stderr, exitCode: 0 };
  } catch (error: unknown) {
    const execError = error as { stdout?: unknown; stderr?: unknown; code?: unknown };

    const stdout =
      typeof execError.stdout === 'string' ? execError.stdout : '';
    const stderr =
      typeof execError.stderr === 'string' ? execError.stderr : '';

    let exitCode = 127;
    const code = execError.code;
    if (typeof code === 'number' && Number.isFinite(code)) {
      exitCode = code;
    }

    return { stdout, stderr, exitCode };
  }
}

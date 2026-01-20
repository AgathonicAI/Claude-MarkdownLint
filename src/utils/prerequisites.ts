// src/utils/prerequisites.ts
import { execCommand } from './exec.js';

export class PrerequisiteError extends Error {
  public readonly installationGuide: string;

  constructor(missing: 'npx' | 'node') {
    const guide = `
To use this plugin, you need Node.js installed:
- Download from https://nodejs.org/
- Or use a version manager like nvm: https://github.com/nvm-sh/nvm
- macOS: brew install node
- Ubuntu/Debian: apt install nodejs npm
- Windows: Download installer from nodejs.org
    `.trim();

    super(`${missing} is not available. ${guide}`);
    this.name = 'PrerequisiteError';
    this.installationGuide = guide;
  }
}

export interface PrerequisiteResult {
  success: boolean;
  npxVersion?: string;
  error?: PrerequisiteError;
}

export async function checkPrerequisites(): Promise<PrerequisiteResult> {
  const result = await execCommand('npx', ['--version']);

  if (result.exitCode !== 0) {
    return {
      success: false,
      error: new PrerequisiteError('npx'),
    };
  }

  return {
    success: true,
    npxVersion: result.stdout.trim(),
  };
}

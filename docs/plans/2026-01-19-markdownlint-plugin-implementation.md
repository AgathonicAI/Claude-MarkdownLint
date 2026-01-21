# Markdownlint Plugin Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Claude Code plugin that lints markdown files, auto-fixes issues, and provides Claude-assisted fixes for non-auto-fixable problems.

**Architecture:** MCP-based plugin exposing three tools (lint_markdown, fix_markdown, init_markdownlint_config) with a post-edit hook for proactive linting. Uses markdownlint-cli2 under the hood with execFile for security.

**Tech Stack:** TypeScript, Node.js, markdownlint-cli2, MCP SDK

---

## Task 1: Project Setup

**Files:**

- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`

### Step 1: Create package.json

```json
{
  "name": "claude-markdownlint-plugin",
  "version": "1.0.0",
  "description": "Claude Code plugin for linting and fixing markdown files",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch",
    "test": "node --test dist/**/*.test.js",
    "lint": "npx markdownlint-cli2 '**/*.md' '#node_modules'"
  },
  "dependencies": {
    "@anthropic-ai/claude-code-sdk": "^0.1.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "markdownlint-cli2": "^0.13.0"
  }
}
```

### Step 2: Create tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 3: Create .gitignore

```text
node_modules/
dist/
*.log
.DS_Store
```

### Step 4: Install dependencies

Run: `npm install`
Expected: node_modules created, package-lock.json generated

### Step 5: Commit

```bash
git add package.json tsconfig.json .gitignore package-lock.json
git commit -m "chore: initialize project with TypeScript and dependencies"
```

---

## Task 2: Plugin Manifest

**Files:**

- Create: `plugin.json`

### Step 1: Create plugin.json

```json
{
  "name": "markdownlint",
  "description": "Lint and fix markdown files with Claude-assisted repairs",
  "version": "1.0.0",
  "main": "dist/index.js",
  "tools": [
    {
      "name": "lint_markdown",
      "description": "Check markdown files for style and formatting issues"
    },
    {
      "name": "fix_markdown",
      "description": "Fix markdown linting issues (auto-fix and Claude-assisted)"
    },
    {
      "name": "init_markdownlint_config",
      "description": "Create a starter .markdownlint.jsonc configuration file"
    }
  ]
}
```

### Step 2: Commit

```bash
git add plugin.json
git commit -m "chore: add plugin manifest"
```

---

## Task 3: Utility - Command Execution

**Files:**

- Create: `src/utils/exec.ts`
- Create: `src/utils/exec.test.ts`

### Step 1: Write the failing test for execCommand

```typescript
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
});
```

### Step 2: Run test to verify it fails

Run: `npm run build && npm test`
Expected: FAIL with "Cannot find module './exec.js'"

### Step 3: Write minimal implementation

```typescript
// src/utils/exec.ts
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function execCommand(
  command: string,
  args: string[]
): Promise<ExecResult> {
  try {
    const { stdout, stderr } = await execFileAsync(command, args);
    return { stdout, stderr, exitCode: 0 };
  } catch (error: unknown) {
    const execError = error as { stdout?: string; stderr?: string; code?: number };
    return {
      stdout: execError.stdout ?? '',
      stderr: execError.stderr ?? '',
      exitCode: execError.code ?? 1,
    };
  }
}
```

### Step 4: Run test to verify it passes

Run: `npm run build && npm test`
Expected: PASS

### Step 5: Commit

```bash
git add src/utils/exec.ts src/utils/exec.test.ts
git commit -m "feat: add execCommand utility with execFile for security"
```

---

## Task 4: Utility - Prerequisite Checker

**Files:**

- Create: `src/utils/prerequisites.ts`
- Create: `src/utils/prerequisites.test.ts`

### Step 1: Write the failing test for checkPrerequisites

```typescript
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
```

### Step 2: Run test to verify it fails

Run: `npm run build && npm test`
Expected: FAIL with "Cannot find module './prerequisites.js'"

### Step 3: Write minimal implementation

```typescript
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
```

### Step 4: Run test to verify it passes

Run: `npm run build && npm test`
Expected: PASS

### Step 5: Commit

```bash
git add src/utils/prerequisites.ts src/utils/prerequisites.test.ts
git commit -m "feat: add prerequisite checker for npx availability"
```

---

## Task 5: Utility - Git Integration

**Files:**

- Create: `src/utils/git.ts`
- Create: `src/utils/git.test.ts`

### Step 1: Write the failing test for getChangedMarkdownFiles

```typescript
// src/utils/git.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getChangedMarkdownFiles, isGitRepo } from './git.js';

describe('isGitRepo', () => {
  it('should return true when in a git repository', async () => {
    // This test runs inside the plugin repo which is a git repo
    const result = await isGitRepo();
    assert.strictEqual(result, true);
  });
});

describe('getChangedMarkdownFiles', () => {
  it('should return an array', async () => {
    const files = await getChangedMarkdownFiles();
    assert.ok(Array.isArray(files));
  });

  it('should only include .md files', async () => {
    const files = await getChangedMarkdownFiles();
    for (const file of files) {
      assert.ok(file.endsWith('.md'), `Expected .md file, got: ${file}`);
    }
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm run build && npm test`
Expected: FAIL with "Cannot find module './git.js'"

### Step 3: Write minimal implementation

```typescript
// src/utils/git.ts
import { execCommand } from './exec.js';

export async function isGitRepo(): Promise<boolean> {
  const result = await execCommand('git', ['rev-parse', '--git-dir']);
  return result.exitCode === 0;
}

export async function getChangedMarkdownFiles(): Promise<string[]> {
  const inRepo = await isGitRepo();

  if (!inRepo) {
    // Fall back to all markdown files if not in a git repo
    return getAllMarkdownFiles();
  }

  // Get staged and unstaged changed files
  const staged = await execCommand('git', [
    'diff',
    '--name-only',
    '--diff-filter=ACMR',
    '--cached',
  ]);

  const unstaged = await execCommand('git', [
    'diff',
    '--name-only',
    '--diff-filter=ACMR',
  ]);

  // Get untracked files
  const untracked = await execCommand('git', [
    'ls-files',
    '--others',
    '--exclude-standard',
  ]);

  const allFiles = [
    ...staged.stdout.split('\n'),
    ...unstaged.stdout.split('\n'),
    ...untracked.stdout.split('\n'),
  ];

  // Filter to .md files and remove duplicates/empty
  const mdFiles = [...new Set(allFiles)]
    .filter((f) => f.endsWith('.md') && f.length > 0);

  return mdFiles;
}

async function getAllMarkdownFiles(): Promise<string[]> {
  const result = await execCommand('find', [
    '.',
    '-name',
    '*.md',
    '-not',
    '-path',
    './node_modules/*',
  ]);

  return result.stdout
    .split('\n')
    .filter((f) => f.length > 0)
    .map((f) => f.replace(/^\.\//, ''));
}
```

### Step 4: Run test to verify it passes

Run: `npm run build && npm test`
Expected: PASS

### Step 5: Commit

```bash
git add src/utils/git.ts src/utils/git.test.ts
git commit -m "feat: add git utilities for detecting changed markdown files"
```

---

## Task 6: Core - Markdownlint Runner

**Files:**

- Create: `src/core/linter.ts`
- Create: `src/core/linter.test.ts`

### Step 1: Write the failing test for runMarkdownlint

```typescript
// src/core/linter.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { runMarkdownlint, LintResult } from './linter.js';
import { writeFileSync, unlinkSync, mkdirSync, rmSync } from 'node:fs';

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
```

### Step 2: Run test to verify it fails

Run: `npm run build && npm test`
Expected: FAIL with "Cannot find module './linter.js'"

### Step 3: Write minimal implementation

```typescript
// src/core/linter.ts
import { execCommand } from '../utils/exec.js';
import { checkPrerequisites } from '../utils/prerequisites.js';

export interface LintIssue {
  file: string;
  line: number;
  column: number;
  ruleId: string;
  ruleDescription: string;
  message: string;
  fixable: boolean;
}

export interface LintResult {
  success: boolean;
  issues: LintIssue[];
  error?: string;
}

export async function runMarkdownlint(files: string[]): Promise<LintResult> {
  // Check prerequisites first
  const prereq = await checkPrerequisites();
  if (!prereq.success) {
    return {
      success: false,
      issues: [],
      error: prereq.error?.message,
    };
  }

  if (files.length === 0) {
    return { success: true, issues: [] };
  }

  // Run markdownlint-cli2 with JSON output
  const result = await execCommand('npx', [
    'markdownlint-cli2',
    '--json',
    ...files,
  ]);

  // Exit code 0 = no issues, 1 = issues found, other = error
  if (result.exitCode === 0) {
    return { success: true, issues: [] };
  }

  // Parse JSON output from stderr (markdownlint-cli2 outputs to stderr)
  try {
    const output = result.stdout || result.stderr;
    const issues = parseMarkdownlintOutput(output, files);
    return {
      success: issues.length === 0,
      issues,
    };
  } catch {
    // If JSON parsing fails, try to extract meaningful error
    return {
      success: false,
      issues: [],
      error: result.stderr || 'Unknown markdownlint error',
    };
  }
}

function parseMarkdownlintOutput(output: string, files: string[]): LintIssue[] {
  // markdownlint-cli2 --json outputs a JSON object with file paths as keys
  // Each value is an array of issue objects
  const issues: LintIssue[] = [];

  try {
    // Find the JSON in the output (may have other text before/after)
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return issues;
    }

    const parsed = JSON.parse(jsonMatch[0]) as Record<
      string,
      Array<{
        lineNumber: number;
        ruleNames: string[];
        ruleDescription: string;
        errorDetail?: string;
        fixInfo?: unknown;
      }>
    >;

    for (const [file, fileIssues] of Object.entries(parsed)) {
      for (const issue of fileIssues) {
        issues.push({
          file,
          line: issue.lineNumber,
          column: 1,
          ruleId: issue.ruleNames[0] || 'unknown',
          ruleDescription: issue.ruleDescription,
          message: issue.errorDetail || issue.ruleDescription,
          fixable: issue.fixInfo !== undefined,
        });
      }
    }
  } catch {
    // JSON parsing failed, return empty
  }

  return issues;
}
```

### Step 4: Run test to verify it passes

Run: `npm run build && npm test`
Expected: PASS

### Step 5: Commit

```bash
git add src/core/linter.ts src/core/linter.test.ts
git commit -m "feat: add markdownlint runner with JSON output parsing"
```

---

## Task 7: Core - Auto Fixer

**Files:**

- Create: `src/core/fixer.ts`
- Create: `src/core/fixer.test.ts`

### Step 1: Write the failing test for autoFix

```typescript
// src/core/fixer.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { autoFix, FixResult } from './fixer.js';
import { writeFileSync, readFileSync, mkdirSync, rmSync } from 'node:fs';

describe('autoFix', () => {
  const testDir = './test-fixtures';
  const testFile = `${testDir}/fixable.md`;

  const setup = () => {
    mkdirSync(testDir, { recursive: true });
  };

  const teardown = () => {
    rmSync(testDir, { recursive: true, force: true });
  };

  it('should fix auto-fixable issues', async () => {
    setup();
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
```

### Step 2: Run test to verify it fails

Run: `npm run build && npm test`
Expected: FAIL with "Cannot find module './fixer.js'"

### Step 3: Write minimal implementation

```typescript
// src/core/fixer.ts
import { execCommand } from '../utils/exec.js';
import { checkPrerequisites } from '../utils/prerequisites.js';
import { runMarkdownlint, LintIssue } from './linter.js';

export interface FixResult {
  success: boolean;
  fixedCount: number;
  remainingIssues: LintIssue[];
  error?: string;
}

export async function autoFix(files: string[]): Promise<FixResult> {
  // Check prerequisites first
  const prereq = await checkPrerequisites();
  if (!prereq.success) {
    return {
      success: false,
      fixedCount: 0,
      remainingIssues: [],
      error: prereq.error?.message,
    };
  }

  if (files.length === 0) {
    return { success: true, fixedCount: 0, remainingIssues: [] };
  }

  // Get issues before fix
  const beforeResult = await runMarkdownlint(files);
  const beforeCount = beforeResult.issues.length;

  // Run markdownlint-cli2 with --fix
  const result = await execCommand('npx', [
    'markdownlint-cli2',
    '--fix',
    ...files,
  ]);

  // Re-lint to see what remains
  const afterResult = await runMarkdownlint(files);
  const fixedCount = beforeCount - afterResult.issues.length;

  return {
    success: true,
    fixedCount,
    remainingIssues: afterResult.issues,
  };
}
```

### Step 4: Run test to verify it passes

Run: `npm run build && npm test`
Expected: PASS

### Step 5: Commit

```bash
git add src/core/fixer.ts src/core/fixer.test.ts
git commit -m "feat: add auto-fixer with remaining issue detection"
```

---

## Task 8: Core - Config Initializer

**Files:**

- Create: `src/core/config.ts`
- Create: `src/core/config.test.ts`

### Step 1: Write the failing test for initConfig

```typescript
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
```

### Step 2: Run test to verify it fails

Run: `npm run build && npm test`
Expected: FAIL with "Cannot find module './config.js'"

### Step 3: Write minimal implementation

```typescript
// src/core/config.ts
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const STARTER_CONFIG = `{
  // Starter config generated by markdownlint plugin
  "default": true,

  // Relaxed rules for practical use
  "MD013": false,           // Line length - often impractical
  "MD033": false,           // Inline HTML - needed for badges, details, etc.
  "MD041": false,           // First line h1 - not always wanted

  // Keep these strict (catch real issues)
  "MD001": true,            // Heading increment (no skipping h1 to h3)
  "MD012": { "maximum": 1 },// Multiple blank lines
  "MD022": true,            // Headings need blank lines
  "MD031": true,            // Fenced code needs blank lines
  "MD047": true             // File should end with newline
}
`;

const CONFIG_NAMES = [
  '.markdownlint.jsonc',
  '.markdownlint.json',
  '.markdownlint.yaml',
  '.markdownlint.yml',
  '.markdownlint-cli2.jsonc',
  '.markdownlint-cli2.json',
];

export async function findExistingConfig(
  directory: string
): Promise<string | null> {
  for (const name of CONFIG_NAMES) {
    const path = join(directory, name);
    if (existsSync(path)) {
      return path;
    }
  }
  return null;
}

export interface InitConfigResult {
  created: boolean;
  path: string;
  existingPath?: string;
}

export async function initConfig(directory: string): Promise<InitConfigResult> {
  const existing = await findExistingConfig(directory);

  if (existing) {
    return {
      created: false,
      path: existing,
      existingPath: existing,
    };
  }

  const newPath = join(directory, '.markdownlint.jsonc');
  writeFileSync(newPath, STARTER_CONFIG, 'utf-8');

  return {
    created: true,
    path: newPath,
  };
}
```

### Step 4: Run test to verify it passes

Run: `npm run build && npm test`
Expected: PASS

### Step 5: Commit

```bash
git add src/core/config.ts src/core/config.test.ts
git commit -m "feat: add config initializer with starter template"
```

---

## Task 9: MCP Tools - lint_markdown

**Files:**

- Create: `src/tools/lint-markdown.ts`
- Create: `src/tools/lint-markdown.test.ts`

### Step 1: Write the failing test for lintMarkdownTool

```typescript
// src/tools/lint-markdown.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { lintMarkdownTool } from './lint-markdown.js';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';

describe('lintMarkdownTool', () => {
  const testDir = './test-fixtures';
  const testFile = `${testDir}/test.md`;

  const setup = () => {
    mkdirSync(testDir, { recursive: true });
  };

  const teardown = () => {
    rmSync(testDir, { recursive: true, force: true });
  };

  it('should return structured result with issues', async () => {
    setup();
    try {
      writeFileSync(testFile, '# Heading\n\n\n\nContent\n');
      const result = await lintMarkdownTool({ files: [testFile] });

      assert.ok('success' in result);
      assert.ok('issues' in result);
      assert.ok('summary' in result);
    } finally {
      teardown();
    }
  });

  it('should respect scope parameter', async () => {
    setup();
    try {
      writeFileSync(testFile, '# Valid\n\nContent\n');
      const result = await lintMarkdownTool({
        files: [testFile],
        scope: 'file',
      });

      assert.strictEqual(result.success, true);
    } finally {
      teardown();
    }
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm run build && npm test`
Expected: FAIL with "Cannot find module './lint-markdown.js'"

### Step 3: Write minimal implementation

```typescript
// src/tools/lint-markdown.ts
import { runMarkdownlint, LintIssue } from '../core/linter.js';
import { getChangedMarkdownFiles } from '../utils/git.js';

export interface LintMarkdownParams {
  files?: string[];
  scope?: 'changed' | 'all' | 'file';
}

export interface LintMarkdownResult {
  success: boolean;
  issues: LintIssue[];
  summary: string;
  autoFixableCount: number;
  error?: string;
}

export async function lintMarkdownTool(
  params: LintMarkdownParams = {}
): Promise<LintMarkdownResult> {
  const { files, scope = 'changed' } = params;

  // Determine which files to lint
  let filesToLint: string[];

  if (files && files.length > 0) {
    filesToLint = files;
  } else if (scope === 'changed') {
    filesToLint = await getChangedMarkdownFiles();
  } else {
    // scope === 'all' - would need to implement getAllMarkdownFiles
    filesToLint = await getChangedMarkdownFiles(); // fallback for now
  }

  if (filesToLint.length === 0) {
    return {
      success: true,
      issues: [],
      summary: 'No markdown files to check.',
      autoFixableCount: 0,
    };
  }

  const result = await runMarkdownlint(filesToLint);

  if (result.error) {
    return {
      success: false,
      issues: [],
      summary: result.error,
      autoFixableCount: 0,
      error: result.error,
    };
  }

  const autoFixableCount = result.issues.filter((i) => i.fixable).length;
  const summary = formatSummary(result.issues, autoFixableCount);

  return {
    success: result.success,
    issues: result.issues,
    summary,
    autoFixableCount,
  };
}

function formatSummary(issues: LintIssue[], autoFixableCount: number): string {
  if (issues.length === 0) {
    return 'All markdown files pass linting.';
  }

  const fileCount = new Set(issues.map((i) => i.file)).size;
  const lines = [
    `Found ${issues.length} issue${issues.length === 1 ? '' : 's'} in ${fileCount} file${fileCount === 1 ? '' : 's'}:`,
    '',
  ];

  // Group by file
  const byFile = new Map<string, LintIssue[]>();
  for (const issue of issues) {
    const existing = byFile.get(issue.file) || [];
    existing.push(issue);
    byFile.set(issue.file, existing);
  }

  for (const [file, fileIssues] of byFile) {
    lines.push(`**${file}**`);
    for (const issue of fileIssues) {
      lines.push(`- Line ${issue.line}: ${issue.ruleId} - ${issue.message}`);
    }
    lines.push('');
  }

  if (autoFixableCount > 0) {
    lines.push(
      `${autoFixableCount} issue${autoFixableCount === 1 ? ' is' : 's are'} auto-fixable.`
    );
  }

  return lines.join('\n');
}
```

### Step 4: Run test to verify it passes

Run: `npm run build && npm test`
Expected: PASS

### Step 5: Commit

```bash
git add src/tools/lint-markdown.ts src/tools/lint-markdown.test.ts
git commit -m "feat: add lint_markdown MCP tool"
```

---

## Task 10: MCP Tools - fix_markdown

**Files:**

- Create: `src/tools/fix-markdown.ts`
- Create: `src/tools/fix-markdown.test.ts`

### Step 1: Write the failing test for fixMarkdownTool

```typescript
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
```

### Step 2: Run test to verify it fails

Run: `npm run build && npm test`
Expected: FAIL with "Cannot find module './fix-markdown.js'"

### Step 3: Write minimal implementation

```typescript
// src/tools/fix-markdown.ts
import { autoFix } from '../core/fixer.js';
import { getChangedMarkdownFiles } from '../utils/git.js';
import { LintIssue } from '../core/linter.js';

export interface FixMarkdownParams {
  files?: string[];
  auto_only?: boolean;
}

export interface FixMarkdownResult {
  success: boolean;
  fixedCount: number;
  remainingIssues: LintIssue[];
  summary: string;
  claudeFixAvailable: boolean;
  error?: string;
}

export async function fixMarkdownTool(
  params: FixMarkdownParams = {}
): Promise<FixMarkdownResult> {
  const { files, auto_only = false } = params;

  // Determine which files to fix
  let filesToFix: string[];

  if (files && files.length > 0) {
    filesToFix = files;
  } else {
    filesToFix = await getChangedMarkdownFiles();
  }

  if (filesToFix.length === 0) {
    return {
      success: true,
      fixedCount: 0,
      remainingIssues: [],
      summary: 'No markdown files to fix.',
      claudeFixAvailable: false,
    };
  }

  const result = await autoFix(filesToFix);

  if (result.error) {
    return {
      success: false,
      fixedCount: 0,
      remainingIssues: [],
      summary: result.error,
      claudeFixAvailable: false,
      error: result.error,
    };
  }

  const claudeFixAvailable =
    !auto_only && result.remainingIssues.length > 0;

  const summary = formatFixSummary(
    result.fixedCount,
    result.remainingIssues,
    claudeFixAvailable
  );

  return {
    success: true,
    fixedCount: result.fixedCount,
    remainingIssues: result.remainingIssues,
    summary,
    claudeFixAvailable,
  };
}

function formatFixSummary(
  fixedCount: number,
  remainingIssues: LintIssue[],
  claudeFixAvailable: boolean
): string {
  const lines: string[] = [];

  if (fixedCount > 0) {
    lines.push(
      `Auto-fixed ${fixedCount} issue${fixedCount === 1 ? '' : 's'}.`
    );
  }

  if (remainingIssues.length === 0) {
    lines.push('All markdown files now pass linting.');
  } else {
    lines.push('');
    lines.push(
      `${remainingIssues.length} issue${remainingIssues.length === 1 ? '' : 's'} remaining:`
    );

    for (const issue of remainingIssues) {
      lines.push(
        `- ${issue.file}:${issue.line}: ${issue.ruleId} - ${issue.message}`
      );
    }

    if (claudeFixAvailable) {
      lines.push('');
      lines.push(
        'Autofix is not available for these issues, but I can fix them myself. Would you like that?'
      );
    }
  }

  return lines.join('\n');
}
```

### Step 4: Run test to verify it passes

Run: `npm run build && npm test`
Expected: PASS

### Step 5: Commit

```bash
git add src/tools/fix-markdown.ts src/tools/fix-markdown.test.ts
git commit -m "feat: add fix_markdown MCP tool"
```

---

## Task 11: MCP Tools - init_markdownlint_config

**Files:**

- Create: `src/tools/init-config.ts`
- Create: `src/tools/init-config.test.ts`

### Step 1: Write the failing test for initConfigTool

```typescript
// src/tools/init-config.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { initConfigTool } from './init-config.js';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';

describe('initConfigTool', () => {
  const testDir = './test-fixtures';

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
```

### Step 2: Run test to verify it fails

Run: `npm run build && npm test`
Expected: FAIL with "Cannot find module './init-config.js'"

### Step 3: Write minimal implementation

```typescript
// src/tools/init-config.ts
import { initConfig } from '../core/config.js';

export interface InitConfigParams {
  directory?: string;
}

export interface InitConfigToolResult {
  success: boolean;
  created: boolean;
  path: string;
  message: string;
}

export async function initConfigTool(
  params: InitConfigParams = {}
): Promise<InitConfigToolResult> {
  const { directory = '.' } = params;

  try {
    const result = await initConfig(directory);

    if (result.created) {
      return {
        success: true,
        created: true,
        path: result.path,
        message: `Created starter markdownlint config at ${result.path}. You can customize the rules as needed.`,
      };
    } else {
      return {
        success: true,
        created: false,
        path: result.existingPath!,
        message: `Markdownlint config already exists at ${result.existingPath}. No changes made.`,
      };
    }
  } catch (error) {
    return {
      success: false,
      created: false,
      path: '',
      message: `Failed to create config: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
```

### Step 4: Run test to verify it passes

Run: `npm run build && npm test`
Expected: PASS

### Step 5: Commit

```bash
git add src/tools/init-config.ts src/tools/init-config.test.ts
git commit -m "feat: add init_markdownlint_config MCP tool"
```

---

## Task 12: Plugin Entry Point

**Files:**

- Create: `src/index.ts`

### Step 1: Create the main entry point that exports all tools

```typescript
// src/index.ts
export { lintMarkdownTool } from './tools/lint-markdown.js';
export type {
  LintMarkdownParams,
  LintMarkdownResult,
} from './tools/lint-markdown.js';

export { fixMarkdownTool } from './tools/fix-markdown.js';
export type {
  FixMarkdownParams,
  FixMarkdownResult,
} from './tools/fix-markdown.js';

export { initConfigTool } from './tools/init-config.js';
export type {
  InitConfigParams,
  InitConfigToolResult,
} from './tools/init-config.js';

// Re-export types that may be useful
export type { LintIssue, LintResult } from './core/linter.js';
export type { FixResult } from './core/fixer.js';
```

### Step 2: Build and verify

Run: `npm run build`
Expected: Compiles without errors, dist/index.js created

### Step 3: Commit

```bash
git add src/index.ts
git commit -m "feat: add plugin entry point exporting all tools"
```

---

## Task 13: Update CLAUDE.md and README

**Files:**

- Modify: `CLAUDE.md`
- Modify: `README.md`

### Step 1: Update CLAUDE.md with build commands and architecture

````markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

A Claude Code plugin that provides markdownlint capabilities - linting markdown files for style/format issues and automatically repairing them, with Claude-assisted fixes for issues that can't be auto-fixed.

## Commands

- `npm install` - Install dependencies
- `npm run build` - Compile TypeScript to dist/
- `npm run watch` - Compile in watch mode
- `npm test` - Run tests
- `npm run lint` - Lint markdown files in this repo

## Architecture

```text
src/
├── index.ts              # Plugin entry point, exports all tools
├── utils/
│   ├── exec.ts           # Safe command execution with execFile
│   ├── prerequisites.ts  # Node.js/npx availability checking
│   └── git.ts            # Git integration for changed files
├── core/
│   ├── linter.ts         # markdownlint-cli2 runner and output parser
│   ├── fixer.ts          # Auto-fix functionality
│   └── config.ts         # Config file detection and creation
└── tools/
    ├── lint-markdown.ts  # lint_markdown MCP tool
    ├── fix-markdown.ts   # fix_markdown MCP tool
    └── init-config.ts    # init_markdownlint_config MCP tool
```

## MCP Tools

- **lint_markdown** - Check markdown files for issues
- **fix_markdown** - Auto-fix issues, report remaining for Claude assistance
- **init_markdownlint_config** - Create starter .markdownlint.jsonc
````

### Step 2: Update README.md with installation and usage

````markdown
# claude-skill-markdownlint

A Claude Code plugin for linting and fixing markdown files using markdownlint.

## Features

- Lint markdown files for style and formatting issues
- Auto-fix issues that markdownlint can fix
- Claude-assisted fixes for issues that can't be auto-fixed
- Proactive linting after markdown edits
- Starter config generation

## Installation

```bash
claude plugins add github:username/claude-skill-markdownlint
```

## Usage

The plugin provides three tools:

### lint_markdown

Check markdown files for issues.

```text
/markdownlint check
```

### fix_markdown

Fix markdown issues (auto-fix first, then Claude-assisted).

```text
/markdownlint fix
```

### init_markdownlint_config

Create a starter `.markdownlint.jsonc` configuration.

```text
/markdownlint init
```

## Configuration

Plugin behavior is configured in `.claude/plugins/markdownlint.json`:

```json
{
  "claude_assisted_fixes": "ask",
  "proactive_linting": true,
  "default_scope": "changed"
}
```

Linting rules are configured in `.markdownlint.jsonc` (standard markdownlint config).
````

### Step 3: Commit

```bash
git add CLAUDE.md README.md
git commit -m "docs: update CLAUDE.md and README with usage instructions"
```

---

## Task 14: Final Verification

### Step 1: Clean build

Run: `rm -rf dist && npm run build`
Expected: Clean compile, no errors

### Step 2: Run all tests

Run: `npm test`
Expected: All tests pass

### Step 3: Verify plugin structure

Run: `ls -la dist/ && cat plugin.json`
Expected: All expected files present

### Step 4: Test lint on own docs

Run: `npm run lint`
Expected: Either passes or shows expected issues

### Step 5: Final commit if any changes

```bash
git status
# If any uncommitted changes:
git add -A
git commit -m "chore: final cleanup"
```

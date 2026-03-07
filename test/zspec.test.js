import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const BIN = path.resolve(import.meta.dirname, '..', 'bin', 'zspec.js');

function run(args, options = {}) {
  return spawnSync(process.execPath, [BIN, ...args], {
    encoding: 'utf8',
    ...options,
  });
}

// ---------------------------------------------------------------------------
// Help / usage
// ---------------------------------------------------------------------------

describe('help', () => {
  it('prints usage with no arguments', () => {
    const { stdout, status } = run([]);
    assert.equal(status, 0);
    assert.match(stdout, /zspec v0\.1\.0/);
    assert.match(stdout, /Usage:/);
    assert.match(stdout, /init/);
    assert.match(stdout, /new/);
    assert.match(stdout, /use/);
    assert.match(stdout, /status/);
    assert.match(stdout, /mcp/);
  });

  it('prints usage with --help', () => {
    const { stdout, status } = run(['--help']);
    assert.equal(status, 0);
    assert.match(stdout, /zspec v0\.1\.0/);
  });

  it('prints usage with -h', () => {
    const { stdout, status } = run(['-h']);
    assert.equal(status, 0);
    assert.match(stdout, /zspec v0\.1\.0/);
  });
});

// ---------------------------------------------------------------------------
// Unknown command
// ---------------------------------------------------------------------------

describe('unknown command', () => {
  it('exits with code 1 for an unknown command', () => {
    const { status, stderr } = run(['does-not-exist']);
    assert.equal(status, 1);
    assert.match(stderr, /unknown command/);
  });
});

// ---------------------------------------------------------------------------
// init
// ---------------------------------------------------------------------------

describe('init', () => {
  it('scaffolds expected directories and files in a temp repo', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zspec-init-'));
    try {
      // Give the temp dir a package.json so the script can inject scripts
      fs.writeFileSync(
        path.join(tmpDir, 'package.json'),
        JSON.stringify({ name: 'test-project', version: '1.0.0' }, null, 2)
      );

      const { stdout, status } = run(['init'], { cwd: tmpDir });
      assert.equal(status, 0, `init failed:\n${stdout}`);
      assert.match(stdout, /Initialized zspec scaffold/);

      // Core template directories should have been copied
      assert.ok(fs.existsSync(path.join(tmpDir, 'specs', '0000-template')), 'specs/0000-template missing');
      assert.ok(fs.existsSync(path.join(tmpDir, 'gsd')), 'gsd/ missing');
      assert.ok(fs.existsSync(path.join(tmpDir, 'gsd', 'memory')), 'gsd/memory/ missing');
      assert.ok(fs.existsSync(path.join(tmpDir, 'AGENTS.md')), 'AGENTS.md missing');

      // Scripts should have been injected into package.json
      const pkg = JSON.parse(fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf8'));
      assert.ok(pkg.scripts['spec:new'], 'spec:new script missing');
      assert.ok(pkg.scripts['gsd:repo'], 'gsd:repo script missing');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('--force overwrites existing files', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zspec-init-force-'));
    try {
      // First init
      run(['init'], { cwd: tmpDir });
      // Write a sentinel to a templated file
      const agentsPath = path.join(tmpDir, 'AGENTS.md');
      fs.writeFileSync(agentsPath, 'SENTINEL');

      // Second init without --force should not overwrite
      run(['init'], { cwd: tmpDir });
      assert.equal(fs.readFileSync(agentsPath, 'utf8'), 'SENTINEL');

      // Second init WITH --force should overwrite
      run(['init', '--force'], { cwd: tmpDir });
      assert.notEqual(fs.readFileSync(agentsPath, 'utf8'), 'SENTINEL');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('works even when no package.json is present', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zspec-init-nopkg-'));
    try {
      const { status } = run(['init'], { cwd: tmpDir });
      assert.equal(status, 0);
      assert.ok(fs.existsSync(path.join(tmpDir, 'specs', '0000-template')));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// new
// ---------------------------------------------------------------------------

describe('new', () => {
  it('creates a spec directory and spec.md', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zspec-new-'));
    try {
      const { stdout, status } = run(['new', 'my feature'], { cwd: tmpDir });
      assert.equal(status, 0, `new failed:\n${stdout}`);
      assert.match(stdout, /Spec created/);
      assert.match(stdout, /0001-my-feature/);

      const specFile = path.join(tmpDir, 'specs', '0001-my-feature', 'spec.md');
      assert.ok(fs.existsSync(specFile), 'spec.md not created');

      const content = fs.readFileSync(specFile, 'utf8');
      assert.match(content, /my feature/i);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('increments spec number when specs already exist', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zspec-new-incr-'));
    try {
      run(['new', 'first feature'], { cwd: tmpDir });
      const { stdout, status } = run(['new', 'second feature'], { cwd: tmpDir });
      assert.equal(status, 0);
      assert.match(stdout, /0002-second-feature/);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('slugifies feature names with special characters', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zspec-new-slug-'));
    try {
      const { stdout, status } = run(['new', 'Add Billing & Payments!'], { cwd: tmpDir });
      assert.equal(status, 0);
      assert.match(stdout, /0001-add-billing-payments/);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('exits with error when no feature name is provided', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zspec-new-noname-'));
    try {
      const { status, stderr } = run(['new'], { cwd: tmpDir });
      assert.equal(status, 1);
      assert.match(stderr, /missing <feature-name>/);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('creates distinct numbered dirs for the same slug name', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zspec-new-sameslugs-'));
    try {
      run(['new', 'duplicate'], { cwd: tmpDir });
      const { stdout, status } = run(['new', 'duplicate'], { cwd: tmpDir });
      assert.equal(status, 0);
      // Second run should produce 0002, not 0001
      assert.match(stdout, /0002-duplicate/);
      assert.ok(fs.existsSync(path.join(tmpDir, 'specs', '0001-duplicate', 'spec.md')));
      assert.ok(fs.existsSync(path.join(tmpDir, 'specs', '0002-duplicate', 'spec.md')));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('prints a Copilot-ready agent prompt', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zspec-new-prompt-'));
    try {
      const { stdout, status } = run(['new', 'billing'], { cwd: tmpDir });
      assert.equal(status, 0);
      assert.match(stdout, /Copilot \/ agent prompt/);
      assert.match(stdout, /Read AGENTS\.md/);
      assert.match(stdout, /AGENTS\.md/);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// use
// ---------------------------------------------------------------------------

describe('use', () => {
  it('prints a skill activation prompt', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zspec-use-'));
    try {
      const { stdout, status } = run(['use', 'frontend-design'], { cwd: tmpDir });
      assert.equal(status, 0);
      assert.match(stdout, /Skill activation prompt/);
      assert.match(stdout, /frontend-design/);
      assert.match(stdout, /Activate the skill/);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('exits with error when no skill name is provided', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zspec-use-noname-'));
    try {
      const { status, stderr } = run(['use'], { cwd: tmpDir });
      assert.equal(status, 1);
      assert.match(stderr, /missing <skill-name>/);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// status
// ---------------------------------------------------------------------------

describe('status', () => {
  it('shows zspec status header and no specs message', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zspec-status-'));
    try {
      const { stdout, status } = run(['status'], { cwd: tmpDir });
      assert.equal(status, 0);
      assert.match(stdout, /zspec status/);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('lists specs when specs/ directory exists with entries', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zspec-status-specs-'));
    try {
      run(['new', 'my feature'], { cwd: tmpDir });
      const { stdout, status } = run(['status'], { cwd: tmpDir });
      assert.equal(status, 0);
      assert.match(stdout, /Specs \(1\)/);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('shows tip about gsd/run.mjs', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zspec-status-tip-'));
    try {
      const { stdout } = run(['status'], { cwd: tmpDir });
      assert.match(stdout, /gsd\/run\.mjs/);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('prints recent progress log when present', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zspec-status-log-'));
    try {
      fs.mkdirSync(path.join(tmpDir, 'gsd', 'logs'), { recursive: true });
      fs.writeFileSync(path.join(tmpDir, 'gsd', 'logs', 'progress.md'), '## 2024-01-01\n- did a thing\n');
      const { stdout } = run(['status'], { cwd: tmpDir });
      assert.match(stdout, /Recent progress log/);
      assert.match(stdout, /did a thing/);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// mcp
// ---------------------------------------------------------------------------

describe('mcp', () => {
  it('prints Serena MCP instructions', () => {
    const { stdout, status } = run(['mcp']);
    assert.equal(status, 0);
    assert.match(stdout, /Serena MCP/);
    assert.match(stdout, /stdio/);
    assert.match(stdout, /HTTP\/SSE/);
    assert.match(stdout, /serena\.mjs/);
  });
});

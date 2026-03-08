import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BIN = path.resolve(__dirname, '..', 'bin', 'zspec.js');

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
  it('runs init when called with no arguments', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zspec-noargs-'));
    try {
      const { stdout, status } = run([], { cwd: tmpDir });
      assert.equal(status, 0);
      assert.match(stdout, /Initialized zspec scaffold/);
      // .github/prompts/ should be scaffolded
      assert.ok(fs.existsSync(path.join(tmpDir, '.github', 'prompts', 'zspec-new-story.prompt.md')), 'zspec-new-story.prompt.md missing');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('prints usage with --help', () => {
    const { stdout, status } = run(['--help']);
    assert.equal(status, 0);
    assert.match(stdout, /zspec v\d+\.\d+\.\d+/);
    assert.match(stdout, /Usage:/);
    assert.match(stdout, /init/);
    assert.match(stdout, /new/);
    assert.match(stdout, /story/);
    assert.match(stdout, /use/);
    assert.match(stdout, /status/);
    assert.match(stdout, /mcp/);
  });

  it('prints usage with -h', () => {
    const { stdout, status } = run(['-h']);
    assert.equal(status, 0);
    assert.match(stdout, /zspec v\d+\.\d+\.\d+/);
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
      assert.ok(fs.existsSync(path.join(tmpDir, 'zspec')), 'zspec/ missing');
      assert.ok(fs.existsSync(path.join(tmpDir, 'zspec', 'memory')), 'zspec/memory/ missing');
      assert.ok(fs.existsSync(path.join(tmpDir, 'AGENTS.md')), 'AGENTS.md missing');

      // .zspec/ story directories should have been created
      assert.ok(fs.existsSync(path.join(tmpDir, '.zspec', 'stories')), '.zspec/stories/ missing');

      // Copilot agent files should have been scaffolded
      assert.ok(fs.existsSync(path.join(tmpDir, '.github', 'agents', 'codebase-mapper.agent.md')), 'codebase-mapper.agent.md missing');
      assert.ok(fs.existsSync(path.join(tmpDir, '.github', 'agents', 'stack-mapper.agent.md')), 'stack-mapper.agent.md missing');
      assert.ok(fs.existsSync(path.join(tmpDir, '.github', 'agents', 'arch-mapper.agent.md')), 'arch-mapper.agent.md missing');
      assert.ok(fs.existsSync(path.join(tmpDir, '.github', 'agents', 'quality-mapper.agent.md')), 'quality-mapper.agent.md missing');
      assert.ok(fs.existsSync(path.join(tmpDir, '.github', 'agents', 'concerns-mapper.agent.md')), 'concerns-mapper.agent.md missing');

      // copilot-instructions.md should have been scaffolded
      assert.ok(fs.existsSync(path.join(tmpDir, '.github', 'copilot-instructions.md')), 'copilot-instructions.md missing');

      // Copilot Chat prompt files should have been scaffolded
      const promptsDir = path.join(tmpDir, '.github', 'prompts');
      assert.ok(fs.existsSync(path.join(promptsDir, 'zspec-new-story.prompt.md')), 'zspec-new-story.prompt.md missing');
      assert.ok(fs.existsSync(path.join(promptsDir, 'zspec-map-codebase.prompt.md')), 'zspec-map-codebase.prompt.md missing');
      assert.ok(fs.existsSync(path.join(promptsDir, 'zspec-new-spec.prompt.md')), 'zspec-new-spec.prompt.md missing');
      assert.ok(fs.existsSync(path.join(promptsDir, 'zspec-implement-story.prompt.md')), 'zspec-implement-story.prompt.md missing');
      assert.ok(fs.existsSync(path.join(promptsDir, 'zspec-pr-description.prompt.md')), 'zspec-pr-description.prompt.md missing');

      // .zspec story templates should have been scaffolded
      assert.ok(fs.existsSync(path.join(tmpDir, '.zspec', 'templates', 'story.md')), '.zspec/templates/story.md missing');
      assert.ok(fs.existsSync(path.join(tmpDir, '.zspec', 'templates', 'codebase', 'STACK.md')), '.zspec/templates/codebase/STACK.md missing');

      // Scripts should have been injected into package.json
      const pkg = JSON.parse(fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf8'));
      assert.ok(pkg.scripts['spec:new'], 'spec:new script missing');
      assert.ok(pkg.scripts['zspec:repo'], 'zspec:repo script missing');

      // init output should mention story and agent info
      assert.match(stdout, /codebase-mapper/);
      assert.match(stdout, /zspec story/);
      assert.match(stdout, /\.github\/prompts/);
      assert.match(stdout, /zspec-new-story/);
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

  it('--upgrade keeps existing .zspec files and refreshes non-.zspec scaffold files', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zspec-init-upgrade-'));
    try {
      fs.writeFileSync(
        path.join(tmpDir, 'package.json'),
        JSON.stringify({ name: 'test-project', version: '1.0.0' }, null, 2)
      );

      run(['init'], { cwd: tmpDir });

      const zspecFile = path.join(tmpDir, '.zspec', 'templates', 'story.md');
      const externalFile = path.join(tmpDir, '.github', 'AGENTS.md');
      const pkgPath = path.join(tmpDir, 'package.json');

      fs.writeFileSync(zspecFile, 'ZSPEC_SENTINEL');
      fs.writeFileSync(externalFile, 'EXTERNAL_SENTINEL');

      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      pkg.scripts ??= {};
      pkg.scripts['spec:new'] = 'SENTINEL_SCRIPT';
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

      const { status } = run(['init', '--upgrade'], { cwd: tmpDir });
      assert.equal(status, 0);

      assert.equal(fs.readFileSync(zspecFile, 'utf8'), 'ZSPEC_SENTINEL');
      assert.notEqual(fs.readFileSync(externalFile, 'utf8'), 'EXTERNAL_SENTINEL');

      const upgradedPkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      assert.equal(upgradedPkg.scripts['spec:new'], 'node .zspec/run.mjs spec:new');
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
// story
// ---------------------------------------------------------------------------

describe('story', () => {
  it('creates a story directory with all required files', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zspec-story-'));
    try {
      const { stdout, status } = run(['story', 'add billing'], { cwd: tmpDir });
      assert.equal(status, 0, `story failed:\n${stdout}`);
      assert.match(stdout, /Story created/);
      assert.match(stdout, /add-billing/);

      const storyDir = path.join(tmpDir, '.zspec', 'stories', 'add-billing');
      assert.ok(fs.existsSync(storyDir), '.zspec/stories/add-billing/ missing');
      assert.ok(fs.existsSync(path.join(storyDir, 'story.md')), 'story.md missing');
      assert.ok(fs.existsSync(path.join(storyDir, 'context.md')), 'context.md missing');
      assert.ok(fs.existsSync(path.join(storyDir, 'tasks.md')), 'tasks.md missing');
      assert.ok(fs.existsSync(path.join(storyDir, 'notes.md')), 'notes.md missing');

      const codebaseDir = path.join(storyDir, 'codebase');
      assert.ok(fs.existsSync(codebaseDir), 'codebase/ missing');
      for (const f of ['STACK.md', 'INTEGRATIONS.md', 'ARCHITECTURE.md', 'STRUCTURE.md', 'CONVENTIONS.md', 'TESTING.md', 'CONCERNS.md']) {
        assert.ok(fs.existsSync(path.join(codebaseDir, f)), `codebase/${f} missing`);
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('slugifies story names with special characters', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zspec-story-slug-'));
    try {
      const { stdout, status } = run(['story', 'User Auth & SSO!'], { cwd: tmpDir });
      assert.equal(status, 0);
      assert.match(stdout, /user-auth-sso/);
      assert.ok(fs.existsSync(path.join(tmpDir, '.zspec', 'stories', 'user-auth-sso', 'story.md')));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('populates story.md with story name and date', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zspec-story-content-'));
    try {
      run(['story', 'my feature'], { cwd: tmpDir });
      const content = fs.readFileSync(
        path.join(tmpDir, '.zspec', 'stories', 'my-feature', 'story.md'), 'utf8'
      );
      assert.match(content, /my feature/i);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('uses templates from .zspec/templates/ when present', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zspec-story-tpl-'));
    try {
      // Scaffold templates via init first
      run(['init'], { cwd: tmpDir });
      // Now create a story — should use the installed templates
      const { status } = run(['story', 'templated story'], { cwd: tmpDir });
      assert.equal(status, 0);
      const storyMd = fs.readFileSync(
        path.join(tmpDir, '.zspec', 'stories', 'templated-story', 'story.md'), 'utf8'
      );
      // Template includes User Story section
      assert.match(storyMd, /User Story/);
      assert.match(storyMd, /Acceptance Criteria/);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('exits with error when no story name is provided', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zspec-story-noname-'));
    try {
      const { status, stderr } = run(['story'], { cwd: tmpDir });
      assert.equal(status, 1);
      assert.match(stderr, /missing <story-name>/);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('exits with error if story already exists', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zspec-story-dup-'));
    try {
      run(['story', 'duplicate'], { cwd: tmpDir });
      const { status, stderr } = run(['story', 'duplicate'], { cwd: tmpDir });
      assert.equal(status, 1);
      assert.match(stderr, /Already exists/);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('prints a Copilot-ready agent prompt', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zspec-story-prompt-'));
    try {
      const { stdout, status } = run(['story', 'new feature'], { cwd: tmpDir });
      assert.equal(status, 0);
      assert.match(stdout, /Copilot \/ agent prompt/);
      assert.match(stdout, /codebase-mapper/);
      assert.match(stdout, /story\.md/);
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

  it('shows tip about zspec/run.mjs', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zspec-status-tip-'));
    try {
      const { stdout } = run(['status'], { cwd: tmpDir });
      assert.match(stdout, /zspec\/run\.mjs/);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('prints recent progress log when present', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zspec-status-log-'));
    try {
      fs.mkdirSync(path.join(tmpDir, 'zspec', 'logs'), { recursive: true });
      fs.writeFileSync(path.join(tmpDir, 'zspec', 'logs', 'progress.md'), '## 2024-01-01\n- did a thing\n');
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

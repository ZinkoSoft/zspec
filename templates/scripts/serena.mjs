#!/usr/bin/env node

import { spawn, execSync } from 'node:child_process';

// Serena is typically run via uv/uvx or a local install.
// Configure the command used to run it via SERENA_CMD, e.g.:
//   SERENA_CMD="uvx --from git+https://github.com/oraios/serena serena" \
//     node scripts/serena.mjs stdio
//   SERENA_CMD="uvx --from git+https://github.com/oraios/serena serena" \
//     node scripts/serena.mjs http --port 9121
//
// Serena docs: https://oraios.github.io/serena/02-usage/020_running.html

const SERENA_CMD = process.env.SERENA_CMD || 'serena';

function isUvxInstalled() {
  try {
    execSync('uvx --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function installUv() {
  console.log('uvx not found. Installing uv (which includes uvx)...');
  try {
    execSync('curl -LsSf https://astral.sh/uv/install.sh | sh', { stdio: 'inherit', shell: true });
    console.log('uv installed successfully. You may need to restart your shell or source your profile.');
  } catch {
    console.error('Failed to install uv. Please install it manually: https://docs.astral.sh/uv/getting-started/installation/');
    process.exit(1);
  }
}

if (SERENA_CMD.includes('uvx') && !isUvxInstalled()) {
  installUv();
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const v = argv[i + 1] && !argv[i + 1].startsWith('-') ? argv[++i] : true;
      out[k] = v;
    } else {
      out._.push(a);
    }
  }
  return out;
}

function run(cmd, args) {
  const [bin, ...binArgs] = cmd.split(/\s+/);
  const child = spawn(bin, [...binArgs, ...args], { stdio: 'inherit' });
  child.on('exit', (code) => process.exit(code ?? 0));
}

const argv = process.argv.slice(2);
const mode = argv[0];
const parsed = parseArgs(argv.slice(1));

if (!mode || mode === 'help' || mode === '--help' || mode === '-h') {
  console.log('Usage: node scripts/serena.mjs <stdio|http> [--port 9121] [--project-from-cwd]');
  console.log('Env: SERENA_CMD="uvx --from git+https://github.com/oraios/serena serena" (or "serena")');
  process.exit(0);
}

const projectFromCwd = parsed['project-from-cwd'] ? ['--project-from-cwd'] : [];

if (mode === 'stdio') {
  // stdio is Serena’s default MCP transport; client usually launches this.
  run(SERENA_CMD, ['start-mcp-server', ...projectFromCwd]);
} else if (mode === 'http') {
  const port = String(parsed.port || '9121');
  // Serena calls this “Streamable HTTP”; clients typically connect to http://localhost:<port>/mcp
  run(SERENA_CMD, ['start-mcp-server', '--transport', 'streamable-http', '--port', port, ...projectFromCwd]);
} else {
  console.error(`Unknown mode: ${mode}`);
  process.exit(1);
}

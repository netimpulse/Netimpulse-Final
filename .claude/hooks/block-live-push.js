#!/usr/bin/env node
// block-live-push.js – PreToolUse-Hook (Bash) für Claude Code.
//
// Aus diesem Repo wird nie in den Live-Shop gepusht. Der Hook blockt jeden
// Shopify-CLI-Aufruf, der das Live-Theme beschreiben oder ein Theme
// veröffentlichen könnte (Exit-Code 2). Erlaubt sind Pushes ins Test-Theme:
//   shopify theme push -e development --nodelete
//
// Test-Theme wechseln: TEST_THEME_ID hier sowie in shopify.theme.toml und
// tests/fixtures.ts ändern.
// Selbsttest: node .claude/hooks/block-live-push.js --self-test
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

const TEST_THEME_ID = '210831737177';
const STORE = 'a50c23-ed.myshopify.com';

const WRITE_SUBCOMMANDS = new Set(['push', 'publish', 'dev']);
const LIVE_LONG = /^--(?:live|allow-live|publish)(?:=|$)/;
const LIVE_SHORT = /^-[A-Za-z]*[lap][A-Za-z]*$/; // -l, -a, -p, auch kombiniert
const LIVE_ENV = /\bSHOPIFY_FLAG_(?:LIVE|ALLOW_LIVE|PUBLISH)\b/;
const PUSH_HINT = /theme\s+(?:push|publish|dev)\b/;

function tokenize(segment) {
  const out = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m;
  while ((m = re.exec(segment))) {
    const t = m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3].replace(/^["']+|["']+$/g, '');
    if (t !== '--') out.push(t);
  }
  return out;
}

// Alle Werte eines Flags: "-e x", "--environment x", "--environment=x".
function flagValues(args, short, long) {
  const vals = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === short || a === long) vals.push(args[++i] || '');
    else if (a.startsWith(long + '=')) vals.push(a.slice(long.length + 1));
    else if (a.startsWith(short + '=')) vals.push(a.slice(short.length + 1));
  }
  return vals.map(v => v.replace(/^["']+|["']+$/g, ''));
}

function findUp(dir, file) {
  for (let d = dir; ; d = path.dirname(d)) {
    if (fs.existsSync(path.join(d, file))) return path.join(d, file);
    if (path.dirname(d) === d) return null;
  }
}

// "-e development" ist nur erlaubt, solange die toml wirklich aufs Test-Theme zeigt.
function checkToml(dir) {
  let txt;
  try { txt = fs.readFileSync(path.join(dir, 'shopify.theme.toml'), 'utf8'); }
  catch { return `In ${dir} liegt keine shopify.theme.toml – Ziel von "-e development" unklar.`; }
  const sec = txt.split(/^\s*\[/m).find(s => s.startsWith('environments.development]'));
  const val = key => sec && (sec.match(new RegExp('^\\s*' + key + '\\s*=\\s*"([^"]*)"', 'm')) || [])[1];
  if (val('theme') !== TEST_THEME_ID) return `shopify.theme.toml (development) zeigt nicht auf das Test-Theme ${TEST_THEME_ID}.`;
  if (val('store') !== STORE) return `shopify.theme.toml (development) zeigt nicht auf ${STORE}.`;
  return null;
}

function checkThemeCall(sub, args, dir) {
  if (sub === 'publish') return '"shopify theme publish" würde ein Theme live schalten.';
  const flag = args.find(a => LIVE_LONG.test(a) || LIVE_SHORT.test(a));
  if (flag) return `Das Flag ${flag} schreibt ins Live-Theme bzw. veröffentlicht.`;
  if (args.some(a => a === '--path' || a.startsWith('--path='))) return '--path ist gesperrt – gepusht wird nur aus dem Projektordner.';
  const envs = flagValues(args, '-e', '--environment');
  const badEnv = envs.find(e => e !== 'development');
  if (badEnv !== undefined) return `Environment "${badEnv}" ist gesperrt, erlaubt ist nur "development".`;
  const themes = flagValues(args, '-t', '--theme');
  const badTheme = themes.find(t => t !== TEST_THEME_ID);
  if (badTheme !== undefined) return `Theme "${badTheme}" ist nicht das Test-Theme ${TEST_THEME_ID}.`;
  const createsNew = args.some(a => /^(?:--unpublished|-u|--development|-d)$/.test(a));
  if (sub === 'push' && !envs.length && !themes.length && !createsNew) return 'Push ohne ausdrückliches Ziel ist gesperrt.';
  return envs.length ? checkToml(dir) : null;
}

function envProblem() {
  const on = k => process.env[k] && !/^(?:0|false|no)$/i.test(process.env[k]);
  if (['SHOPIFY_FLAG_LIVE', 'SHOPIFY_FLAG_ALLOW_LIVE', 'SHOPIFY_FLAG_PUBLISH'].some(on)) return 'In der Umgebung ist SHOPIFY_FLAG_LIVE, _ALLOW_LIVE oder _PUBLISH gesetzt.';
  const t = process.env.SHOPIFY_FLAG_THEME_ID;
  if (t && t !== TEST_THEME_ID) return `In der Umgebung ist SHOPIFY_FLAG_THEME_ID=${t} gesetzt.`;
  const e = process.env.SHOPIFY_FLAG_ENVIRONMENT;
  if (e && e !== 'development') return `In der Umgebung ist SHOPIFY_FLAG_ENVIRONMENT=${e} gesetzt.`;
  return null;
}

function analyze(cmd, startDir, depth = 0) {
  if (depth > 3) return null;
  if (LIVE_ENV.test(cmd)) return 'SHOPIFY_FLAG_LIVE, _ALLOW_LIVE und _PUBLISH sind gesperrt.';
  for (const m of cmd.matchAll(/\bSHOPIFY_FLAG_(THEME_ID|ENVIRONMENT)=["']?([^\s"';&|]+)/g)) {
    if (m[1] === 'THEME_ID' && m[2] !== TEST_THEME_ID) return `SHOPIFY_FLAG_THEME_ID=${m[2]} ist nicht das Test-Theme.`;
    if (m[1] === 'ENVIRONMENT' && m[2] !== 'development') return `SHOPIFY_FLAG_ENVIRONMENT=${m[2]} ist gesperrt.`;
  }
  let dir = startDir;
  for (const seg of cmd.split(/\r?\n|;|&&|\|\||\|/)) {
    const tok = tokenize(seg.trim());
    if (!tok.length) continue;
    if (tok[0].replace(/^\(+/, '') === 'cd') {
      const target = tok[1] || os.homedir();
      dir = /[$`]/.test(target) || target === '-' ? null : path.resolve(dir || '/', target.replace(/^~(?=$|\/)/, os.homedir()));
      continue;
    }
    for (let i = 0; i < tok.length; i++) {
      // bash -c "…", sh -c '…', eval …
      if (/(?:^|\/)(?:ba|da|z|k)?sh$/.test(tok[i]) && tok[i + 1] === '-c' && tok[i + 2]) {
        const r = analyze(tok[i + 2], dir, depth + 1);
        if (r) return r;
      }
      if (tok[i] === 'eval') {
        const r = analyze(tok.slice(i + 1).join(' '), dir, depth + 1);
        if (r) return r;
      }
      // npm run <script> [args] – das Script selbst prüfen
      if (tok[i] === 'npm' && (tok[i + 1] === 'run' || tok[i + 1] === 'run-script') && tok[i + 2]) {
        const pkgFile = dir && findUp(dir, 'package.json');
        let script = null;
        try { script = pkgFile && (JSON.parse(fs.readFileSync(pkgFile, 'utf8')).scripts || {})[tok[i + 2]]; } catch { script = null; }
        if (script) {
          const r = analyze([script].concat(tok.slice(i + 3)).join(' '), path.dirname(pkgFile), depth + 1);
          if (r) return `npm run ${tok[i + 2]}: ${r}`;
        }
      }
      // … theme push | publish | dev … (egal über welchen Aufruf: shopify, npx, node …)
      if (tok[i] === 'theme' && WRITE_SUBCOMMANDS.has(tok[i + 1])) {
        if (cmd.includes('shopify.theme.toml')) return 'shopify.theme.toml im selben Befehl anfassen und pushen ist gesperrt.';
        const issue = envProblem();
        if (issue) return issue;
        if (!dir) return 'Arbeitsordner nicht bestimmbar – Push gesperrt.';
        const r = checkThemeCall(tok[i + 1], tok.slice(i + 2), dir);
        if (r) return r;
      }
    }
  }
  return null;
}

function block(reason) {
  process.stderr.write(`Live-Schutz: ${reason}\nAus diesem Repo wird nie in den Live-Shop gepusht. Erlaubt ist nur: shopify theme push -e development --nodelete (Test-Theme ${TEST_THEME_ID}).\n`);
  process.exit(2);
}

function run(raw) {
  let event = {};
  try { event = JSON.parse(raw || '{}'); } catch { event = {}; }
  const cmd = event && event.tool_input && typeof event.tool_input.command === 'string' ? event.tool_input.command : '';
  if (!cmd) {
    if (PUSH_HINT.test(raw || '')) block('Hook-Eingabe nicht lesbar – Shopify-Push vorsichtshalber gesperrt.');
    process.exit(0);
  }
  const startDir = event.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  let reason = null;
  try { reason = analyze(cmd, startDir); }
  catch (e) { reason = PUSH_HINT.test(cmd) ? `Prüfung fehlgeschlagen (${e.message}) – vorsichtshalber gesperrt.` : null; }
  if (reason) block(reason);
  process.exit(0);
}

function selfTest() {
  const dir = path.resolve(__dirname, '..', '..');
  const cases = [
    ['shopify theme push -e development --nodelete', true],
    ['npx shopify theme push --environment=development --nodelete --only sections/hero.liquid', true],
    [`cd ${dir} && shopify theme push -e development --nodelete`, true],
    ['shopify theme push --theme 210831737177', true],
    ['shopify theme push --unpublished', true],
    ['shopify theme check && npx playwright test', true],
    ['shopify theme list --store a50c23-ed.myshopify.com --role live', true],
    ['shopify theme dev', true],
    ['npm run theme:push:dev', true],
    ['git commit -m "chore: shopify theme publish blocken"', true],
    ['shopify theme push --live', false],
    ['shopify theme push -e development --allow-live', false],
    ['shopify theme push -e development -p', false],
    ['shopify theme push -t 200815771993 -a', false],
    ['shopify theme push -e production', false],
    ['shopify theme push', false],
    ['shopify theme push --theme=200815771993', false],
    ['shopify theme publish --theme 210831737177', false],
    ['shopify theme dev --theme 200815771993', false],
    ['SHOPIFY_FLAG_ALLOW_LIVE=1 shopify theme push -e development', false],
    ['bash -c "shopify theme push --live"', false],
    ['npm run theme:push:dev -- --live', false],
    ['npm exec shopify -- theme push --live', false],
    ['node node_modules/@shopify/cli/bin/run.js theme publish', false],
    ['cd /tmp && shopify theme push -e development', false],
    ["sed -i 's/210831737177/200815771993/' shopify.theme.toml && shopify theme push -e development", false],
  ];
  let failed = 0;
  for (const [cmd, allowed] of cases) {
    const reason = analyze(cmd, dir);
    if ((reason === null) !== allowed) {
      failed++;
      console.log(`FEHLER (${allowed ? 'fälschlich blockiert' : 'fälschlich erlaubt'}): ${cmd}${reason ? ' → ' + reason : ''}`);
    }
  }
  console.log(failed ? `self-test: FEHLER (${failed} von ${cases.length})` : `self-test: OK (${cases.length} Fälle)`);
  process.exit(failed ? 1 : 0);
}

if (process.argv.includes('--self-test')) selfTest();
else {
  let data = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', c => (data += c));
  process.stdin.on('end', () => run(data));
  setTimeout(() => run(data), 5000).unref();
}

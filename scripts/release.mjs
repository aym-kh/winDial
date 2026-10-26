#!/usr/bin/env node
/**
 * Release helper for WinDial.
 *
 * Bumps the package version, folds the CHANGELOG's [Unreleased] section into
 * a dated one, creates a git commit + annotated tag (v*) and pushes both.
 * The `v*` tag push is what triggers the workflow.
 *
 * Usage:
 *   npm run release -- patch | minor | major [--dry-run]
 *
 * Examples:
 *   npm run release -- patch
 *   npm run release -- minor --dry-run
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const bump = args.find((a) => !a.startsWith('--')) ?? 'patch';

const rootDir = path.resolve(import.meta.dirname, '..');

const fail = (message) => {
  console.error(`\n  ✖ ${message}\n`);
  process.exit(1);
};

/** Executes a command, unless in dry-run (logs instead). */
const run = (command, options = {}) => {
  console.log(`  ▸ ${command}`);
  if (dryRun) return '';
  return execSync(command, { cwd: rootDir, encoding: 'utf8', ...options });
};

/** Read-only command that executes even during dry-run (for validation). */
const probe = (command) =>
  execSync(command, { cwd: rootDir, encoding: 'utf8' });

if (!['patch', 'minor', 'major'].includes(bump)) {
  fail(`Unknown bump type "${bump}". Use: patch, minor or major.`);
}

console.log(`\n  Preparing ${bump} release${dryRun ? ' (dry-run)' : ''}\n`);

// 1. Guard: clean working tree on real runs.
const dirty = probe('git status --porcelain').trim().length > 0;
if (dirty && !dryRun) {
  fail('Working tree is not clean. Commit or stash your changes first.');
}
if (dirty && dryRun) {
  console.log('  ⚠ working tree is dirty — continuing anyway in dry-run mode\n');
}

// 2. Guard: tests must pass.
console.log('  • Running tests');
if (dryRun) {
  console.log('  ▸ npm test -- --watch=false  (skipped in dry-run)\n');
} else {
  run('npm test -- --watch=false', { stdio: 'inherit' });
  console.log('  ✔ tests passed\n');
}

// 3. Compute the next version.
const pkgPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

function bumpVersion(version, part) {
  const [major, minor, patch] = version.split('.').map(Number);
  if ([major, minor, patch].some((n) => Number.isNaN(n))) {
    fail(`Bad version in package.json: "${version}".`);
  }
  if (part === 'major') return `${major + 1}.0.0`;
  if (part === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

const currentVersion = pkg.version;
const nextVersion = bumpVersion(currentVersion, bump);
const tagName = `v${nextVersion}`;
if (probe(`git tag -l ${tagName}`).trim()) {
  fail(`${tagName} already exists.`);
}
console.log(`  • Version: ${currentVersion} -> ${nextVersion}\n`);

// 4. Bump package.json + package-lock.json.
run(`npm version ${nextVersion} --no-git-tag-version`);

// 5. Fold the CHANGELOG's [Unreleased] into a dated section.
const changelogPath = path.join(rootDir, 'CHANGELOG.md');
const changelog = readFileSync(changelogPath, 'utf8');
if (!changelog.includes('## [Unreleased]')) {
  fail('CHANGELOG.md has no "## [Unreleased]" section to fold.');
}
const today = new Date().toISOString().slice(0, 10);
const datedChangelog = changelog.replace(
  '## [Unreleased]',
  `## [Unreleased]\n\n## [${nextVersion}] - ${today}`,
);
if (dryRun) {
  console.log('  ▸ CHANGELOG.md: would fold [Unreleased] into a dated section');
} else {
  writeFileSync(changelogPath, datedChangelog);
  console.log(`  ▸ CHANGELOG.md: [Unreleased] folded into [${nextVersion}] - ${today}`);
}

// 6. Commit, tag and push (the v* tag triggers the Netlify deploy).
const branch = probe('git rev-parse --abbrev-ref HEAD').trim();
run('git add package.json package-lock.json CHANGELOG.md');
run(`git commit -m "chore(release): ${nextVersion}"`);
run(`git tag -a ${tagName} -m "Release ${nextVersion}"`);
run(`git push --follow-tags origin ${branch}`);

console.log(`
  ✔ Release ${dryRun ? 'preview' : 'pipeline'} complete
      ${currentVersion} -> ${nextVersion} on ${branch}
      tag ${tagName} -> Netlify deploy workflow
`);

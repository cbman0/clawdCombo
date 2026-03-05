#!/usr/bin/env node

/**
 * clawdCombo Commit Helper
 *
 * Interactive CLI for generating standardized Conventional Commits.
 * Features:
 * - Interactive type selection with descriptions and emojis
 * - Scope input with validation
 * - Subject validation (max 50 chars, lowercase start, no trailing period)
 * - Optional body and breaking change footer
 * - Preview before committing
 * - Actions: commit, copy to clipboard, edit in $EDITOR, cancel
 * - Colorful output
 *
 * Usage: node tools/commit-helper.js
 *   or: npm run commit (if added to package.json)
 */

const readline = require('readline');
const { execSync, spawn } = require('child_process');

// Conventional Commits types with emojis
const TYPES = [
  { value: 'feat', emoji: '✨', desc: 'A new feature' },
  { value: 'fix', emoji: '🐛', desc: 'A bug fix' },
  { value: 'docs', emoji: '📚', desc: 'Documentation changes' },
  { value: 'style', emoji: '💅', desc: 'Code style changes (formatting, no code change)' },
  { value: 'refactor', emoji: '♻️', desc: 'Code refactoring' },
  { value: 'perf', emoji: '⚡', desc: 'Performance improvements' },
  { value: 'test', emoji: '✅', desc: 'Adding or fixing tests' },
  { value: 'chore', emoji: '🧹', desc: 'Build process, tooling, dependencies' },
  { value: 'ci', emoji: '🤖', desc: 'CI/CD changes' },
  { value: 'build', emoji: '🔨', desc: 'Build system changes' }
];

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m'
};

function cprint(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function createRl() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

async function prompt(question, rl) {
  return new Promise(resolve => {
    rl.question(question, answer => resolve(answer.trim()));
  });
}

function selectType() {
  return new Promise((resolve) => {
    const rl = createRl();
    console.log('');
    cprint('Select commit type:', 'bright');
    TYPES.forEach((t, i) => {
      cprint(`  ${i + 1}) ${t.emoji} ${t.value.padEnd(10)} - ${t.desc}`, 'cyan');
    });
    console.log('');

    const ask = () => {
      rl.question('Enter number (1-' + TYPES.length + '): ', answer => {
        rl.close();
        const num = parseInt(answer, 10);
        if (isNaN(num) || num < 1 || num > TYPES.length) {
          cprint('Invalid choice. Please try again.', 'red');
          ask();
        } else {
          resolve(TYPES[num - 1].value);
        }
      });
    };
    ask();
  });
}

function validateSubject(subject) {
  if (!subject) {
    return { ok: false, error: 'Subject is required' };
  }
  if (subject.length > 50) {
    return { ok: false, error: `Subject exceeds 50 characters (currently ${subject.length})` };
  }
  if (subject[0] !== subject[0].toLowerCase()) {
    return { ok: false, error: 'Subject should start with lowercase' };
  }
  if (subject.endsWith('.')) {
    return { ok: false, error: 'Subject should not end with a period' };
  }
  if (/\s/.test(subject)) {
    return { ok: false, error: 'Subject should be a single line' };
  }
  return { ok: true };
}

function copyToClipboard(text) {
  try {
    if (process.platform === 'darwin') {
      execSync(`printf "%s" "${text.replace(/"/g, '\\"')}" | pbcopy`);
    } else if (process.platform === 'linux') {
      execSync(`printf "%s" "${text.replace(/"/g, '\\"')}" | xclip -selection clipboard`, { stdio: 'ignore' });
    } else if (process.platform === 'win32') {
      execSync(`echo ${text} | clip`, { shell: true });
    } else {
      throw new Error('Unsupported platform');
    }
    cprint('✓ Copied to clipboard!', 'green');
    return true;
  } catch (err) {
    cprint('⚠ Could not copy to clipboard', 'yellow');
    console.log(text);
    return false;
  }
}

async function gatherCommitInfo() {
  const rl = createRl();

  try {
    cprint('\n┌─────────────────────────────────────────────────────────────┐', 'cyan');
    cprint('│         clawdCombo Commit Helper                          │', 'cyan');
    cprint('└─────────────────────────────────────────────────────────────┘\n', 'cyan');

    // Type
    const type = await selectType();

    // Scope
    const scope = await prompt('Scope (optional, e.g., "ui", "contracts", "api"): ', rl);

    // Subject
    let subject = '';
    while (true) {
      subject = await prompt('Subject (required, max 50 chars, lowercase start): ', rl);
      const validation = validateSubject(subject);
      if (validation.ok) break;
      cprint('  ✗ ' + validation.error, 'red');
    }

    // Body
    const body = await prompt('Body (optional, press Enter to skip): ', rl);

    // Breaking change?
    const breakingAnswer = await prompt('Breaking change? (y/N): ', rl);
    const hasBreaking = breakingAnswer.toLowerCase() === 'y';

    // Footer
    let footer = '';
    if (hasBreaking) {
      footer = 'BREAKING CHANGE: ' + (await prompt('Describe breaking change: ', rl) || '(no description)');
    } else if (body) {
      const footerPrompt = await prompt('Footer (e.g., "Closes #123", "Co-authored-by: ..."). Press Enter to skip: ', rl);
      if (footerPrompt) footer = footerPrompt;
    }

    // Build message
    let commitMsg = type;
    if (scope) commitMsg += `(${scope})`;
    commitMsg += `: ${subject}`;
    if (body) commitMsg += `\n\n${body}`;
    if (footer) commitMsg += `\n\n${footer}`;

    // Preview
    cprint('\n┌─────────────────────────────────────────────────────────────┐', 'magenta');
    cprint('│         Commit Message Preview                            │', 'magenta');
    cprint('└─────────────────────────────────────────────────────────────┘', 'magenta');
    console.log(commitMsg);
    console.log('');
    cprint(`Format: ${type}${scope ? `(${scope})` : ''}: <subject>`, 'dim');
    console.log('');

    // Action
    const action = await prompt('Action: (Y)es, (e)dit, (c)opy, (n)o: ', rl);
    rl.close();

    return { commitMsg, action: action.toLowerCase() };
  } catch (err) {
    if (rl) rl.close();
    throw err;
  }
}

function main() {
  try {
    const { commitMsg, action } = await gatherCommitInfo();

    if (action === 'n') {
      cprint('Commit cancelled.', 'yellow');
      return;
    }

    if (action === 'e') {
      const editor = process.env.EDITOR || 'vi';
      const tmpFile = `/tmp/commit-msg-${Date.now()}.txt`;
      require('fs').writeFileSync(tmpFile, commitMsg);
      execSync(`${editor} ${tmpFile}`, { stdio: 'inherit' });
      const edited = require('fs').readFileSync(tmpFile, 'utf8').trim();
      require('fs').unlinkSync(tmpFile);
      if (!edited) {
        cprint('Empty commit message, aborting.', 'red');
        return;
      }
      commitMsg = edited;
    }

    if (action === 'c') {
      copyToClipboard(commitMsg);
      return;
    }

    // Default yes
    if (action === '' || action === 'y') {
      // Check staged changes
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      if (!status.trim()) {
        cprint('No changes to commit. Stage files first with git add.', 'yellow');
        return;
      }

      // Execute commit
      try {
        execSync(`git commit -m ${JSON.stringify(commitMsg)}`, { stdio: 'inherit' });
        cprint('✓ Commit created successfully!', 'green');
      } catch (err) {
        cprint('✗ Commit failed: ' + err.message, 'red');
        process.exit(1);
      }
    }
  } catch (err) {
    if (err.code === 'EAGAIN') return; // Likely interrupted
    cprint('Error: ' + err.message, 'red');
    process.exit(1);
  }
}

main();

/* @v0idd0/interviewprep smoke tests — run with `node test.js`. */

'use strict';

const { execFileSync } = require('child_process');
const path = require('path');
const { formatBrief, validateBrief, simplifyBrief, FORMATS } = require('./src/index.js');

let pass = 0, fail = 0;
function ok(label, cond) {
  if (cond) { pass++; console.log('  ok   ' + label); }
  else      { fail++; console.log('  FAIL ' + label); }
}
function eq(label, a, b) { ok(label + ' → ' + JSON.stringify(b), a === b); }
function throws(label, fn) {
  try { fn(); fail++; console.log('  FAIL ' + label + ' (did not throw)'); }
  catch (_) { pass++; console.log('  ok   ' + label); }
}

const BRIEF = {
  role: 'Senior Frontend Engineer',
  org: 'Acme Corp · Remote · posted 2 days ago',
  questions: [
    { q: 'Tell me about a complex frontend migration you led.',
      star: 'Pick the React 16 → 18 migration; quantify perf gains.' },
    { q: 'How do you balance accessibility against velocity?',
      star: 'Reference your axe-core CI gate; cite the audit you shipped.' },
    { q: 'Describe a time you disagreed with a designer.',
      star: 'Use the modal-overlay debate; show data won, ego didn\'t.' },
    { q: 'What is your approach to performance budgets?',
      star: 'Walk through Lighthouse CI gating; mention the 3KB-LCP win.' },
    { q: 'Why this team?',
      star: 'Tie their stack (Next.js + Postgres) to your last shipped feature.' },
  ],
  company: {
    summary: 'Series-B SaaS for ops teams. Hybrid (NYC HQ).',
    facts: {
      stage: 'Series B ($45M)',
      team: '~80 engineers',
      stack: 'Next.js, Go, Postgres',
      leadership: 'CTO ex-Stripe; VP Eng ex-Linear',
    },
  },
};

console.log('@v0idd0/interviewprep — library tests');

// ── validateBrief
ok('validateBrief accepts valid', validateBrief(BRIEF) === true);
throws('validateBrief rejects null', () => validateBrief(null));
throws('validateBrief rejects array', () => validateBrief({ questions: 'nope' }));

// ── simplifyBrief
const s = simplifyBrief(BRIEF);
eq('simplify keeps role', s.role, 'Senior Frontend Engineer');
eq('simplify keeps 5 questions', s.questions.length, 5);
eq('simplify keeps 4 facts', Object.keys(s.company.facts).length, 4);

// missing fields
const minimal = { questions: [{ q: 'Why us?' }] };
const m = simplifyBrief(minimal);
eq('minimal: role becomes null', m.role, null);
eq('minimal: org becomes null', m.org, null);
eq('minimal: 1 question', m.questions.length, 1);
eq('minimal: question star is null', m.questions[0].star, null);
eq('minimal: empty facts', Object.keys(m.company.facts).length, 0);

// ── formatBrief (markdown)
const md = formatBrief(BRIEF, 'markdown');
ok('md has h1 with role', md.includes('# Senior Frontend Engineer'));
ok('md has 5 likely questions header', md.includes('## 5 likely questions'));
ok('md has STAR label', md.includes('**STAR:**'));
ok('md has company section', md.includes('## Company'));
ok('md has voiddo footer', md.includes('vøiddo'));
ok('md includes facts table', md.includes('| key | value |'));

// ── formatBrief (plain)
const plain = formatBrief(BRIEF, 'plain');
ok('plain has role line', plain.startsWith('Senior Frontend Engineer'));
ok('plain has STAR: prefix', plain.includes('STAR:'));
ok('plain has Company header', plain.includes('Company'));

// ── formatBrief (json)
const j = JSON.parse(formatBrief(BRIEF, 'json'));
eq('json tool field', j.tool, 'interviewprep');
eq('json role', j.role, 'Senior Frontend Engineer');
eq('json question count', j.questions.length, 5);
ok('json has generated_at iso', /^\d{4}-\d{2}-\d{2}T/.test(j.generated_at));

// ── formatBrief (readme)
const rd = formatBrief(BRIEF, 'readme');
ok('readme has main h1', rd.startsWith('# Senior Frontend Engineer'));
ok('readme has Q1 heading', rd.includes('### Q1.'));
ok('readme has Company research', rd.includes('## Company research'));
ok('readme cites extension URL', rd.includes('https://extensions.voiddo.com/interviewprep/'));
ok('readme has studio attribution', rd.includes('Built by [vøiddo]'));

// ── unknown format defaults to markdown (safe fallback)
const fallback = formatBrief(BRIEF, 'banana');
ok('unknown format falls back to markdown', fallback.includes('# Senior Frontend Engineer'));

// ── FORMATS export
eq('FORMATS length', FORMATS.length, 4);
ok('FORMATS contains markdown', FORMATS.includes('markdown'));
ok('FORMATS contains readme', FORMATS.includes('readme'));

// ── markdown escaping (defence against weird inputs)
const naughty = simplifyBrief({
  role: 'Engineer [Senior]',
  questions: [{ q: 'Use *italic* and `code` — careful.', star: '_underscore_' }],
});
const md2 = formatBrief(naughty, 'markdown');
ok('md escapes brackets in role', md2.includes('Engineer \\[Senior\\]'));
ok('md escapes asterisks', md2.includes('\\*italic\\*'));
ok('md escapes backticks', md2.includes('\\`code\\`'));

// ── CLI smoke
const CLI = path.join(__dirname, 'bin', 'interviewprep.js');
const cliMd = execFileSync('node', [CLI, '--format=markdown'], {
  input: JSON.stringify(BRIEF),
  encoding: 'utf8',
});
ok('CLI markdown matches lib output structure', cliMd.includes('# Senior Frontend Engineer') && cliMd.includes('## 5 likely questions'));

const cliJson = execFileSync('node', [CLI, '-f', 'json'], {
  input: JSON.stringify(BRIEF),
  encoding: 'utf8',
});
const cj = JSON.parse(cliJson);
eq('CLI json questions count', cj.questions.length, 5);

const cliVer = execFileSync('node', [CLI, '--version'], { encoding: 'utf8' }).trim();
ok('CLI --version prints semver', /^\d+\.\d+\.\d+$/.test(cliVer));

console.log('');
console.log(pass + ' passed, ' + fail + ' failed');
if (fail > 0) process.exit(1);

#!/usr/bin/env node
/* @v0idd0/interviewprep CLI — read an interview brief (JSON), print formatted.
   Input shape (already-generated brief):
     {
       "role":   "Senior Frontend Engineer",
       "org":    "Acme Corp",
       "questions": [{"q":"...","star":"..."}, ...],
       "company": { "summary":"...", "facts": {"stage":"Series B", ...} }
     }
   Reads from --file=<path>, or stdin if no file given.

   The CLI does NOT call any AI — it only formats a brief you already have.
   To generate a brief, install the interviewprep browser extension. */

'use strict';

const fs = require('fs');
const { formatBrief, FORMATS } = require('../src/index.js');

const HELP = `interviewprep — format an interview prep brief as markdown / plain / json / readme

usage:
  interviewprep [options]                 # reads JSON from stdin
  interviewprep --file=brief.json         # reads from file
  cat brief.json | interviewprep -f readme

options:
  -f, --format=<fmt>      one of: ${FORMATS.join(', ')}    (default: markdown)
  -i, --file=<path>       read JSON brief from file instead of stdin
  -h, --help              this help
  -v, --version           print version

input shape (already-generated brief):
  {
    "role": "Senior Frontend Engineer",
    "org":  "Acme Corp",
    "questions": [
      { "q": "Tell me about a time you ...",
        "star": "Pick a story where you led a migration; quantify the impact." }
    ],
    "company": {
      "summary": "...",
      "facts":   { "stage": "Series B", "team": "~80", "stack": "Go + React" }
    }
  }

examples:
  interviewprep < brief.json
  interviewprep --file=brief.json --format=json
  curl -s https://example.com/brief.json | interviewprep -f readme > prep.md

To generate a brief from a job posting, install the interviewprep browser extension.

free, MIT, zero telemetry. https://extensions.voiddo.com/interviewprep/
`;

function parseArgs(argv) {
  const opts = { format: 'markdown', file: null, help: false, version: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-h' || a === '--help') opts.help = true;
    else if (a === '-v' || a === '--version') opts.version = true;
    else if (a === '-f') opts.format = argv[++i];
    else if (a.startsWith('--format=')) opts.format = a.slice('--format='.length);
    else if (a === '-i') opts.file = argv[++i];
    else if (a.startsWith('--file=')) opts.file = a.slice('--file='.length);
    else if (a.startsWith('-')) {
      console.error('interviewprep: unknown option ' + a);
      process.exit(2);
    }
  }
  return opts;
}

function readStdin(stream = process.stdin) {
  return new Promise((resolve, reject) => {
    let data = '';
    if (stream.isTTY) {
      reject(new Error('no input on stdin and no --file given. try `interviewprep --help`.'));
      return;
    }
    stream.setEncoding('utf8');
    stream.on('data', chunk => data += chunk);
    stream.on('end', () => resolve(data));
    stream.on('error', reject);
  });
}

async function runCli(argv, env = {}) {
  const opts = parseArgs(argv);
  if (opts.help) return { code: 0, stdout: HELP, stderr: '' };
  if (opts.version) {
    const pkg = require('../package.json');
    return { code: 0, stdout: pkg.version + '\n', stderr: '' };
  }
  if (!FORMATS.includes(opts.format)) {
    return {
      code: 2,
      stdout: '',
      stderr: 'interviewprep: unknown format "' + opts.format + '" — must be one of: ' + FORMATS.join(', ') + '\n',
    };
  }
  let raw;
  try {
    if (opts.file) raw = (env.readFileSync || fs.readFileSync)(opts.file, 'utf8');
    else if (Object.prototype.hasOwnProperty.call(env, 'stdinText')) raw = env.stdinText;
    else raw = await readStdin(env.stdin || process.stdin);
  } catch (e) {
    return { code: 1, stdout: '', stderr: 'interviewprep: ' + e.message + '\n' };
  }
  let brief;
  try {
    brief = JSON.parse(raw);
  } catch (e) {
    return { code: 1, stdout: '', stderr: 'interviewprep: input is not valid JSON: ' + e.message + '\n' };
  }
  let out;
  try {
    out = formatBrief(brief, opts.format);
  } catch (e) {
    return { code: 1, stdout: '', stderr: 'interviewprep: ' + e.message + '\n' };
  }
  return { code: 0, stdout: out, stderr: '' };
}

async function main() {
  const result = await runCli(process.argv);
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.code) process.exit(result.code);
}

if (require.main === module) {
  main().catch(e => { console.error('interviewprep: ' + e.message); process.exit(1); });
}

module.exports = {
  HELP,
  parseArgs,
  runCli,
};

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

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    if (process.stdin.isTTY) {
      reject(new Error('no input on stdin and no --file given. try `interviewprep --help`.'));
      return;
    }
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

async function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) { process.stdout.write(HELP); return; }
  if (opts.version) {
    const pkg = require('../package.json');
    process.stdout.write(pkg.version + '\n');
    return;
  }
  if (!FORMATS.includes(opts.format)) {
    console.error('interviewprep: unknown format "' + opts.format + '" — must be one of: ' + FORMATS.join(', '));
    process.exit(2);
  }
  let raw;
  try {
    raw = opts.file ? fs.readFileSync(opts.file, 'utf8') : await readStdin();
  } catch (e) {
    console.error('interviewprep: ' + e.message);
    process.exit(1);
  }
  let brief;
  try {
    brief = JSON.parse(raw);
  } catch (e) {
    console.error('interviewprep: input is not valid JSON: ' + e.message);
    process.exit(1);
  }
  let out;
  try {
    out = formatBrief(brief, opts.format);
  } catch (e) {
    console.error('interviewprep: ' + e.message);
    process.exit(1);
  }
  process.stdout.write(out);
}

main().catch(e => { console.error('interviewprep: ' + e.message); process.exit(1); });

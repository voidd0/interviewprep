/* interviewprep popup logic — extracts active-tab page text, sends to backend, renders the brief.
   All rendering uses safe DOM methods (textContent / createElement) — never innerHTML on backend output. */

const API = 'https://scrb.voiddo.com/api/v1/ext/interviewprep/generate-free';

const $ = (id) => document.getElementById(id);
const show = (id, on = true) => { const el = $(id); if (on) el.removeAttribute('hidden'); else el.setAttribute('hidden', ''); };
const setStatus = (msg) => {
  const el = $('status');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 1600);
};
const clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); };

async function getApiKeyAndUsage() {
  const stored = await new Promise((resolve) => {
    if (chrome?.storage?.local?.get) {
      chrome.storage.local.get(['ipClientId', 'ipUsage'], resolve);
    } else {
      resolve({});
    }
  });
  let id = stored.ipClientId;
  if (!id) {
    id = 'ip_' + crypto.randomUUID();
    await chrome.storage.local.set({ ipClientId: id });
  }
  return { id, usage: stored.ipUsage || { used: 0, limit: 5 } };
}

function renderCounter(usage) {
  const counter = $('counter');
  if (usage.limit === -1) {
    counter.textContent = 'Pro · unlimited';
  } else {
    counter.textContent = `${usage.used} / ${usage.limit} free`;
  }
}

async function readActiveTabText() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error('no active tab');
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    throw new Error('open a job posting page first — this looks like a chrome internal page.');
  }
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
      const blocks = [];
      const push = (value) => {
        const text = clean(value);
        if (text && !blocks.includes(text)) blocks.push(text);
      };

      push(document.title);
      push(location.href);
      push(document.querySelector('meta[name="description"]')?.content);
      push(document.querySelector('meta[property="og:title"]')?.content);
      push(document.querySelector('meta[property="og:description"]')?.content);

      document.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
        try {
          const parsed = JSON.parse(script.textContent || '{}');
          const items = Array.isArray(parsed) ? parsed : [parsed];
          items.flatMap((item) => item?.['@graph'] || item).forEach((item) => {
            if (!item || !String(item['@type'] || '').toLowerCase().includes('jobposting')) return;
            push(item.title);
            push(item.hiringOrganization?.name);
            push(item.jobLocation?.address?.addressLocality || item.jobLocation?.address?.addressCountry);
            push(item.employmentType);
            push(item.description);
            push(item.responsibilities);
            push(item.qualifications);
            push(item.skills);
          });
        } catch (_) {
          /* ignore invalid embedded JSON-LD */
        }
      });

      [
        'h1',
        '[data-testid*="job"]',
        '[class*="jobs-unified-top-card"]',
        '[class*="top-card-layout"]',
        '[class*="job-details"]',
        '[class*="jobs-description"]',
        '[class*="show-more-less-html"]',
        '[class*="description"]',
        'main',
        'article',
        '[role="main"]',
      ].forEach((selector) => {
        document.querySelectorAll(selector).forEach((node) => push(node.innerText || node.textContent));
      });

      const bodyText = clean(document.body?.innerText || '');
      if (blocks.join('\n').length < 500) push(bodyText);
      const txt = blocks.join('\n\n') || bodyText || `${document.title}\n${location.href}\nNo readable job posting text was found on this page.`;
      return {
        url: location.href,
        title: document.title,
        text: txt.slice(0, 12000),
      };
    },
  });
  return result;
}

function renderResult(brief) {
  $('role-title').textContent = brief.role || 'Role';
  $('role-org').textContent = brief.org || '';

  const ol = $('qs-list');
  clear(ol);
  (brief.questions || []).forEach((q) => {
    const li = document.createElement('li');
    li.appendChild(document.createTextNode(q.q || ''));
    if (q.star) {
      const span = document.createElement('span');
      span.className = 'ip-q-star';
      span.textContent = q.star;
      li.appendChild(span);
    }
    ol.appendChild(li);
  });

  $('company-summary').textContent = brief.company?.summary || '';
  const ul = $('company-facts');
  clear(ul);
  Object.entries(brief.company?.facts || {}).forEach(([k, v]) => {
    const li = document.createElement('li');
    const key = document.createElement('span');
    key.className = 'ip-fact-key';
    key.textContent = k;
    const val = document.createElement('span');
    val.textContent = String(v);
    li.appendChild(key);
    li.appendChild(val);
    ul.appendChild(li);
  });

  show('hero', false);
  show('loading', false);
  show('error', false);
  show('result', true);
}

function buildLocalFallbackBrief(page, usage) {
  const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
  const text = clean(`${page.title || ''} ${page.text || ''}`);
  const title = clean(page.title).split(/\s+[|–—-]\s+/)[0] || 'Job posting not detected';
  let org = '';
  try { org = new URL(page.url || '').hostname.replace(/^www\./, ''); } catch (_) { org = ''; }
  const atMatch = text.match(/\bat\s+([A-Z][A-Za-z0-9&.,' -]{2,60})/);
  if (atMatch) org = atMatch[1].replace(/[., -]+$/, '');

  const keywordPool = [
    'React', 'TypeScript', 'JavaScript', 'Python', 'SQL', 'Postgres',
    'accessibility', 'performance', 'testing', 'API', 'dashboard',
    'design system', 'leadership', 'stakeholders', 'customer', 'data',
    'security', 'scale', 'remote', 'collaboration',
  ];
  const anchors = keywordPool.filter((kw) => new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text));
  if (!anchors.length) anchors.push('the core responsibilities', 'the required experience', 'the business context');
  const anchor = (i) => anchors[i % anchors.length];
  const remaining = usage.limit === -1 ? null : Math.max(0, (usage.limit || 5) - (usage.used || 0) - 1);

  return {
    role: title.slice(0, 180),
    org,
    questions: [
      {
        q: `Which past project best proves you can handle ${anchor(0)} in this role?`,
        star: `STAR: Pick one concrete project tied to ${anchor(0)}. Name the situation, your decision, the tradeoff, and the measurable result.`,
      },
      {
        q: `Describe a difficult implementation or judgement call involving ${anchor(1)}.`,
        star: `STAR: Use an example where ${anchor(1)} forced a real tradeoff. Show what you chose, who was affected, and what improved.`,
      },
      {
        q: `How would you explain your approach to ${anchor(2)} to this team?`,
        star: `STAR: Ground the answer in one system, process, or workflow you changed. Avoid abstractions; show before, action, and after.`,
      },
      {
        q: 'What would you ask the hiring manager after reading this posting?',
        star: 'STAR: Prepare one question about success metrics, one about team process, and one about the hardest first-quarter problem.',
      },
      {
        q: 'What risk in your background might the interviewer probe, and how will you answer it directly?',
        star: 'STAR: Choose the gap honestly. Pair it with adjacent experience, a fast-learning example, and evidence that you can close it.',
      },
    ],
    company: {
      summary: 'The remote generation layer was temporarily unavailable, so this brief uses only the text visible on the current page. Verify company details before the interview.',
      facts: {
        stage: 'unknown',
        team: 'unknown',
        stack: anchors.slice(0, 4).join(', ') || 'unknown',
        leadership: 'unknown',
      },
    },
    limit: usage.limit ?? 5,
    remaining,
  };
}

async function generate() {
  show('hero', false);
  show('error', false);
  show('result', false);
  show('loading', true);
  try {
    const { id, usage } = await getApiKeyAndUsage();
    if (usage.limit !== -1 && usage.used >= usage.limit) {
      throw new Error('You hit your free limit (5 / month). Upgrade for unlimited at extensions.voiddo.com/interviewprep/pricing/');
    }
    const page = await readActiveTabText();
    let brief;
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'X-Install-Id': id },
        body: JSON.stringify(page),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const detail = typeof err.detail === 'string' ? err.detail : err.detail?.reason;
        const apiErr = new Error(err.error?.message || detail || `backend error ${res.status}`);
        apiErr.status = res.status;
        throw apiErr;
      }
      brief = await res.json();
    } catch (apiErr) {
      if (apiErr.status && apiErr.status < 500) throw apiErr;
      brief = buildLocalFallbackBrief(page, usage);
      setStatus('generated locally');
    }
    const newUsage = { used: usage.used + 1, limit: brief.limit ?? usage.limit };
    await chrome.storage.local.set({ ipUsage: newUsage });
    renderCounter(newUsage);
    renderResult(brief);
  } catch (e) {
    $('error-text').textContent = e.message;
    show('loading', false);
    show('error', true);
  }
}

async function copyAll() {
  const role = $('role-title').textContent;
  const org = $('role-org').textContent;
  const qs = Array.from($('qs-list').querySelectorAll('li')).map((li, i) => {
    const star = li.querySelector('.ip-q-star')?.textContent || '';
    const q = li.textContent.replace(star, '').trim();
    return `${i + 1}. ${q}\n   STAR: ${star}`;
  }).join('\n\n');
  const summary = $('company-summary').textContent;
  const facts = Array.from($('company-facts').querySelectorAll('li')).map((li) => {
    const k = li.querySelector('.ip-fact-key').textContent;
    const v = li.lastChild.textContent;
    return `- ${k}: ${v}`;
  }).join('\n');
  const out = `# ${role}\n${org}\n\n## 5 likely questions\n\n${qs}\n\n## Company\n\n${summary}\n\n${facts}\n\n--\nGenerated by interviewprep · vøiddo`;
  await navigator.clipboard.writeText(out);
  setStatus('copied');
}

document.addEventListener('DOMContentLoaded', async () => {
  const { usage } = await getApiKeyAndUsage();
  renderCounter(usage);
  $('generate').addEventListener('click', generate);
  $('retry').addEventListener('click', generate);
  $('copy-all').addEventListener('click', copyAll);
  $('email-me').addEventListener('click', () => {
    setStatus('coming soon');
  });
});

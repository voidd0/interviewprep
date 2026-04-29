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
      const main = document.querySelector('main, article, [role="main"], #content, .content') || document.body;
      const txt = main.innerText || document.body.innerText || '';
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
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-Install-Id': id },
      body: JSON.stringify(page),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `backend error ${res.status}`);
    }
    const brief = await res.json();
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

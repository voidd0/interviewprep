# interviewprep

> Open a job posting, click the icon. Get 5 likely questions, STAR-format answer prompts, and a company research card.

A browser extension for Chrome, Firefox, and Edge. Manifest V3.

## Why

Walking into an interview cold costs you the offer. Walking in with the wrong prep costs you a week. interviewprep reads the job posting on your active tab and turns it into a prep brief in about 12 seconds — questions tailored to the role, scaffolds telling you what to ground each answer in, plus a research card so you know who you're talking to before the call.

## How it works

1. Open a job posting on any tab — LinkedIn, Indeed, Greenhouse, Lever, Workday, most career pages.
2. Click the interviewprep icon in your browser toolbar.
3. Click *Generate prep brief →*.
4. The extension reads the visible text of the active tab via `chrome.scripting.executeScript`, sends it to `api.voiddo.com/v1/interviewprep/generate`, and renders:
   - Detected role + company + posting age.
   - 5 likely interview questions with STAR-format answer scaffolds.
   - A company research card: stage, team, stack, leadership.

## Pricing

- **Free tier** — 5 generations / month. No account required; quota tracked locally.
- **Pro** — $6.99 / month or $59.99 / year. 100 generations / month. Sign in via the upgrade page on the [extension portal page](https://extensions.voiddo.com/interviewprep/).

## Install

Public-store builds (recommended once submitted):
- Chrome: *coming soon*
- Firefox: *coming soon*
- Edge: *coming soon*

Sideload (now):
- Chrome / Edge: `chrome://extensions` → Developer mode → *Load unpacked* → pick `chrome/`.
- Firefox: `about:debugging#/runtime/this-firefox` → *Load Temporary Add-on* → pick `firefox/manifest.json`.

## Development

```
interviewprep/
├── chrome/         # Chrome / Edge build (Manifest V3)
├── firefox/        # Firefox build (MV3 + browser_specific_settings)
├── edge/           # Edge build (identical to chrome/)
├── brand-spec.md   # Editorial personality lock
└── icon-placeholder.png
```

The extension is plain HTML / CSS / JS — no build step, no bundler, no minification. Open `chrome/popup/popup.html` to read.

## Permissions

- `activeTab` — read the job posting text on your current tab when you explicitly click the icon.
- `scripting` — execute the text-extraction script on the active tab on click.
- `storage` — store an anonymous client-id (UUID) and the local free-quota counter so we can honor "5 / month" without an account.

No `host_permissions`, no content scripts, no background scraping, no remote code, no analytics. The Firefox manifest declares `data_collection_permissions.required: ["none"]`.

## Privacy

The text from your active tab is sent to `api.voiddo.com/v1/interviewprep/generate` for AI processing. We don't store it after the response is returned. We don't link it to your identity. Full policy: [extensions.voiddo.com/interviewprep/privacy/](https://extensions.voiddo.com/interviewprep/privacy/).

## License

MIT. See [LICENSE](LICENSE).

---

Built by [vøiddo](https://voiddo.com), a small studio shipping AI-flavoured tools, browser extensions and weird browser games.

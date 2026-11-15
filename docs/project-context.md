# Project context (handoff notes)

A summary of the conversation that started this project, for whoever picks it up next (human or AI).
Personal details have been left out on purpose: people are "the caregiver" and "an elderly parent
and their partner".

## 1. The problem and the goal
- An elderly parent and their partner keep getting caught by persuasive websites and emails:
  - health "cures" with no real evidence behind them (no body of peer-reviewed studies), often
    with bot-written 4–5★ reviews;
  - **video sales letters (VSLs)** that can't be skipped or fast-forwarded, the buy button appearing
    only after minutes of video;
  - very long single-column "advertorial" pages with buy buttons all the way down;
  - phishing email, fake tech support, and "malware" that is usually let in by a click.
- Late at night, tired, "quick check of the phone" is when defences are lowest — for anyone.
- Teaching them isn't enough. They need **guardrails managed remotely by people who care about them**,
  that don't feel like being watched and don't make them feel stupid.
- When something is flagged, offer **legitimate alternatives** on the same subject (articles,
  research, videos) so a warning is also a doorway.
- Content a caregiver considers "mentally poisonous" should get a gentle nudge, never a block; the
  reader can judge for themselves or share it with their partner.
- **Apolitical.** The code ships no political or ideological categories. Public, open source, reusable
  by other families.

## 2. Decisions and why
| Decision | Reason |
|---|---|
| One Manifest V3 extension for Chrome **and** Edge, organised in modules | One install, one config, one update path. Same code runs in both. |
| Rule-based detection first; optional AI review later (caregiver's API key, off by default) | Free, private, explainable, works offline. |
| Pause **payment**, not reading | Respect autonomy; intervene only where money moves. |
| Pause = 24h cooling-off **or** caregiver unlock code | "Sleep on it" without being a hard block; family can approve quickly. |
| Family config in a **secret Gist**, fetched every 6h; no server | No hosting, caregiver edits from anywhere. |
| Allowlist is core; denylist optional and empty by default | Fewer false alarms. A denylist built from history would feel like surveillance. |
| **Never record or report browsing history** | Avoid "my child is watching my every move". |
| Greylist topics only *amplify* pages already showing sales tactics | Reading about neuropathy on MedlinePlus must stay silent. |
| Emotional brakes instead of anti-removal tech | Realistic removal path is a scammer on the phone or a helper. Caregiver's photo/name/message on every warning, "anyone on the phone telling you to turn this off is a scammer", uninstall page that says "call [caregiver]". They don't know how to remove extensions anyway. |
| Publish **unlisted** in Chrome Web Store / Edge Add-ons | Silent auto-updates; force-install via policy is optional. |
| Hands-off updates | Store auto-update + weekly `requestUpdateCheck()` + scam data refreshed from the repo every 6h. Nobody has to press a button. |
| Windows: Defender + browser policies + DNS filtering, not paid AV | Most "malware" here is site notifications, extensions, remote-access tools talked onto the PC. Their everyday account is already a standard (non-admin) user. |
| Desktop first; phones get DNS filtering for now | Chrome on Android and all iOS browsers can't run extensions. |
| Email is Gmail and Yahoo Mail in the browser | Determines the Phase 2 Mail guard adapters. |

## 3. What's built (Phase 1)
```
extension/
  manifest.json                    MV3; content script on all frames; storage + alarms; managed-storage schema
  src/shared/config.ts             zod schemas (family config, greylist), built-in allowlist, thresholds, DATA_URL, UNINSTALL_PAGE
  src/shared/scorer.ts             collects signals → score → none/caution/high (+ takeover)
  src/shared/greylist.ts           topic matching (heading hit, or 2 body hits)
  src/shared/alternatives.ts       topic links + PubMed (systematic reviews), MedlinePlus, doctor videos, "complaints about <product>"
  src/shared/storage.ts            storage keys, SHA-256 secrets (unlock code, PIN)
  src/modules/salespage/           vsl, longform, claims, pressure, commerce
  src/modules/scamguard/           techsupport, remoteaccess, giftcard
  src/content/index.ts             scans top frame (re-scans 2s…5m + on DOM changes); card-field guard in every frame
  src/content/card-fields.ts       card input detection (autocomplete=cc-*, name/label hints)
  src/background/service-worker.ts sync, weekly update check, uninstall URL, per-tab risk, cooling-off, unlock (5 tries/h)
  src/ui/                          shadow-DOM banner, payment pause, takeovers (large type, caregiver photo/message)
  src/setup/                       first-run/settings page: names, phone, message, photo (local only), unlock code, PIN, config URL, status
data/greylist-topics.json          43 scam-prone topics (generated — edit scripts/greylist-source.mjs)
config/config.example.json         family config sample
hardening/                         browser-policies.reg, -remove.reg, browser-lock-extensions.reg (optional), README
docs/                              research, signals, greylist-methodology, caregiver-guide, install-windows, anti-malware, mobile, uninstalled.html, images/
tests/unit, tests/fixtures         Vitest + jsdom on synthetic scam and legit pages
tests/e2e/run.mjs                  Playwright loads dist/ in Chromium: banner, pause, unlock, takeover, no false alarms
.github/workflows/                 ci.yml, links.yml (weekly link check), release.yml (tag → zip → Chrome Web Store if secrets set)
```
Key numbers (see `docs/signals.md`): thresholds caution/high = 40/75 gentle, 30/60 standard, 20/45
strict. Claims capped at 35, **15 when the page sells nothing** (keeps news articles quiet). Pressure
capped at 25. Topic multiplier `1 + score/200`, only when other signals ≥ 10. Tech-support scam 70
(full-screen), remote-access download 50 (full-screen), gift-card code request 65.

Greylist scam score = enforcement (0–40) + affiliate presence (0–25) + age skew (0–20) + loss size
(0–15). All topics are `seed-estimate`. See `docs/greylist-methodology.md`.

Status at handoff: 25 unit tests and 6 end-to-end checks passing; pushed to the working branch.

## 4. Commands
```bash
npm install
npm run build          # → dist/, load unpacked
npm test               # unit
npm run e2e            # builds, then Chromium end-to-end
npm run typecheck
npm run validate-data  # greylist schema, score sums, regexes
npm run greylist       # regenerate data/greylist-topics.json from scripts/greylist-source.mjs
npm run hash-code -- 123456   # unlockCodeHash/unlockCodeSalt for the family config
npm run zip            # store upload package
```

## 5. Known gaps and caveats
- Greylist source/alternative links were **not verified** (the build sandbox's network blocked those
  sites). `links.yml` checks them weekly on GitHub.
- `DATA_URL` reads from the `main` branch: remote data updates start only after merging. Until then
  the bundled copy is used.
- `docs/uninstalled.html` needs GitHub Pages enabled (source: `docs/` on `main`).
- Edge extension IDs in `hardening/browser-lock-extensions.reg` are placeholders; store listings
  don't exist yet.
- An unlock-code hash in a Gist can be brute-forced if the code is short — use 6+ digits there, or
  set the code locally on the settings page.
- CI e2e installs Playwright 1.49.1; the extension needs `channel: 'chromium'` (new headless) to load.
- Untested on real scam sites and in Edge; heuristics will need tuning on real pages.

## 6. Next steps
**Phase 2**
- Mail guard for Gmail and Yahoo Mail web (display name vs sender domain, lookalike domains, link
  text vs target, urgency/prize/gift-card language). Annotate only; nothing leaves the browser.
- Caregiver-defined topic nudges ("read anyway" / "share with partner" via mailto), never blocking.
- Review-pattern signal (only on-site reviews, all 4.5–5★, repeated wording) and domain-age via RDAP.
- `hardening/check-and-harden.ps1` (Windows version / Win10 ESU, Defender + PUA, admin check,
  installed remote-access tools and extensions).
- Store publishing; Edge publish API in `release.yml`.
- Optional AI second opinion via the Claude API (confirm current model IDs and pricing first).

**Phase 3**
- GitHub Action turning the family denylist into a NextDNS/hosts blocklist for phones.
- Safari Web Extension packaging.

**Ideas raised but not yet done**
- Expand greylist permutations; move scores from estimate to reviewed with citations.
- Keep any denylist optional so it never feels like monitoring.

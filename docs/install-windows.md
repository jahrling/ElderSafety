# Installing on a Windows PC

## Once the extension is published (recommended)
1. Open the private store link (Chrome Web Store or Edge Add-ons — the listing is *unlisted*, so
   only people with the link can find it) and click **Add**.
2. The setup page opens. Fill in your name, phone, a short message and a photo of the two of you;
   set an unlock code and a settings PIN. Everything stays on that PC.
3. Optional: paste your family config URL (see `caregiver-guide.md`).
4. Apply `hardening/browser-policies.reg` (see `hardening/README.md`).

Updates install automatically: the browsers check the stores every few hours, and ElderSafety also
asks for an update check once a week. Scam-topic data refreshes every 6 hours without a new version.

## Before publishing / for testing
1. Install Node.js 20+, then in this repo: `npm install` and `npm run build`.
2. Open `chrome://extensions` (or `edge://extensions`), turn on **Developer mode**,
   click **Load unpacked**, choose the `dist` folder.
Unpacked extensions do not auto-update, so use the store version on their PC.

## Publishing (maintainers)
- Chrome Web Store: one-time $5 developer registration; upload `npm run zip` output; set
  visibility to **Unlisted**.
- Edge Add-ons (Partner Center): free; same zip; set visibility to **Hidden**.
- After publishing, put the two extension IDs into `hardening/browser-lock-extensions.reg` if you use it.

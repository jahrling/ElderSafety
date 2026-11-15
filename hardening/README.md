# Windows hardening kit

Free, built-in protections that stop most of what feels like "malware" on an older person's PC.
Do this once, in person or over a remote-help session (see `../docs/anti-malware.md` for RustDesk).

## 1. Clear out what's already there (10 minutes)
1. **Site notifications** — the usual cause of fake "virus" pop-ups in the corner of the screen.
   Chrome: `chrome://settings/content/notifications` → remove every site under "Allowed".
   Edge: `edge://settings/content/notifications` → same.
2. **Extensions** — `chrome://extensions` and `edge://extensions`. Remove anything you don't recognise
   (coupon finders, "PDF converters", search changers).
3. **Remote-control programs** — Settings → Apps → Installed apps. Remove AnyDesk, TeamViewer,
   UltraViewer, ScreenConnect/ConnectWise, Supremo, etc. unless *you* installed them. If you find
   one you didn't install, assume someone has had access: change email and bank passwords from
   another device and call the bank.
4. **Windows version** — Settings → System → About. Windows 10 stopped getting security updates in
   October 2025. Upgrade to Windows 11 if the PC supports it, or enrol in Extended Security Updates.
5. **Microsoft Defender** — Windows Security → Virus & threat protection: real-time protection on,
   run a Full scan. App & browser control → Reputation-based protection → turn on
   **Potentially unwanted app blocking** (block apps *and* downloads).
6. Keep their everyday Windows login a **standard user** (yours stays the admin).

## 2. Apply the browser policies (2 minutes)
From an administrator account, double-click **`browser-policies.reg`** → Yes → restart the browsers.
Check `chrome://policy` and `edge://policy`. It:

| Setting | Effect |
|---|---|
| Block site notifications | No more pop-up "virus" alerts from websites |
| Enhanced Safe Browsing / SmartScreen | Real-time checks against known scam and malware sites |
| Can't click through red warnings | "Deceptive site ahead" really stops them |
| Block dangerous downloads (+ PUA in Edge) | Fake "cleaners", bundled junk and malware files don't download |

Undo any time with `browser-policies-remove.reg`.

## 3. Optional: lock down extensions
`browser-lock-extensions.reg` allows only the extensions you list. Read the comments in the file
first — anything not listed is disabled.

## Why not paid antivirus?
See `../docs/anti-malware.md`. Short version: Defender is free, already there, and scores well in
independent tests. Most of the problems come from scams that persuade people to let bad things in,
which no antivirus fully stops — the steps above do more.

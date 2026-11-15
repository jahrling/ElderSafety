# Phones and tablets

Chrome on Android and every browser on iPhone/iPad can't run this extension. What works today:

## Now: DNS filtering (iOS and Android)
DNS filtering blocks known scam and malware domains in every app — browser, email, texts.
- **Simplest:** Cloudflare's 1.1.1.1 app ("1.1.1.1 for Families" setting) or Quad9.
- **Best for caregivers:** [NextDNS](https://nextdns.io) free tier. Install its profile/app on each
  device; turn on its threat-intelligence and "newly registered domains" blocking; you manage the
  settings from your own browser. Phase 3 will add a GitHub Action that turns the family config's
  `denylist` into a list you can paste into NextDNS.

## Later
- **Safari Web Extension** (iPhone/iPad/Mac): the same code can be packaged with Xcode. Needs a Mac
  and an Apple Developer account ($99/year).
- **Android:** Firefox for Android and Microsoft Edge for Android support some extensions; once
  ElderSafety is in the stores it can be tested there.

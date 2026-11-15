# What ElderSafety looks for

Every signal has a weight and a plain-English reason shown to the reader. Weights add up; the
total is compared with the strictness thresholds (`gentle` 40/75, `standard` 30/60, `strict` 20/45
for caution/high). No single sales signal blocks anything.

## Sales-page guard (`extension/src/modules/salespage/`)
| Signal | Weight | Notes |
|---|---|---|
| VSL player (vturb, converteai, vidalytics…) | 25 | Players built so you can't skip or seek |
| Autoplay video with no controls | 15 | Only if no known VSL player found |
| "Video may be taken down / watch to the end" | 15 | |
| Buy buttons hidden until later | 15 | Re-scanned at 2s, 10s, 45s, 2m, 5m and on page changes |
| Very long page with no site menu | 10 | ≥15 screens tall |
| 4+ repeated buy buttons | 10 | |
| "As seen on" + TV/news names | 5 | |
| Cure/reverse claim for a serious condition | 15 | Claims capped at 35 total, **15 if nothing is being sold** (news stories) |
| "Doctors hate / Big Pharma hides" | 10 | |
| "Secret trick / ancient ritual" | 10 | |
| Miracle language | 5 | |
| "100% natural, no side effects" | 5 | |
| FDA disclaimer | 8 | |
| "Results not typical" | 3 | |
| "Clinically proven" without research links | 5 | Skipped if the page links to PubMed/DOI/journals |
| Scarcity / deadline / fake discount / countdown | 5–10 | Pressure capped at 25 total |
| Checkout via ClickBank, Digistore24, BuyGoods… | 20 | |
| Affiliate link (hop=, affid=…) | 5 | |
| "3 or 6 bottles — best value" | 10 | |

## Scam guard (`extension/src/modules/scamguard/`)
| Signal | Weight | Result |
|---|---|---|
| Fake virus alert + call this toll-free number | 70 | Full-screen "this is a fake warning" |
| Two or more fake-alert phrases | 35 | |
| Remote-control program download (AnyDesk, TeamViewer…) | 50 | Full-screen "did someone ask you to install this?" unless in `allowedRemoteAccess` |
| "Read us the numbers on the back of the card" | 65 | |
| Fee payable by gift card / crypto / wire | 25 | |

## Family lists
- `allowlist`: never flagged (plus built-ins: all `.gov`, Wikipedia, Mayo Clinic, Cleveland Clinic,
  Johns Hopkins, Cochrane, AARP, Microsoft, Apple, Google).
- `denylist`: always high. Empty by default; hand-written by the caregiver, never generated from history.

## The payment pause
On a caution/high page, focusing a card field (by `autocomplete="cc-*"` or name/label hints, also
inside payment iframes) blocks typing and shows the pause. It lifts after the cooling-off period
(default 24h from the first pause on that site, then open for 7 days), or immediately with the
caregiver's unlock code (5 tries/hour). Unlocks last 24h for that site.

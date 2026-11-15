# Greylist topics: "extra optics"

`data/greylist-topics.json` lists subjects that scammers target heavily at older people. It is
generated from `scripts/greylist-source.mjs` (edit that, then `node scripts/greylist-source.mjs` and
`npm run validate-data`).

## How it's used
A topic **never warns on its own**. Reading about neuropathy on MedlinePlus stays silent. Only when a
page already shows sales tactics (score ≥ 10) does a matching topic multiply the score by
`1 + score/200` (so up to 1.5×), and its trusted alternatives appear in the warning.

A page matches a topic when a pattern hits the title/headings, or two different patterns hit the body.

## The scam score (0–100)
A sum of four parts, recorded per topic in `scoreBreakdown`:

| Part | Range | Question |
|---|---|---|
| `enforcement` | 0–40 | How often have the FTC, FDA, SEC/CFTC or state AGs acted against this kind of claim? |
| `affiliate` | 0–25 | Is it a staple of affiliate marketplaces (ClickBank, Digistore24, BuyGoods) and VSL funnels? |
| `ageSkew` | 0–20 | Does FTC Consumer Sentinel / AARP data show older adults are disproportionately hit? |
| `lossSize` | 0–15 | Typical loss: recurring billing, multi-bottle bundles, or life savings? |

Every topic is currently `"status": "seed-estimate"`: the numbers are informed estimates from the
sources listed per topic, not yet a formal review. To mark one `reviewed`, cite at least one
enforcement action and one data source in `sources`, and note the reasoning in the PR.

Caregivers can override any score in their family config (`topicOverrides`).

## Categories in the seed list
Health "cures" (blood sugar, neuropathy, tinnitus, memory, prostate, libido, joints, vision, weight,
blood pressure, cholesterol, toenail fungus, gut, teeth, hair, sleep, CBD, cancer, stem cells,
"ancient remedies"); money (gold IRAs, crypto, retirement "secrets", stock newsletters,
work-from-home, timeshare exit, reverse mortgage); government (Medicare, unclaimed money, Social
Security, tax relief); prizes & relationships (sweepstakes, romance, grandchild-in-trouble); tech
(fake support, refund scams, antivirus renewals, fake order emails); products (hearing aids by ad,
"free" medical alerts and braces, miracle gadgets, doomsday preparedness).

## To do
- Add FDA warning-letter counts, AARP Fraud Watch and BBB Scam Tracker categories as sources.
- `npm run check-links` (runs weekly in CI) to catch dead links.
- Adding a topic: keep patterns specific (they run on every page), include at least two trusted
  alternatives, and add a test case in `tests/unit/greylist.test.ts`.

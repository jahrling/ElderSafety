# ElderSafety

Caregiver-managed Chrome/Edge extension (MV3, TypeScript, esbuild) plus a Windows hardening kit that
slows down scams aimed at older adults. **Read `docs/project-context.md` first** — it holds the goals,
decisions, file map, known gaps and next steps.

## Commands
`npm run build` · `npm test` · `npm run e2e` · `npm run typecheck` · `npm run validate-data` ·
`npm run greylist` (regenerates `data/greylist-topics.json`)

## Rules
- Keep it apolitical: no political or ideological categories in code or data.
- No family or personal data in the repo (names, phones, photos, real configs). Those live only on
  the user's computer or in the caregiver's secret Gist.
- Never add browsing-history logging or reporting.
- Edit `scripts/greylist-source.mjs`, not the generated JSON.
- Every warning reason is shown to an older reader: plain English, calm, no jargon.
- Before committing: `npm run typecheck && npm test && npm run validate-data && npm run e2e`.

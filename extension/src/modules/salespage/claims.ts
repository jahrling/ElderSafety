import type { PageContext } from '../../shared/context';
import type { Signal } from '../../shared/types';

const CONDITIONS =
  '(type 2 diabetes|diabetes|blood sugar|neuropathy|nerve pain|tinnitus|ringing in (the|your) ears|hearing loss|dementia|alzheimer\'?s|memory loss|arthritis|joint pain|prostate|high blood pressure|hypertension|cholesterol|clogged arteries|macular degeneration|vision loss|cancer|tumou?rs?|erectile dysfunction|\\bed\\b|toenail fungus|gum disease|hair loss|belly fat)';

const RULES: { id: string; weight: number; re: RegExp; reason: string }[] = [
  {
    id: 'cure-claim',
    weight: 15,
    re: new RegExp(`\\b(cures?|cured|reverses?|reversed|eliminates?|erases?|ends?|destroys?|wipes? out|melts? away|regrows?)\\b[^.!?]{0,50}\\b${CONDITIONS}`, 'i'),
    reason: 'It claims to cure or reverse a serious health condition. Real treatments rarely promise that.',
  },
  {
    id: 'suppressed-truth',
    weight: 10,
    re: /\b(doctors (hate|don'?t want)|big pharma (doesn'?t|does not|won'?t) want|they don'?t want you to know|the (truth|secret) (they|doctors|the government)|banned (by|from) (the )?(fda|mainstream)|suppressed (cure|treatment))\b/i,
    reason: 'It says doctors or “Big Pharma” are hiding this from you — a classic sales hook.',
  },
  {
    id: 'secret-trick',
    weight: 10,
    re: /\b((\d+|one|two|three|five|ten)[- ](second|minute)[- ](trick|ritual|hack|habit|morning ritual)|(weird|strange|bizarre|simple|odd|ancient|japanese|amazonian|himalayan|tribal) (trick|ritual|remedy|secret|recipe|hack)|kitchen (trick|hack))\b/i,
    reason: 'It promises a “secret trick” or “ancient ritual” — wording used to sell supplements, not medicine.',
  },
  {
    id: 'miracle-language',
    weight: 5,
    re: /\b(miracle|breakthrough discovery|scientists (are )?(stunned|baffled)|shocking discovery|game[- ]changer)\b/i,
    reason: 'It uses “miracle” or “scientists stunned” language.',
  },
  {
    id: 'no-side-effects',
    weight: 5,
    re: /\b(100% natural|all[- ]natural)\b[^.]{0,80}\b(no|zero|without) (side effects|risks?)\b|\bno side effects\b/i,
    reason: 'It says “100% natural, no side effects”. Anything strong enough to work can have side effects.',
  },
  {
    id: 'fda-disclaimer',
    weight: 8,
    re: /these statements have not been evaluated by the (food and drug administration|fda)/i,
    reason: 'The fine print admits the FDA has not checked these health claims.',
  },
  {
    id: 'results-not-typical',
    weight: 3,
    re: /\bresults (may vary|are not typical|not typical)\b|\bindividual results (may )?vary\b/i,
    reason: 'The fine print says the success stories are not typical.',
  },
  {
    id: 'unbacked-clinical',
    weight: 5,
    re: /\b(clinically (proven|tested)|scientifically proven|backed by (science|research|studies))\b/i,
    reason: 'It says “clinically proven” but doesn’t link to the actual research.',
  },
];

function linksToResearch(doc: Document): boolean {
  return Array.from(doc.querySelectorAll('a[href]')).some((a) =>
    /(pubmed\.ncbi\.nlm\.nih\.gov|doi\.org|ncbi\.nlm\.nih\.gov\/pmc|cochranelibrary\.com|thelancet\.com|nejm\.org|jamanetwork\.com|bmj\.com)/i.test(
      a.getAttribute('href') ?? '',
    ),
  );
}

export function claimSignals(ctx: PageContext): Signal[] {
  const research = linksToResearch(ctx.doc);
  const out: Signal[] = [];
  for (const r of RULES) {
    if (r.id === 'unbacked-clinical' && research) continue;
    if (r.re.test(ctx.text) || r.re.test(ctx.headlines)) {
      out.push({ id: r.id, module: 'salespage', weight: r.weight, reason: r.reason });
    }
  }
  return out;
}

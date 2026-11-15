import type { Link, TopicMatch } from './types';

const enc = encodeURIComponent;

/**
 * Trustworthy places to learn about the same subject, so a warning is also a doorway.
 * Health topics get a PubMed search filtered to systematic reviews — the "many good studies
 * agree" standard — plus MedlinePlus and video searches from major medical centres.
 */
export function alternativesFor(topic: TopicMatch | null, productName: string): Link[] {
  const category = topic?.category ?? null;
  const links: Link[] = [];
  if (topic) links.push(...topic.alternatives);
  const term = topic?.searchTerm;
  if (term && category === 'health') {
    links.push(
      {
        title: `What the research says: reviews of many studies on “${term}” (PubMed)`,
        url: `https://pubmed.ncbi.nlm.nih.gov/?term=${enc(term)}&filter=pubt.systematicreview`,
      },
      {
        title: `Plain-English health information on “${term}” (MedlinePlus, US National Library of Medicine)`,
        url: `https://vsearch.nlm.nih.gov/vivisimo/cgi-bin/query-meta?v%3Aproject=medlineplus&query=${enc(term)}`,
      },
      {
        title: `Videos from doctors at major hospitals about “${term}”`,
        url: `https://www.youtube.com/results?search_query=${enc(term + ' Mayo Clinic OR Cleveland Clinic OR Johns Hopkins')}`,
      },
    );
  }
  const name = productName.trim();
  if (name) {
    links.push({
      title: `Search the news for complaints about “${name}”`,
      url: `https://www.google.com/search?q=${enc(`"${name}" complaints OR lawsuit OR FTC OR scam`)}`,
    });
  }
  // De-duplicate by URL, keep order.
  const seen = new Set<string>();
  return links.filter((l) => !seen.has(l.url) && seen.add(l.url));
}

/** Best guess at the product being sold: the main headline, shortened. */
export function productNameFrom(doc: Document): string {
  const h1 = doc.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const raw = h1.length > 3 && h1.length < 70 ? h1 : doc.title;
  return raw.split(/\s[|\-–—]\s|:\s/)[0]!.trim().slice(0, 60);
}

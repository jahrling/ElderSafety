import type { Config, Greylist, Topic } from './config';
import type { TopicMatch } from './types';

interface Compiled {
  topic: Topic;
  res: RegExp[];
}
const cache = new WeakMap<Greylist, Compiled[]>();

function compile(g: Greylist): Compiled[] {
  let c = cache.get(g);
  if (!c) {
    c = g.topics.map((topic) => ({
      topic,
      res: topic.patterns.flatMap((p) => {
        try {
          return [new RegExp(p, 'i')];
        } catch {
          return []; // a bad pattern in remote data must never break the page
        }
      }),
    }));
    cache.set(g, c);
  }
  return c;
}

/**
 * Finds the scam-prone topic the page is mainly about, if any.
 * Needs a hit in the title/headings, or two different patterns in the body text.
 */
export function matchTopic(headlines: string, text: string, greylist: Greylist, config: Config): TopicMatch | null {
  let best: TopicMatch | null = null;
  for (const { topic, res } of compile(greylist)) {
    const inHead = res.some((r) => r.test(headlines));
    const inBody = res.filter((r) => r.test(text)).length;
    if (!inHead && inBody < 2) continue;
    const score = config.topicOverrides[topic.id] ?? topic.score;
    if (!best || score > best.score) {
      best = { id: topic.id, label: topic.label, category: topic.category, score, searchTerm: topic.searchTerm, alternatives: topic.alternatives };
    }
  }
  return best;
}

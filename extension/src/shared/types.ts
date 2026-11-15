export type Module = 'salespage' | 'scamguard' | 'mail' | 'topics' | 'family';

/** One reason a page looks risky. `reason` is shown to the reader, so keep it plain English. */
export interface Signal {
  id: string;
  module: Module;
  weight: number;
  reason: string;
}

export type RiskLevel = 'none' | 'caution' | 'high';

/** Special full-screen situations that don't wait for a payment attempt. */
export type Takeover = 'techsupport' | 'remoteaccess' | null;

export interface TopicMatch {
  id: string;
  label: string;
  category: string;
  score: number;
  searchTerm: string;
  alternatives: Link[];
}

export interface Link {
  title: string;
  url: string;
}

export interface Assessment {
  level: RiskLevel;
  score: number;
  signals: Signal[];
  topic: TopicMatch | null;
  takeover: Takeover;
}

/** Facts about the page that need a real browser layout (jsdom can't measure). */
export interface PageMetrics {
  scrollHeight: number;
  viewportHeight: number;
}

/** Personal details entered on the setup page. Stored only in chrome.storage.local on that computer. */
export interface Personal {
  caregiverName: string;
  caregiverPhone: string;
  /** How the caregiver addresses the reader, e.g. "Dad". */
  readerName: string;
  message: string;
  /** Small JPEG data: URL, never synced anywhere. */
  photo: string;
}

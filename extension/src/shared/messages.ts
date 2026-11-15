import type { RiskLevel } from './types';

/** Messages between content scripts (any frame) and the service worker. */
export type ToWorker =
  | { type: 'risk'; level: RiskLevel; host: string }
  | { type: 'cardFocus' }
  | { type: 'tryUnlock'; code: string }
  | { type: 'closeTab' }
  | { type: 'openSetup' };

export type ToContent = { type: 'showPause'; coolingUntil: number } | { type: 'unlocked' };

export interface CardFocusReply {
  locked: boolean;
}

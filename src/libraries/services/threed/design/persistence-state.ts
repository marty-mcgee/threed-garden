import { designHistory, type DesignHistory } from './history';
import { newDesign, validateDesign, type DesignDocument } from './document';
import { savedDesign, type SavedDesign } from './persistence-contract';

/** Editor session identity never comes from portable document JSON. */
export interface DesignDraft {
  history: DesignHistory;
  record: SavedDesign | null;
  saved: string | null;
  createKey: string;
}
export const freshDesign = (createKey: string): DesignDraft => ({ history: designHistory(newDesign()), record: null, saved: null, createKey });
export const designIsDirty = (draft: DesignDraft) => draft.saved !== JSON.stringify(draft.history.present);
/** Preserve newer edits while acknowledging exactly the document confirmed by the server. */
export function acknowledgeDesign(draft: DesignDraft, response: unknown): DesignDraft {
  const record = savedDesign(response);
  return { ...draft, record, saved: JSON.stringify(record.document) };
}
export function openDesignDraft(response: unknown, createKey: string): DesignDraft {
  const record = savedDesign(response);
  return { history: designHistory(record.document), record, saved: JSON.stringify(record.document), createKey };
}
/** Import starts a new identity, including when its geometry equals the saved source. */
export function importDesignDraft(draft: DesignDraft, document: DesignDocument, createKey: string): DesignDraft {
  const valid = validateDesign(document);
  return { history: { past: [...draft.history.past, draft.history.present].slice(-100), present: valid, future: [] }, record: null, saved: null, createKey };
}

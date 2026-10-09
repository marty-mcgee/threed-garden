import { validateDesign, type DesignDocument } from './document';
export interface DesignHistory { past: DesignDocument[]; present: DesignDocument; future: DesignDocument[] }
export const designHistory = (present: DesignDocument): DesignHistory => ({ past: [], present: validateDesign(present), future: [] });
/** Call only on completed operations. Pointer previews stay outside this history. */
export function commitDesign(state: DesignHistory, draft: DesignDocument): DesignHistory {
  const present = validateDesign(draft);
  if (JSON.stringify(present) === JSON.stringify(state.present)) return state;
  return { past: [...state.past, state.present].slice(-100), present, future: [] };
}
export function undoDesign(state: DesignHistory): DesignHistory { return state.past.length ? { past: state.past.slice(0, -1), present: state.past[state.past.length - 1], future: [state.present, ...state.future].slice(0, 100) } : state; }
export function redoDesign(state: DesignHistory): DesignHistory { return state.future.length ? { past: [...state.past, state.present].slice(-100), present: state.future[0], future: state.future.slice(1) } : state; }

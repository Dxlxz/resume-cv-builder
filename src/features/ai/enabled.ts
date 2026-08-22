/**
 * Idrizz (the AI assistant) is opt-in per build.
 *
 * Off unless `VITE_IDRIZZ_ENABLED=true` is set, so a default build ships with
 * no chat bubble, no per-section guide affordance, and no calls to `/api/ai`.
 * The feature code and its tests stay in the tree — this gates the UI entry
 * points only, so turning it back on is a one-line env change.
 */
export const IDRIZZ_ENABLED = import.meta.env.VITE_IDRIZZ_ENABLED === 'true'

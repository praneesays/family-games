import type { ConnState } from '../lib/types';

export function ConnectionPill({ state }: { state: ConnState }) {
  if (state === 'online') {
    return (
      <span className="conn conn--ok" title="Connected" aria-label="Connected">
        <span className="conn__dot" />
      </span>
    );
  }
  if (state === 'reconnecting') {
    return (
      <span className="conn conn--warn" role="status">
        <span className="conn__dot" /> Reconnecting…
      </span>
    );
  }
  return (
    <span className="conn conn--err" role="status">
      <span className="conn__dot" /> Offline — retrying
    </span>
  );
}

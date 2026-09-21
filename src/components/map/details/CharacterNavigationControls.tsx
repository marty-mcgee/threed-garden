'use client';
import { useEffect, useRef, useState } from 'react';
import { NAVIGATION_REQUEST, NAVIGATION_STATUS, type NavigationRequest } from '@/libraries/services/threed/orchestration/navigation-events';

export function CharacterNavigationControls({ actorMarkerId, targetMarkerId, ready, controlled }: {
  actorMarkerId: string; targetMarkerId: string; ready: boolean; controlled: boolean;
}) {
  const [status, setStatus] = useState('');
  const requestId = useRef('');
  useEffect(() => {
    setStatus(''); requestId.current = '';
    function receive(event: Event) {
      const detail = (event as CustomEvent).detail;
      if (detail?.actorMarkerId !== actorMarkerId || detail?.requestId !== requestId.current) return;
      setStatus(detail.phase === 'teleported' ? 'Teleported near target.'
        : detail.phase === 'teleport-blocked' ? 'No clear ground near this target. Character stayed in place.'
        : detail.phase === 'teleport-cancelled' ? 'Teleport cancelled. Check control and target.'
        : detail.phase === 'walking' ? 'Walking to target…' : detail.phase === 'arrived' ? 'Arrived near target.'
        : detail.phase === 'blocked' ? 'Route blocked or timed out. Try another position.' : 'Walk stopped.');
    }
    window.addEventListener(NAVIGATION_STATUS, receive);
    return () => window.removeEventListener(NAVIGATION_STATUS, receive);
  }, [actorMarkerId, targetMarkerId]);
  function send(command: NavigationRequest['command']) {
    if (command !== 'stop') { requestId.current = crypto.randomUUID(); setStatus(command === 'walk' ? 'Requesting walk…' : 'Checking landing…'); }
    window.dispatchEvent(new CustomEvent(NAVIGATION_REQUEST, { detail: { actorMarkerId, targetMarkerId, requestId: requestId.current, command } satisfies NavigationRequest }));
  }
  return <div className="mt-2 space-y-1">
    <div className="grid grid-cols-2 gap-1.5">
      <button className="rounded bg-sky-600/25 px-2 py-1 text-sky-100 disabled:opacity-40" disabled={!ready || actorMarkerId === targetMarkerId || status === 'Walking to target…'} onClick={e => { e.stopPropagation(); send('walk'); }}>Walk to Target</button>
      <button className="rounded bg-white/5 px-2 py-1 text-white/70 disabled:opacity-40" disabled={!ready} onClick={e => { e.stopPropagation(); send('stop'); }}>Stop Walking</button>
      <button className="col-span-2 rounded bg-sky-600/25 px-2 py-1 text-sky-100 disabled:opacity-40" disabled={!ready || actorMarkerId === targetMarkerId || status === 'Checking landing…'} onClick={e => { e.stopPropagation(); send('teleport'); }}>Teleport near Target</button>
    </div>
    <p role="status" className="text-sky-200">{!controlled ? 'Take Control to walk or teleport.' : !ready ? 'Waiting for Character readiness…' : status || 'Ready to move. WASD interrupts walking.'}</p>
  </div>;
}

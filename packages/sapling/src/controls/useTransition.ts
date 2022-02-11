import { useEffect, useState } from 'react';

interface Props {
  in: boolean;
  timeout?: number;
  onExited?: () => void;
}

type TransitionState = 'entering' | 'entered' | 'exiting' | 'exited';

export const useTransition = ({ timeout = 100, onExited, in: inside }: Props): TransitionState => {
  const [state, setState] = useState<TransitionState>('exited');

  if (inside) {
    if (state === 'exited' || state === 'exiting') {
      setState('entering');
    }
  } else {
    if (state === 'entering' || state === 'entered') {
      setState('exiting');
    }
  }

  useEffect(() => {
    if (state === 'entering' || state === 'exiting') {
      const timer = window.setTimeout(() => {
        if (state === 'exiting') {
          setState('exited');
          onExited && onExited();
        } else if (state === 'entering') {
          setState('entered');
        }
      }, timeout);

      return () => window.clearTimeout(timer);
    }
  }, [state, timeout, onExited]);

  return state;
};

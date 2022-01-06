import React, { memo, useMemo, useState } from 'react';
import clsx from 'clsx';
import { FC, useEffect } from 'react';
import { useLatest } from './useLatest';
import { usePointerDrag } from './usePointerDrag';

const PERIOD_MS = 100;
const INITIAL_DELAY_MS = 400;

const noOpCallback = (active: boolean) => { return; }

interface Props {
  className?: string;
  onChange?: (active: boolean) => void;
  onHeld?: () => void;
  children?: JSX.Element | JSX.Element[];
  period?: number;
  delay?: number;
}

/** A button which causes a value to change for as long as it is held down. */
export const MomentaryButton: FC<Props> = memo(
  ({ className, onChange, onHeld, children, period = PERIOD_MS, delay = INITIAL_DELAY_MS }) => {
    const [isActive, setIsActive] = useState(false);
    const [inFirstInterval, setInFirstInterval] = useState(false);
    const onChangeLatest = useLatest(onChange || noOpCallback);

    const callbacks = useMemo(() => {
      return {
        onDragStart() {
          setIsActive(true);
          setInFirstInterval(true);
          onChangeLatest.current(true);
        },
        onDragEnd() {
          setIsActive(false);
          onChangeLatest.current(false);
        },
        onDragEnter() {
          setIsActive(true);
          onChangeLatest.current(true);
        },
        onDragLeave() {
          setIsActive(false);
          onChangeLatest.current(false);
        },
      };
    }, [onChangeLatest]);

    const dragMethods = usePointerDrag(callbacks);

    // Call `onHeld` callback continuously.
    useEffect(() => {
      if (isActive && onHeld) {
        // Initial delay is often different than subsequent delays.
        if (inFirstInterval) {
          const timer = window.setTimeout(() => {
            onHeld();
            setInFirstInterval(false);
          }, delay);
          return () => window.clearTimeout(timer);
        } else {
          const timer = window.setInterval(onHeld, period);
          return () => window.clearInterval(timer);
        }
      }
    }, [isActive, delay, period, onHeld, inFirstInterval]);

    return (
      <div {...dragMethods} className={clsx(className, { active: isActive })}>
        {children}
      </div>
    );
  }
);

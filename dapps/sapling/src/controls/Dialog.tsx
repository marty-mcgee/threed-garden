/** @jsx jsx */
import clsx from 'clsx';
import styled from '@emotion/styled';
import { DialogContent, DialogOverlay } from '@reach/dialog';
import { FC, useCallback, useState } from 'react';
import { colors } from '../styles';
import { jsx, keyframes } from '@emotion/core';
import { useTransition } from './useTransition';

import '@reach/dialog/styles.css';

interface Props {
  ariaLabel: string;
  children?: any;
  className?: string;
  open: boolean;
  onClose?: () => void;
  onExited?: () => void;
}

const DialogOverlayKeyFrames = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const DialogOverlayKeyFramesExit = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const DialogContentKeyFrames = keyframes`
  from {
    opacity: 0;
    transform: scale(0.7);
  }
  to {
    opacity: 1;
    transform: scale(1.0);
  }
`;

const DialogContentKeyFramesExit = keyframes`
  from {
    opacity: 1;
    transform: scale(1.0);
  }
  to {
    opacity: 0;
    transform: scale(0.7);
  }
`;

export const DialogHeader = styled.header`
  background-color: ${colors.dialogHeaderBg};
  border-radius: 5px 5px 0 0;
  color: ${colors.dialogHeaderText};
  font-weight: bold;
  padding: 8px 12px;
`;

export const DialogBody = styled.section`
  color: ${colors.dialogBodyText};
  display: flex;
  flex-direction: column;
  padding: 12px 20px;
  flex: 1 1 auto;

  > p:first-of-type {
    margin-top: 0;
  }
`;

export const DialogFooter = styled.footer`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 8px 12px 0 12px;
  flex-shrink: 0;
  flex-wrap: wrap;

  > * {
    margin-left: 8px;
    margin-bottom: 12px;
  }
`;

const DialogOverlayElt = styled(DialogOverlay)`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;

  &.entering,
  &.entered {
    animation: ${DialogOverlayKeyFrames} 300ms ease forwards;
  }

  &.exited,
  &.exiting {
    animation: ${DialogOverlayKeyFramesExit} 300ms ease forwards;
  }
`;

const DialogElt = styled(DialogContent)`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background-color: ${colors.dialogBg};
  border-radius: 5px;
  border: 1px solid ${colors.dialogBorder};
  box-shadow: 0px 1px 8px 1px ${colors.dialogShadow};
  min-width: 10rem;
  min-height: 3rem;
  max-width: 95%;
  max-height: 95%;
  padding: 0;
  opacity: 0;

  &.entering,
  &.entered {
    animation: ${DialogContentKeyFrames} 300ms ease forwards;
  }

  &.exited,
  &.exiting {
    animation: ${DialogContentKeyFramesExit} 300ms ease forwards;
  }

  &.busy {
    cursor: wait;
  }

  > * {
    border-top: 1px solid ${colors.dialogSepLight};
    border-bottom: 1px solid ${colors.dialogSepDark};
    &:first-child {
      border-top: none;
    }
    &:last-child {
      border-bottom: none;
    }
  }
`;

/** Modal dialog class. */
export const Dialog: FC<Props> = ({
  ariaLabel,
  open,
  onClose,
  onExited,
  children,
  className,
  ...props
}) => {
  const state = useTransition({ in: open, onExited });

  return state !== 'exited' ? (
    <DialogOverlayElt isOpen={true} className={clsx(state)} onDismiss={onClose}>
      <DialogElt
        {...props}
        aria-label={ariaLabel}
        className={clsx('dialog', className, state, { open })}
      >
        {children}
      </DialogElt>
    </DialogOverlayElt>
  ) : null;
};

export const useDialogState = () => {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  const onClose = useCallback(() => setOpen(false), []);
  const onExited = useCallback(() => setVisible(false), []);

  const setOpenState = useCallback((open: boolean) => {
    if (open) {
      setOpen(true);
      setVisible(true);
    } else {
      setOpen(false);
    }
  }, []);

  return {
    visible,
    setOpen: setOpenState,
    dialogProps: {
      open,
      onClose,
      onExited,
    },
  };
};

'use client';

import { Children, cloneElement, createContext, useContext, useState, type ReactElement, type ReactNode, type ButtonHTMLAttributes } from 'react';
import { createPortal } from 'react-dom';

const ActionHost = createContext<{
  host: HTMLDivElement | null;
  setHost: (host: HTMLDivElement | null) => void;
} | null>(null);

export function DetailsCardActionsProvider({ children }: { children: ReactNode }) {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  return <ActionHost.Provider value={{ host, setHost }}>{children}</ActionHost.Provider>;
}

export function DetailsCardActionsSlot() {
  const context = useContext(ActionHost);
  return <div ref={context?.setHost} className="flex shrink-0 items-center gap-1 px-2 pt-2 empty:hidden" />;
}

// Editors keep ownership of their drafts, validation, and action handlers.
export function DetailsCardActions({ children, labels }: { children: ReactNode; labels: string[] }) {
  const context = useContext(ActionHost);
  if (!context) return <div className="mt-2 flex gap-1">{children}</div>;
  if (!context.host) return null;
  return createPortal(Children.map(children, (child, index) => {
    const button = child as ReactElement<ButtonHTMLAttributes<HTMLButtonElement>>;
    return cloneElement(button, {
      title: labels[index],
      'aria-label': labels[index],
      className: `${button.props.className ?? ''} !h-8 !w-auto min-w-0 flex-1 !gap-1 !px-2 !py-1 !text-[11px]`,
      children: <>{Children.toArray(button.props.children)[0]}<span>{index === 0 ? 'Save' : index === 1 ? (labels[index] === 'Cancel Move' ? 'Cancel' : 'Move') : 'Delete'}</span></>,
    });
  }), context.host);
}

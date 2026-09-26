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
  return <div ref={context?.setHost} className="ml-auto flex shrink-0 items-center gap-1 empty:hidden" />;
}

// Editors keep ownership of their drafts, validation, and action handlers.
export function DetailsCardActions({ children, labels }: { children: ReactNode; labels: string[] }) {
  const context = useContext(ActionHost);
  if (!context) return <div className="mt-2 flex gap-1">{Children.toArray(children).reverse()}</div>;
  if (!context.host) return null;
  return createPortal(Children.map(children, (child, index) => {
    const button = child as ReactElement<ButtonHTMLAttributes<HTMLButtonElement>>;
    return cloneElement(button, {
      title: labels[index],
      'aria-label': labels[index],
      className: `${(button.props.className ?? '').split(/\s+/).filter(token => !/^(bg-|text-(?:red|amber|cyan|emerald|white|slate|zinc))/.test(token)).join(' ')} bg-white/5 text-white/60 !h-7 !w-7 shrink-0 !gap-0 !p-0 !text-[11px]`,
      children: <>{Children.toArray(button.props.children)[0]}</>,
    });
  })?.reverse(), context.host);
}

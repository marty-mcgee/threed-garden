'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

/** Keep incomplete text local; validate only when the user finishes editing. */
export function DesignNameInput({ name, onCommit }: { name: string; onCommit: (name: string) => void }) {
  const [text, setText] = useState(name);
  const [invalid, setInvalid] = useState(false);
  useEffect(() => { setText(name); setInvalid(false); }, [name]);
  function finish() {
    const value = text.trim();
    if (!value) { setInvalid(true); return; }
    setInvalid(false);
    setText(value);
    if (value !== name) onCommit(value);
  }
  return <>
    <Input aria-label="Design name" aria-invalid={invalid} value={text} maxLength={120}
      onChange={event => { setText(event.target.value); setInvalid(false); }} onBlur={finish}
      onKeyDown={event => {
        if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur(); }
        if (event.key === 'Escape') { event.preventDefault(); setText(name); setInvalid(false); }
      }} />
    {invalid && <span role="alert" className="text-destructive">Enter a Design name. The previous name is retained until then.</span>}
  </>;
}

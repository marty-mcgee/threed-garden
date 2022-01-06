import React, { Ref, useCallback, useEffect, useState } from 'react';

interface Props<T> {
  value: T;
  className?: string;
  onChange: (value: T) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  validate: (value: string) => boolean;
  parse: (value: string) => T;
  format: (value: T) => string;
  inputRef?: Ref<HTMLInputElement>;
  autoFocus?: boolean;
}

export function ActiveInput<T>({
  value,
  onChange,
  onBlur,
  inputRef,
  validate,
  parse,
  format,
  ...props
}: Props<T>) {
  const [editValue, setEditValue] = useState(format(value));

  const reset = useCallback(() => setEditValue(format(value)), [format, value]);

  useEffect(() => setEditValue(format(value)), [format, value]);

  const onBlurInternal = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    if (validate(editValue)) {
      const newValue = parse(editValue);
      onChange(newValue);
    } else {
      reset();
    }
    onBlur && onBlur(e);
  }, [editValue, onBlur, onChange, parse, reset, validate]);

  const onInputKey = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (validate(editValue)) {
          const newValue = parse(editValue);
          e.currentTarget.blur();
          onChange(newValue);
        } else {
          reset();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.currentTarget.blur();
        reset();
      }
    },
    [editValue, onChange, parse, reset, validate]
  );

  return (
    <input
      {...props}
      ref={inputRef}
      type="text"
      value={editValue}
      onKeyDown={onInputKey}
      onBlur={onBlurInternal}
      onChange={e => setEditValue(e.currentTarget.value)}
    />
  );
}

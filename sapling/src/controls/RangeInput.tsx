import React, { FC, Ref } from 'react';
import { ActiveInput } from './ActiveInput';
import { Range } from '../properties';

interface Props {
  value: Range;
  className?: string;
  onChange: (value: Range) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  inputRef?: Ref<HTMLInputElement>;
  autoFocus?: boolean;
}

function parseRange(input: string): Range | null {
  const m = /^([\d\\.]+)\s*,\s*([\d\\.]+)$/.exec(input.trim());
  if (m) {
    const low = parseFloat(m[1]);
    const high = parseFloat(m[2]);
    if (!isNaN(low) && !isNaN(high)) {
      return [low, high];
    }
  }
  const m2 = /^[\d\\.]+$/.exec(input.trim());
  if (m2) {
    const val = parseFloat(m2[0]);
    if (!isNaN(val)) {
      return [val, val];
    }
  }
  return null;
}

export const RangeInput: FC<Props> = ({ value, ...props }) => {
  return (
    <ActiveInput<Range>
      {...props}
      value={value}
      validate={n => parseRange(n) !== null}
      parse={n => parseRange(n) || [0, 0]}
      format={n => n.toString()}
    />
  );
};

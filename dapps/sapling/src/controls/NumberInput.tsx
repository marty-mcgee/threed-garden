import React, { FC, Ref } from 'react';
import { ActiveInput } from './ActiveInput';

interface Props {
  value: number;
  className?: string;
  onChange: (value: number) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  inputRef?: Ref<HTMLInputElement>;
  autoFocus?: boolean;
}

export const NumberInput: FC<Props> = ({ value, ...props }) => {
  return (
    <ActiveInput<number>
      {...props}
      value={value}
      validate={n => !isNaN(Number(n))}
      parse={Number}
      format={n => n.toString()}
    />
  );
};

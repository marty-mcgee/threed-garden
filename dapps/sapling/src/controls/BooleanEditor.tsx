import React, { FC, useCallback } from 'react';
import clsx from 'clsx';
import styled from '@emotion/styled';
import { colors } from '../styles';
import { ControlName, ControlValue } from './Controls';

const BooleanEditorElt = styled.div`
  align-items: center;
  background-color: ${colors.comboSliderBg};
  border: 1px solid ${colors.comboBorder};
  border-top: none;
  display: inline-flex;
  height: 24px;
  min-width: 64px;
  overflow: hidden;
  padding: 0 24px;
  position: relative;
  user-select: none;
`;

interface Props {
  name: string;
  value: boolean;
  className?: string;
  onChange: (value: boolean) => void;
}

export const BooleanEditor: FC<Props> = ({
  name,
  value,
  className,
  onChange,
}) => {
  const onClick = useCallback(() => {
    onChange(!value);
  }, [onChange, value]);

  return (
    <BooleanEditorElt
      className={clsx('control', className)}
      onClick={onClick}
    >
      <ControlName className="name">{name}</ControlName>
      <ControlValue className="value">{value ? 'true' : 'false'}</ControlValue>
    </BooleanEditorElt>
  );
};

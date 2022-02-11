import React, { FC, useCallback, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import styled from '@emotion/styled';
import { DragMethods, usePointerDrag } from './usePointerDrag';
import { colors } from '../styles';
import { ArrowButtonLeft, ArrowButtonRight, ControlName, ControlValue } from './Controls';

const EnumEditorElt = styled.div`
  background-color: ${colors.comboSliderBg};
  display: inline-flex;
  position: relative;
  align-items: stretch;
  position: relative;
  border: 1px solid ${colors.comboBorder};
  border-top: none;
  height: 24px;
  min-width: 64px;
  overflow: hidden;
  user-select: none;
  cursor: ew-resize;

  &.textActive > .center {
    > .name,
    > .value {
      display: none;
    }

    > input {
      display: block;
    }
  }
`;

const ValueContainer = styled.div`
  display: flex;
  position: relative;
  align-items: center;
  justify-content: flex-start;
  flex: 1;
  font-size: 14px;
  vertical-align: middle;
  line-height: calc(100%);
  padding: 0 6px;
`;

interface Props {
  name: string;
  value: number;
  enumVals: string[];
  className?: string;
  onChange: (value: number) => void;
}

export const EnumEditor: FC<Props> = ({
  name,
  value,
  className,
  enumVals,
  onChange,
}) => {
  const element = useRef<HTMLDivElement>(null);
  const [dragOrigin, setDragOrigin] = useState(0);
  const [dragValue, setDragValue] = useState(0);
  const max = enumVals.length - 1;

  const setValue = useCallback(
    (value: number) => {
      let newValue = Math.round(value);
      if (newValue > max) {
        newValue = 0;
      } else if (newValue < 0) {
        newValue = max;
      }
      onChange(newValue);
    },
    [max, onChange]
  );

  const buttonMethods = useMemo(
    () => ({
      onLeftChange(active: boolean) {
        if (active) {
          setValue(value - 1);
        }
      },

      onLeftHeld() {
        setValue(value - 1);
      },

      onRightChange(active: boolean) {
        if (active) {
          setValue(value + 1);
        }
      },

      onRightHeld() {
        setValue(value + 1);
      },
    }),
    [setValue, value]
  );

  const dragCallbacks = useMemo<DragMethods<HTMLElement>>(() => {
    function valueFromX(dx: number): number {
      let newValue = dragValue;
      newValue += dx * max;
      return newValue;
    }

    return {
      onDragStart(ds) {
        setDragOrigin(ds.x);
        setDragValue(value);
      },

      onDragMove(ds) {
        if (element.current) {
          setValue(valueFromX((ds.x - dragOrigin) / element.current.offsetWidth));
        }
      },
    };
  }, [dragOrigin, dragValue, max, setValue, value]);

  const dragMethods = usePointerDrag(dragCallbacks);
  const displayVal = enumVals[value] || String(value);

  return (
    <EnumEditorElt
      className={clsx('control', 'combo-slider', className)}
    >
      <ArrowButtonLeft
        className="left"
        onChange={buttonMethods.onLeftChange}
        onHeld={buttonMethods.onLeftHeld}
      />
      <ValueContainer
        {...dragMethods}
        className="center"
        ref={element}
      >
        <ControlName className="name">{name}</ControlName>
        <ControlValue className="value">{displayVal}</ControlValue>
      </ValueContainer>
      <ArrowButtonRight
        className="right"
        onChange={buttonMethods.onRightChange}
        onHeld={buttonMethods.onRightHeld}
      />
    </EnumEditorElt>
  );
};

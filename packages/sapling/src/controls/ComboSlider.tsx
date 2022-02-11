import React, { FC, useCallback, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import styled from '@emotion/styled';
import { DragMethods, usePointerDrag } from './usePointerDrag';
import { colors } from '../styles';
import { ArrowButtonLeft, ArrowButtonRight, ControlName, ControlValue } from './Controls';
import { NumberInput } from './NumberInput';

const ComboSliderElt = styled.div`
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

const SliderContainer = styled.div`
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

const SliderKnob = styled.div`
  background-color: ${colors.comboSliderKnob};
  border-radius: 3px;
  position: absolute;
  left: 0;
  top: 3px;
  right: 0;
  bottom: 3px;
`;

const SliderInput = styled(NumberInput)`
  display: none;
  background-color: transparent;
  color: ${colors.comboTextEdit};
  position: absolute;
  text-align: center;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  width: 100%;
  border: none;
  z-index: 1;
`;

// TODO: log scale testing

interface Props {
  name: string;
  value: number;
  min?: number;
  max: number;
  precision?: number; // 0 = integer, undefined == unlimited
  increment?: number;
  logScale?: boolean;
  className?: string;
  onChange: (value: number) => void;
}

export const ComboSlider: FC<Props> = ({
  name,
  value,
  min = 0,
  max,
  precision,
  increment = 1,
  logScale = false,
  className,
  onChange,
}) => {
  const element = useRef<HTMLDivElement>(null);
  const inputEl = useRef<HTMLInputElement>(null);
  const [dragOrigin, setDragOrigin] = useState(0);
  const [dragValue, setDragValue] = useState(0);
  const [textActive, setTextActive] = useState(false);

  const setValue = useCallback(
    (value: number) => {
      let newValue = value;
      if (precision !== undefined) {
        const mag = 10 ** precision;
        newValue = Math.round(newValue * mag) / mag;
      }
      onChange(Math.min(max, Math.max(min, newValue)));
    },
    [max, min, onChange, precision]
  );

  const buttonMethods = useMemo(
    () => ({
      onLeftChange(active: boolean) {
        if (active) {
          setValue(value - increment);
        }
      },

      onLeftHeld() {
        setValue(value - increment);
      },

      onRightChange(active: boolean) {
        if (active) {
          setValue(value + increment);
        }
      },

      onRightHeld() {
        setValue(value + increment);
      },
    }),
    [increment, setValue, value]
  );

  const dragCallbacks = useMemo<DragMethods<HTMLElement>>(() => {
    function valueFromX(dx: number): number {
      let newValue = dragValue;
      if (logScale) {
        const scale = Math.log2(max / min);
        newValue = dragValue * Math.pow(2, dx * scale);
      } else {
        newValue += dx * (max - min);
      }
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
  }, [dragOrigin, dragValue, logScale, max, min, setValue, value]);

  const dragMethods = usePointerDrag(dragCallbacks);

  const onDoubleClick = useCallback(() => {
    if (inputEl.current) {
      inputEl.current.value = value.toString();
      inputEl.current.select();
      setTextActive(true);
      window.setTimeout(() => {
        inputEl.current?.focus();
      }, 5);
    }
  }, [value]);

  const onFocusInput = useCallback(() => setTextActive(true), []);
  const onBlurInput = useCallback(() => setTextActive(false), []);

  function toPercent(value: number) {
    if (logScale) {
      return (Math.log2(value / min) / Math.log2(max / min)) * 100;
    } else {
      return ((value - min) / (max - min)) * 100;
    }
  }

  const percent = toPercent(value);
  const displayVal = precision !== undefined ? roundToPrecision(value, precision) : value;

  return (
    <ComboSliderElt className={clsx('control', 'combo-slider', className, { textActive })}>
      <ArrowButtonLeft
        className="left"
        onChange={buttonMethods.onLeftChange}
        onHeld={buttonMethods.onLeftHeld}
      />
      <SliderContainer
        {...dragMethods}
        className="center"
        onDoubleClick={onDoubleClick}
        ref={element}
      >
        <ControlName className="name">{name}</ControlName>
        <ControlValue className="value">{displayVal}</ControlValue>
        <SliderInput
          autoFocus={true}
          value={value}
          onFocus={onFocusInput}
          onBlur={onBlurInput}
          onChange={setValue}
          inputRef={inputEl}
        />
        <SliderKnob style={{ width: `${percent}%` }} />
      </SliderContainer>
      <ArrowButtonRight
        className="right"
        onChange={buttonMethods.onRightChange}
        onHeld={buttonMethods.onRightHeld}
      />
    </ComboSliderElt>
  );
};

function roundToPrecision(value: number, precision: number): number {
  const mag = 10 ** precision;
  return Math.round(value * mag) / mag;
}

import React, { FC, useCallback, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import styled from '@emotion/styled';
import { DragMethods, usePointerDrag } from './usePointerDrag';
import { colors } from '../styles';
import { Range } from '../properties';
import { ArrowButtonLeft, ArrowButtonRight, ControlName, ControlValue } from './Controls';
import { RangeInput } from './RangeInput';

type DragMode = 'low' | 'high' | 'both' | null;

const ComboRangeSliderElt = styled.div`
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

const Input = styled(RangeInput)`
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
`;

const TrackContainer = styled.div`
  position: absolute;
  border-radius: 3px;
  top: 3px;
  bottom: 3px;
  left: 0;
  right: 0;
  overflow: hidden;
  cursor: ew-resize;
`;

const TrackLow = styled.div`
  background-color: ${colors.comboSliderKnob};
  position: absolute;
  top: 0;
  bottom: 0;
`;

const TrackRange = styled.div`
  background-color: ${colors.comboSliderRange};
  position: absolute;
  top: 0;
  bottom: 0;
  border-left: 1px solid ${colors.comboSliderRangeBorder};
  border-right: 1px solid ${colors.comboSliderRangeBorder};
`;

const DragLow = styled.div`
  color: ${colors.comboSliderRange};
  position: absolute;
  top: 0;
  bottom: 0;
  left: -12px;
  width: 12px;
  cursor: w-resize;
  font-size: 10px;
  vertical-align: middle;
  padding-top: 2px;
`;

const DragHigh = styled.div`
  color: ${colors.comboSliderRange};
  position: absolute;
  top: 0;
  bottom: 0;
  right: -12px;
  width: 12px;
  cursor: e-resize;
  font-size: 10px;
  text-align: right;
  vertical-align: middle;
  padding-top: 2px;
`;

interface Props {
  name: string;
  value: Range;
  min?: number;
  max: number;
  precision?: number; // 0 = integer, undefined == unlimited
  increment?: number;
  logScale?: boolean;
  className?: string;
  onChange: (value: Range) => void;
}

export const ComboRangeSlider: FC<Props> = ({
  name,
  value,
  min = 0,
  max,
  precision = 1,
  increment = 1,
  logScale = false,
  className,
  onChange,
}) => {
  const element = useRef<HTMLDivElement>(null);
  const inputEl = useRef<HTMLInputElement>(null);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [dragOrigin, setDragOrigin] = useState(0);
  const [dragRefValue, setDragRefValue] = useState<Range>([0, 0]);
  const [textActive, setTextActive] = useState(false);

  const quantize = useCallback(
    (value: number) => {
      if (precision !== undefined) {
        const mag = 10 ** precision;
        return Math.round(value * mag) / mag;
      }
      return value;
    },
    [precision]
  );

  const setValue = useCallback(
    (value: Range) => {
      let [lo, hi] = value;
      lo = clamp(quantize(lo), min, max);
      hi = clamp(quantize(hi), lo, max);
      onChange([lo, hi]);
    },
    [max, min, onChange, quantize]
  );

  const buttonMethods = useMemo(() => {
    function update(amount: number) {
      if (amount > 0) {
        const inc = Math.min(amount, max - value[1]);
        setValue([value[0] + inc, value[1] + inc]);
      } else if (amount < 0) {
        const inc = Math.max(amount, min - value[0]);
        setValue([value[0] + inc, value[1] + inc]);
      }
    }
    return {
      onLeftChange(active: boolean) {
        if (active) {
          update(-increment);
        }
      },

      onLeftHeld() {
        update(-increment);
      },

      onRightChange(active: boolean) {
        if (active) {
          update(increment);
        }
      },

      onRightHeld() {
        update(increment);
      },
    };
  }, [increment, setValue, value, min, max]);

  const dragCallbacks = useMemo<DragMethods<HTMLElement>>(() => {
    function valueFromX(dx: number): number {
      let newValue = dragMode === 'high' ? dragRefValue[1] : dragRefValue[0];
      if (logScale) {
        newValue = 2 ** (Math.log2(newValue) + dx * Math.log2(max - min + 1));
      } else {
        newValue += dx * (max - min);
      }
      return newValue;
    }

    return {
      onDragStart(ds) {
        const mode = ds.target?.dataset.direction as DragMode || 'both';
        setDragOrigin(ds.x);
        setDragMode(mode);
        setDragRefValue([...value]);
      },

      onDragMove(ds) {
        if (element.current) {
          const v = valueFromX((ds.x - dragOrigin) / element.current.offsetWidth);
          if (dragMode === 'low') {
            setValue([v, dragRefValue[1]]);
          } else if (dragMode === 'high') {
            setValue([Math.min(dragRefValue[0], v), v]);
          } else {
            const span = dragRefValue[1] - dragRefValue[0];
            const v1 = clamp(v, min, max - span);
            setValue([v1, v1 + span]);
          }
        }
      },
    };
  }, [dragRefValue, logScale, max, min, value, dragOrigin, dragMode, setValue]);

  const dragMethods = usePointerDrag(dragCallbacks);

  const onDoubleClick = useCallback(() => {
    if (inputEl.current) {
      inputEl.current.value = formatRange(value, precision);
      inputEl.current.select();
      setTextActive(true);
      window.setTimeout(() => {
        inputEl.current?.focus();
      }, 5);
    }
  }, [precision, value]);

  const onFocusInput = useCallback(() => setTextActive(true), []);
  const onBlurInput = useCallback(() => setTextActive(false), []);

  function toPercent(value: number) {
    if (logScale) {
      return (Math.log2(value - min + 1) / Math.log2(max - min + 1)) * 100;
    } else {
      return ((value - min) / (max - min)) * 100;
    }
  }

  const percent0 = toPercent(value[0]);
  const percent1 = toPercent(value[1]);
  const displayVal = formatRange(value, precision);

  return (
    <ComboRangeSliderElt className={clsx('control', 'combo-slider', className, { textActive })}>
      <ArrowButtonLeft
        className="left"
        onChange={buttonMethods.onLeftChange}
        onHeld={buttonMethods.onLeftHeld}
      />
      <SliderContainer
        {...dragMethods}
        ref={element}
        className="center"
        onDoubleClick={onDoubleClick}
      >
        <TrackContainer>
          <TrackLow style={{ left: 0, width: `${percent0}%` }} />
          <TrackRange style={{ left: `${percent0}%`, width: `${percent1 - percent0}%` }}>
            <DragLow data-direction="low">&#x25C0;</DragLow>
            <DragHigh data-direction="high">&#x25B6;</DragHigh>
          </TrackRange>
        </TrackContainer>
        <ControlName className="name">{name}</ControlName>
        <ControlValue className="value">{displayVal}</ControlValue>
        <Input
          autoFocus={true}
          value={value}
          onChange={setValue}
          onFocus={onFocusInput}
          onBlur={onBlurInput}
          inputRef={inputEl}
        />
      </SliderContainer>
      <ArrowButtonRight
        className="right"
        onChange={buttonMethods.onRightChange}
        onHeld={buttonMethods.onRightHeld}
      />
    </ComboRangeSliderElt>
  );
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatRange(value: Range, precision: number): string {
  return `${roundToPrecision(value[0], precision)} : ${roundToPrecision(value[1], precision)}`;
}

function roundToPrecision(value: number, precision: number): number {
  const mag = 10 ** precision;
  return Math.round(value * mag) / mag;
}

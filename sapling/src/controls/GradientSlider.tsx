import React, { memo, useMemo } from 'react';
import clsx from 'clsx';
import styled from '@emotion/styled';
import { DragState, usePointerDrag } from './usePointerDrag';
import { FC } from 'react';

const GradientSliderElt = styled.div`
  display: inline-block;
  position: relative;
  height: 18px;
  min-width: 64px;
  overflow: hidden;
  user-select: none;

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
`;

const GradientSliderBg = styled.div`
  border-radius: 5px;
  overflow: hidden;
  position: absolute;

  left: 0;
  top: 4px;
  right: 0;
  bottom: 4px;

  > .left {
    position: absolute;
    left: 0;
    top: 0;
    width: 10px;
    bottom: 0;
  }

  > .middle {
    position: absolute;
    left: 10px;
    top: 0;
    right: 10px;
    bottom: 0;
  }

  > .right {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 10px;
  }
`;

const GradientSliderTrack = styled.div`
  position: absolute;
  left: 0;
  right: 12px;
  top: 0;
  bottom: 0;
  cursor: pointer;
`;

const GradientSliderThumb = styled.div`
  position: absolute;
  width: 10px;
  height: 10px;
  top: 3px;
  bottom: 6px;
  border: 1px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 4px 1px #000;
`;

interface Props {
  value: number;
  min?: number;
  max: number;
  className?: string;
  colors: string[];
  disabled?: boolean;
  onChange: (value: number) => void;
}

export const GradientSlider: FC<Props> = memo(({
  value,
  min = 0,
  max,
  className,
  colors,
  disabled,
  onChange,
}) => {
  const callbacks = useMemo(() => {
    const valueFromX = (ds: DragState) => {
      const dx = ds.x - 13;
      const value = (dx * (max - min)) / (ds.rect.width - 26) + min;
      return Math.min(max, Math.max(min, value));
    };

    return {
      onDragStart(ds: DragState) {
        onChange(valueFromX(ds));
      },
      onDragMove(ds: DragState) {
        onChange(valueFromX(ds));
      },
    };
  }, [onChange, min, max]);

  const dragMethods = usePointerDrag(callbacks);
  const gradient = `linear-gradient(to right, ${colors.join(', ')})`;

  return (
    <GradientSliderElt
      {...dragMethods}
      className={clsx('control gradient-slider', className, { disabled })}
    >
      <GradientSliderBg className="bg">
        <div className="left" style={{ backgroundColor: colors[0] }} />
        <div className="middle" style={{ backgroundImage: gradient }} />
        <div className="right" style={{ backgroundColor: colors[colors.length - 1] }} />
      </GradientSliderBg>
      <GradientSliderTrack className="track">
        <GradientSliderThumb
          className="thumb"
          style={{ left: `${((value - min) * 100) / (max - min)}%` }}
        />
      </GradientSliderTrack>
    </GradientSliderElt>
  );
});
GradientSlider.displayName = 'GradientSlider';

// @flow

import _ from 'lodash';

import React, { useState, useContext, useCallback, createContext, useEffect } from 'react';

import { useSpring, animated as a, interpolate } from 'react-spring'
import VisibilitySensor from 'react-visibility-sensor';
import { useTheme, makeStyles } from '@material-ui/core';

import { ISpringRevealsScrollContext, SpringRevealsScrollContext, useSpringRevealsScroll } from './scroll';
import { ISpringRevealsScreenContext, SpringRevealsScreenContext, useSpringRevealsScreen } from './screen';

const useStyle = makeStyles(() => ({
  item: {
  },
}));

const delay = (time, callback) => {
  return new Promise((res) => {
    setTimeout(() => {
      if (callback) callback();
      res();
    }, time);
  });
};

export const Item = ({
  scrollContext = SpringRevealsScrollContext,
  screenContext = SpringRevealsScreenContext,
  transform = ({ sl, t, slw, slh, snw, snh, v }: any) => `translateY(${t - (sl + (slh / 2))}px)`,
  style,
  wrapperProps,
  sensorProps,
  times = 1,
  onTimesChange,
  onChangeVisible,
  ...props
}: {
  scrollContext?: React$Context<ISpringRevealsScrollContext>;
  screenContext?: React$Context<ISpringRevealsScreenContext>;
  transform?: (...args: any) => string;
  style?: any;
  wrapperProps?: any;
  sensorProps?: any;
  times?: number;
  onTimesChange?: (times: number) => void;
  onChangeVisible?: (props: { v: number, vt: number, delay: (time: number, callback?: () => void) => Promise<void>, update: () => void }) => any;
}) => {
  const [timesState, setTimesState] = useState(times);
  const [{ v, vt }, setItemSpring] = useSpring(() => ({ v: 0, vt: 0 }));
  const { scrollSpring: { sl, slw, slh, xy } } = useSpringRevealsScroll({ context: scrollContext });
  const { screenSpring: { t, snw, snh } } = useSpringRevealsScreen({ context: screenContext });

  useEffect(() => {
    if (times != timesState) setTimesState((times));
  }, [times]);

  const classes = useStyle();

  const transformSpring = interpolate(
    [sl, t, slw, slh, snw, snh, xy, v, vt],
    (sl, t, slw, slh, snw, snh, xy, v, vt) => transform({ sl, t, slw, slh, snw, snh, xy, v, vt }),
  );

  return <VisibilitySensor
    onChange={isVisible => {
      const setSpringOnChangeVisible = () => {
        setItemSpring({ v: isVisible ? 1 : 0, vt: isVisible ? 1 : timesState ? 0 : 1 });
        if (timesState) setTimesState(timesState - 1);
      };
      if (onChangeVisible) {
        onChangeVisible({ v: isVisible, vt: isVisible ? 1 : timesState ? 0 : 1, delay, update: setSpringOnChangeVisible });
      } else {
        setSpringOnChangeVisible();
      }
    }}
    {...sensorProps}
  >
    <div {...wrapperProps}>
      <a.div
        className={classes.item}
        {...props}
        style={{
          ...style,
          transform: transformSpring,
        }}
      />
    </div>
  </VisibilitySensor>;
};

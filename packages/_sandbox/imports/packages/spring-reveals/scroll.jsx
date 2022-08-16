// @flow

import React, { useState, useRef, useContext, useCallback, createContext } from 'react';

import { useSpring, animated as a, interpolate } from 'react-spring'
import { useTheme, makeStyles } from '@material-ui/core';

export interface ISpringRevealsScrollContext {
  scrollSpring: { sl: any; slh: any; slw: any; xy: any[] };
  setScrollSpring?: any;
};

export const SpringRevealsScrollContext = createContext<ISpringRevealsScrollContext>({
  scrollSpring: { sl: null, slh: null, slw: null, xy: [] },
});

export function useSpringRevealsScroll({
  context = SpringRevealsScrollContext,
}: {
  context?: React$Context<ISpringRevealsScrollContext>;
} = {}) {
  return useContext(context);
};

const useStyle = makeStyles(() => ({
  scroll: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    overflow: 'auto',
  },
}));

export const SpringRevealsScrollProvider = ({
  context = SpringRevealsScrollContext,
  children,
  ...props
}: {
  context?: React$Context<ISpringRevealsScrollContext>;
  children: any;
  [string]: any;
}) => {
  const [scrollSpring, setScrollSpring] = useSpring(() => ({
    sl: 0,
    slh: 0,
    slw: 0,
    xy: [0, 0],
  }));
  const onScroll = useCallback(e => {
    setScrollSpring({
      sl: e.target.scrollTop,
      slh: scrollRef.current.clientHeight,
      slw: scrollRef.current.clientWidth,
    });
  }, []);
  const onMouseMove = useCallback(
    ({ clientX: x, clientY: y }) => setScrollSpring({
      xy: [
        -(y - scrollRef.current.clientHeight / 2),
        (x - scrollRef.current.clientWidth / 2),
      ],
    })
  );
  const classes = useStyle();
  const scrollRef: any = useRef();

  return <div
    ref={scrollRef}
    onScroll={onScroll}
    onMouseMove={onMouseMove}
    className={classes.scroll}
    {...props}
  >
    <context.Provider value={{
      scrollSpring,
      setScrollSpring,
    }}>
      {children}
    </context.Provider>
  </div>;
};

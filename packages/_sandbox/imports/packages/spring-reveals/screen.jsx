// @flow

import React, { useRef, useState, useContext, useCallback, createContext, useEffect } from 'react';

import { useSpring, animated as a, interpolate } from 'react-spring'
import { useTheme, makeStyles } from '@material-ui/core';
import ReactResizeDetector from 'react-resize-detector';

export  interface ISpringRevealsScreenContext {
  screenSpring: { t: any; snw: any; snh: any; };
  setScreenSpring?: any;
};

export const SpringRevealsScreenContext = createContext<ISpringRevealsScreenContext>({
  screenSpring: { t: null, snw: null, snh: null },
});

export function useSpringRevealsScreen({
  context = SpringRevealsScreenContext,
}: {
  context?: React$Context<ISpringRevealsScreenContext>;
} = {}) {
  return useContext(context);
};

const useStyle = makeStyles(() => ({
  screen: {
    position: 'relative',
  },
}));

export const SpringRevealsScreenProvider = ({
  context = SpringRevealsScreenContext,
  children,
  ...props
}: {
  context?: React$Context<ISpringRevealsScreenContext>;
  children?: any;
  [string]: any;
}) => {
  const [screenSpring, setScreenSpring] = useSpring(() => ({
    t: 0, snw: 0, snh: 0,
  }));
  const classes = useStyle();
  const screenRef = useRef();

  useEffect(() => {
    if (screenRef.current) {
      setScreenSpring({ t: screenRef.current.offsetTop });
    }
  });

  const onResize = useCallback((width, height) => {
    setScreenSpring({ snw: width, snh: height });
  });

  return <div ref={screenRef} className={classes.screen} {...props}>
    <ReactResizeDetector handleWidth handleHeight onResize={onResize} />
    <context.Provider value={{
      screenSpring,
      setScreenSpring,
    }}>
      {children}
    </context.Provider>
  </div>;
};

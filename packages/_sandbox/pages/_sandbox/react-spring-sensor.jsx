// @flow

import React, { useContext, useCallback } from 'react';

import { useTheme, Typography, Grid } from '@material-ui/core';
import _ from 'lodash';

import { useSpring, animated as a, interpolate } from 'react-spring';

import VisibilitySensor from 'react-visibility-sensor';

import { wrapPage } from '../../imports/wrap-page';

export default wrapPage(() => {
  const [propsVis1, setVis1] = useSpring(() => ({ opacity: 0 }));

  return (
    <>
      <div
        style={{
          height: 800,
        }}
      />
      <VisibilitySensor
        offset={{ top: 100, bottom: 100 }}
        onChange={isVisible => {
          setVis1({ opacity: isVisible ? 1 : 0 });
        }}
      >
        <a.div
          style={{
            ...propsVis1,
            background: 'purple',
            height: 100,
          }}
        />
      </VisibilitySensor>
      <div
        style={{
          height: 800,
        }}
      />
    </>
  );
});

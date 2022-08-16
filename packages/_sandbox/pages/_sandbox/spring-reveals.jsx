// @flow

import React, { useContext, useCallback, useState } from 'react';

import { useTheme, Typography, Grid } from '@material-ui/core';
import _ from 'lodash';

import { SpringRevealsScrollProvider as Scroll } from '../../imports/packages/spring-reveals/scroll';
import { SpringRevealsScreenProvider as Screen } from '../../imports/packages/spring-reveals/screen';
import { Item } from '../../imports/packages/spring-reveals/item';

import { wrapPage } from '../../imports/wrap-page';

// percent on screen (t-sl)/(slh/100)
// percent on screen invert (100-(t-sl)/(slh/100))
// y to x (sw/100)*(100-((t-sl)/(slh/100)))

export default () => {
  const [times, setTimes] = useState(1);
  const [background, setBackground] = useState('pink');

  return <Scroll>
    <div style={{ height: 1000 }}/>
    <Screen style={{
      background: 'blue',
      height: 400
    }}>
      screen
      <Item
        sensorProps={{
          offset: { top: 100, bottom: 100 },
        }}
        transform={({ sl, t, slw, slh, snw, snh, v, xy }) => (`
          translateY(${(t-(sl+((slh/2)-(snh/2))))*0.2}px)
          scaleX(${v})
          perspective(600px)
          rotateX(${xy[0] * 0.2}deg) rotateY(${xy[1] * 0.2}deg)
        `)}
        wrapperProps={{
          style: {
            position: 'absolute',
            width: '50%', height: '20%',
            top: '20%', left: '25%',
          },
        }}
        style={{
          transformOrigin: 'left center',
          background: 'red',
          width: '100%', height: '100%',
        }}
      >
        item multiple times with mouse perspective
      </Item>
      <Item
        times={times}
        sensorProps={{
          offset: { top: 100, bottom: 100 },
        }}
        transform={({ sl, t, slw, slh, snw, snh, v, vt, xy }) => (`
          translateY(${(t-(sl+((slh/2)-(snh/2))))*0.2}px)
          scaleX(${vt})
        `)}
        wrapperProps={{
          style: {
            position: 'absolute',
            width: '50%', height: '20%',
            top: '40%', left: '25%',
          },
        }}
        style={{
          transformOrigin: 'left center',
          background: 'yellow',
          width: '100%', height: '100%',
        }}
        onClick={() => setTimes(_.random(1,3))}
      >
        item animate times: {times} (click to update)
      </Item>
      <Item
        sensorProps={{
          offset: { top: 100, bottom: 100 },
        }}
        transform={({ sl, t, slw, slh, snw, snh, v, vt, xy }) => (`
          translateY(${(t-(sl+((slh/2)-(snh/2))))*0.2}px)
          scaleX(${0.5 + (v * 0.5)})
        `)}
        wrapperProps={{
          style: {
            position: 'absolute',
            width: '50%', height: '20%',
            top: '60%', left: '25%',
          },
        }}
        style={{
          transformOrigin: 'left center',
          background,
          width: '100%', height: '100%',
        }}
        onChangeVisible={async ({ v, delay, update }) => {
          await delay(1000);
          setBackground(v ? 'pink' : 'orange');
          update();
        }}
      >
        custom onVisible with delay
      </Item>
    </Screen>
    <div style={{ height: 1000 }}/>
  </Scroll>;
};

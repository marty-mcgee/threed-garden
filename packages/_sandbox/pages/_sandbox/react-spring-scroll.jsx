// @flow

import React, { useContext, useCallback } from 'react';

import { useTheme, Typography, Grid } from '@material-ui/core';
import _ from 'lodash';

import { useSpring, animated as a, interpolate } from 'react-spring';

import { wrapPage } from '../../imports/wrap-page';

export default wrapPage(() => {
  // инициализировать одно spring поведение
  const [{ xys, s, spx }, setSpring] = useSpring(() => ({
    s: 0,
    spx: 0,
    xys: [0, 0, 1],
    config: { mass: 5, tension: 350, friction: 40 },
  }));

  // создать реакцию на скролл (затем передать в div)
  const onScroll = useCallback(e => {
    return setSpring({
      s: e.target.scrollTop / (e.target.scrollHeight - e.target.clientHeight),
      spx: e.target.scrollTop,
    });
  }, []);

  // создать поведения для разных элементов и передать их в style transform
  // s от 0 до 1 прокрученность от начала до конца, xys[0] положение мыши по x, xys[1] по y
  const item1 = interpolate(
    [s, xys],
    (s, xys) =>
      `scale(${s}) perspective(600px) rotateX(${xys[0]}deg) rotateY(${
        xys[1]
      }deg)`,
  );
  const item2 = interpolate([s, xys], (s, xys) => `rotate(${s * 100}deg)`);
  const item3 = interpolate(
    [s, xys],
    (s, xys) => `translateY(${-(s * 2000) + 600}px)`,
  );
  const item4 = interpolate(
    [s, xys],
    (s, xys) => `translateY(${-(s * 300) + 0}px)`,
  );
  const item5 = interpolate([s, xys], (s, xys) => `scaleX(${s * 2})`);
  const item6 = interpolate([s, xys], (s, xys) => `scaleY(${s})`);

  return (
    <>
      <div
        onScroll={onScroll}
        onMouseMove={({ clientX: x, clientY: y }) =>
          setSpring({
            xys: [
              -(y - window.innerHeight / 2) / 20,
              (x - window.innerWidth / 2) / 20,
              1.1,
            ],
          })
        }
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          overflow: 'scroll',
        }}
      >
        <Grid container justify="center">
          <Grid item xs={4}>
            <a.div
              style={{ transform: item2, height: 300, background: 'red' }}
            />
          </Grid>
        </Grid>
        <Grid container justify="flex-start">
          <Grid item xs={4}>
            <a.div
              style={{ transform: item3, height: 300, background: 'blue' }}
            />
          </Grid>
        </Grid>
        <Grid container justify="flex-end">
          <Grid item xs={4}>
            <a.div
              style={{ transform: item4, height: 300, background: 'green' }}
            />
          </Grid>
        </Grid>
        <Grid container justify="center">
          <Grid item xs={4} style={{ overflow: 'hidden' }}>
            <a.div
              style={{
                transform: item5,
                transformOrigin: 'center left',
                height: 100,
                background: 'yellow',
              }}
            />
          </Grid>
        </Grid>
        <div
          style={{
            height: 1000,
          }}
        />
        <a.div
          style={{
            transform: item1,
            position: 'fixed',
            top: 'calc(50% - 150px)',
            left: 'calc(50% - 150px)',
            width: 300,
            height: 300,
            background: 'gray',
          }}
        />
        <a.div
          style={{
            transform: item6,
            position: 'fixed',
            top: 0,
            left: 0,
            width: 10,
            height: '100%',
            background: 'brown',
          }}
        />
      </div>
    </>
  );
});

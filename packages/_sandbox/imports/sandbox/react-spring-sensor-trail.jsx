import React, { useState } from 'react';
import { render } from 'react-dom';
import { useTrail, animated } from 'react-spring';

import VisibilitySensor from 'react-visibility-sensor';
import { Typography } from '@material-ui/core';

const config = { mass: 5, tension: 2000, friction: 200 };

export const SpringSensorTrail = ({
  items = ['abc','def','qwe'],
  itemHeight = 30,
}) => {
  const [toggle, setToggle] = useState(true);

  const trail = useTrail(items.length, {
    config,
    opacity: toggle ? 1 : 0,
    x: toggle ? 0 : 20,
    height: toggle ? itemHeight : 0,
    from: { opacity: 0, x: 20, height: 0 },
  });

  return (
    <>
      <VisibilitySensor
        offset={{ top: 100, bottom: 100 }}
        onChange={isVisible => setToggle(isVisible)}
      >
        <div
          style={{
            background: 'gray',
            height: itemHeight * items.length,
          }}
        >
          {trail.map(({ x, height, ...rest }, index) => (
            <animated.div
              key={items[index]}
              style={{
                ...rest,
                height: itemHeight,
                transform: x.interpolate(x => `translate3d(0,${x}px,0)`),
              }}
            >
              <animated.div style={{ overflow: 'hidden', height }}>
                {items[index]}
              </animated.div>
            </animated.div>
          ))}
        </div>
      </VisibilitySensor>
    </>
  );
};

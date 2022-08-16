// @flow

import React, { useState } from 'react';
import { render } from 'react-dom';

import { wrapPage } from '../../imports/wrap-page';

import { SpringSensorTrail } from '../../imports/sandbox/react-spring-sensor-trail.jsx';
import { Typography } from '@material-ui/core';

export default wrapPage(() => {
  return (
    <>
      <div
        style={{
          height: 800,
        }}
      />
      <SpringSensorTrail
        items={[
          <Typography variant="h5">test1</Typography>, 
          <Typography variant="h5">test2</Typography>, 
          <Typography variant="h5">test3</Typography>, 
          <Typography variant="h5">test4</Typography>,
        ]}
        itemHeight={50}
      />
      <SpringSensorTrail
        items={[
          <Typography variant="h3">test1</Typography>,
          <Typography variant="h3">test1</Typography>,
        ]}
        itemHeight={70}
      />
      <div
        style={{
          height: 800,
        }}
      />
    </>
  );
});

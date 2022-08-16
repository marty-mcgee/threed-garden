// @flow

import React, { useState, useContext } from 'react';

import { useTheme, Typography, makeStyles } from '@material-ui/core';
import { Picture } from '../../imports/packages/picture';
import { ChildrenResponsive } from '../../imports/packages/children-responsive';
import { wrapPage } from '../../imports/wrap-page';
import _ from 'lodash';

// $flowignore
const ri = require('../../images/sandbox.jpg?sizes[]=1800,sizes[]=1280,sizes[]=960,sizes[]=600,sizes[]=300,sizes[]=100');

const useStyle = makeStyles(() => ({
  screen: {
    position: 'relative',
    width: '100%',
    height: '100vh',
  },
}));

export default wrapPage(() => {
  const classes = useStyle();
  return (
    <>
      <div className={classes.screen}>
        <div
          style={{
            position: 'absolute',
            left: '25%',
            top: '25%',
            width: '50%',
            height: '50%',
            border: '1px solid black',
          }}
          >
          <ChildrenResponsive>
            <Picture images={ri.images} src={ri.src} />
          </ChildrenResponsive>
        </div>
      </div>
      <div className={classes.screen}>
        <div
          style={{
            position: 'absolute',
            left: '25%',
            top: '25%',
            width: '50%',
            height: '50%',
            border: '1px solid black',
          }}
          >
          <ChildrenResponsive>
            <div style={{ display: 'inline-block' }}>inline-block</div>
          </ChildrenResponsive>
        </div>
      </div>
    </>
  );
});

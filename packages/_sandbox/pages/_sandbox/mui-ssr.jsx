// @flow

import React from 'react';

import _ from 'lodash';
import { Button } from '@material-ui/core';
import { ThemeProvider } from '@material-ui/styles';
import { createMuiTheme, makeStyles } from '@material-ui/core/styles';

import { wrapPage } from '../../imports/wrap-page';
import { defaultTheme } from '../../imports/themes/default';

const useStyle = makeStyles(() => ({
  test: {
    color: 'red',
    // for test prefixes
    clipPath: 'polygon(85% 0, 100% 5%, 100% 100%, 0 100%, 0 5%, 15% 0)',
  },
}));

const darkTheme = theme =>
  createMuiTheme(
    _.merge({}, theme, {
      palette: {
        primary: {
          main: '#1c2022',
        },
      },
    }),
  );

export default wrapPage(() => {
  const classes = useStyle();
  return (
    <>
      <div className={classes.test}>test red test</div>
      <ThemeProvider theme={defaultTheme}>
        <Button variant="contained" color="primary">
          demo primary page
        </Button>
        <ThemeProvider theme={darkTheme}>
          <Button variant="contained" color="primary">
            demo primary page in dark theme
          </Button>
        </ThemeProvider>
      </ThemeProvider>
    </>
  );
});

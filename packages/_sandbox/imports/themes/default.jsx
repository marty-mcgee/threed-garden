import { createMuiTheme } from "@material-ui/core/styles";

export const fontFamily = 'Helvetica, sans-serif';

export const defaultTheme = createMuiTheme({
  typography: {
    fontFamily,
  },
  overrides: {
    MuiTab: {
      root: {
        minWidth: '0px !important',
        textTransform: 'none',
      },
    },
    MuiList: {
      root: {
        fontFamily,
      },
    },
  },
});

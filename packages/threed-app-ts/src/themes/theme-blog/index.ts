// @ts-nocheck

import { createTheme } from "@mui/material/styles"
import { red } from "@mui/material/colors"

// Create a theme instance.
const theme = createTheme({
  palette: {
    primary: {
      main: "#556cd6",
    },
    secondary: {
      main: "#19857b",
    },
    error: {
      main: red.A400,
    },
    white: {
      main: "#FFFFFF",
    },
    transparent: {
      main: "#FFFFFF",
    },
    black: {
      main: "#000000",
    },
    light: {
      main: "#CCCCCC",
    },
    dark: {
      main: "#333333",
    },
    gradients: {
      main: "#FFFFFF",
    },
    socialMediaColors: {
      main: "#AAAAAA",
    },
    badgeColors: {
      main: "#222222",
    },
    coloredShadows: {
      main: "#222222",
    },
    inputBorderColor: "#222222",
    tabs: {
      main: "#222222",
    }
  },
})

export default theme

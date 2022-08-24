// @mui material components
import { Theme } from "@mui/material/styles"

function navbar(theme: Theme | any, ownerState: any) {
  const { palette, boxShadows, functions, transitions, breakpoints, borders } =
    theme
  const { transparentNavbar, absolute, light, darkMode } = ownerState

  const { dark, white, text, transparent, background } = palette
  const { navbarBoxShadow } = boxShadows
  const { rgba, pxToRem } = functions
  const { borderRadius } = borders

  return {
    boxShadow: transparentNavbar || absolute ? "none" : navbarBoxShadow,
    backdropFilter:
      transparentNavbar || absolute
        ? "none"
        : `saturate(200%) blur(${pxToRem(30)})`,
    backgroundColor:
      transparentNavbar || absolute
        ? `${transparent.main} !important`
        : rgba(darkMode ? background.default : white.main, 0.8),

    color: () => {
      let color

      if (light) {
        color = white.main
      } else if (transparentNavbar) {
        color = text.main
      } else {
        color = dark.main
      }

      return color
    },
    top: absolute ? 0 : pxToRem(0),
    minHeight: pxToRem(0), // 75
    display: "grid",
    alignItems: "center",
    borderRadius: borderRadius.xl,
    paddingTop: pxToRem(0),
    paddingBottom: pxToRem(0),
    paddingRight: absolute ? pxToRem(2) : pxToRem(8),
    paddingLeft: absolute ? pxToRem(2) : pxToRem(0),

    "& > *": {
      transition: transitions.create("all", {
        easing: transitions.easing.easeInOut,
        duration: transitions.duration.standard,
      }),
    },

    "& .MuiToolbar-root": {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",

      [breakpoints.up("sm")]: {
        minHeight: "auto",
        padding: `${pxToRem(4)} ${pxToRem(0)}`,
      },
    },
  }
}

const navbarContainer = ({ breakpoints }: Theme): any => ({
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "space-between",
  pt: 0.0,
  pb: 0.0,
  // borderBottom: 1,
  // borderColor: "darkgreen",

  [breakpoints.up("md")]: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: "0",
    paddingBottom: "0",
  },
})

const navbarRow = ({ breakpoints }: Theme, { isMini }: any) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",

  [breakpoints.up("md")]: {
    justifyContent: isMini ? "space-between" : "stretch",
    width: isMini ? "100%" : "max-content",
  },

  [breakpoints.up("xl")]: {
    justifyContent: "stretch !important",
    width: "max-content !important",
  },
})

const navbarIconButton = ({ typography: { size }, breakpoints }: Theme) => ({
  px: 1,

  "& .material-icons, .material-icons-round": {
    fontSize: `${size.xl} !important`,
  },

  "& .MuiTypography-root": {
    display: "none",

    [breakpoints.up("sm")]: {
      display: "inline-block",
      lineHeight: 1.2,
      ml: 0.5,
    },
  },
})

const navbarDesktopMenu = ({ breakpoints }: Theme) => ({
  display: "none !important",
  cursor: "pointer",
  mt: 0.5,
  mr: 1.0,
  padding: 0,

  [breakpoints.up("xl")]: {
    display: "inline-block !important",
  },
})

const navbarMobileMenu = ({ breakpoints }: Theme) => ({
  display: "inline-block",
  lineHeight: 0,

  [breakpoints.up("xl")]: {
    display: "none",
  },
})

export {
  navbar,
  navbarContainer,
  navbarRow,
  navbarIconButton,
  navbarDesktopMenu,
  navbarMobileMenu,
}

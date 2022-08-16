// Company Juice Dashboard Base Styles
import boxShadows from "~/themes/theme-dark/base/boxShadows"
import typography from "~/themes/theme-dark/base/typography"
import colors from "~/themes/theme-dark/base/colors"
import borders from "~/themes/theme-dark/base/borders"

// Company Juice Dashboard Helper Functions
import pxToRem from "~/themes/theme-dark/functions/pxToRem"
import rgba from "~/themes/theme-dark/functions/rgba"

const { md } = boxShadows
const { size } = typography
const { text, transparent, light, dark, gradients, background, white } = colors
const { borderRadius } = borders

// types
type Types = any

const autocompletle: Types = {
  styleOverrides: {
    popper: {
      boxShadow: md,
      padding: pxToRem(8),
      fontSize: size.sm,
      color: text.main,
      textAlign: "left",
      backgroundColor: `${background.card} !important`,
      borderRadius: borderRadius.md,
    },

    paper: {
      boxShadow: "none",
      backgroundColor: transparent.main,
    },

    option: {
      padding: `${pxToRem(4.8)} ${pxToRem(16)}`,
      borderRadius: borderRadius.md,
      fontSize: size.sm,
      color: text.main,
      transition: "background-color 300ms ease, color 300ms ease",

      "&:hover, &:focus, &.Mui-selected, &.Mui-selected:hover, &.Mui-selected:focus":
        {
          backgroundColor: rgba(light.main, 0.2),
          color: white.main,
        },

      '&[aria-selected="true"]': {
        backgroundColor: `${rgba(light.main, 0.2)} !important`,
        color: `${white.main} !important`,
      },
    },

    noOptions: {
      fontSize: size.sm,
      color: text.main,
    },

    groupLabel: {
      color: dark.main,
    },

    loading: {
      fontSize: size.sm,
      color: text.main,
    },

    tag: {
      display: "flex",
      alignItems: "center",
      height: "auto",
      padding: pxToRem(4),
      backgroundColor: gradients.dark.state,
      color: white.main,

      "& .MuiChip-label": {
        lineHeight: 1.2,
        padding: `0 ${pxToRem(10)} 0 ${pxToRem(4)}`,
      },

      "& .MuiSvgIcon-root, & .MuiSvgIcon-root:hover, & .MuiSvgIcon-root:focus":
        {
          color: white.main,
          marginRight: 0,
        },
    },

    popupIndicator: {
      color: text.main,
    },

    clearIndicator: {
      color: text.main,
    },
  },
}

export default autocompletle

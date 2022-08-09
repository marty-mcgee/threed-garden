// Company Juice Dashboard Base Styles
import typography from "assets/theme/base/typography"
import borders from "assets/theme/base/borders"
import colors from "assets/theme/base/colors"

// Company Juice Dashboard Helper Functions
import pxToRem from "assets/theme/functions/pxToRem"

const { size, fontWeightRegular } = typography
const { borderRadius } = borders
const { dark } = colors

// types
type Types = any

const tab: Types = {
  styleOverrides: {
    root: {
      display: "flex",
      alignItems: "center",
      flexDirection: "row",
      flex: "1 1 auto",
      textAlign: "center",
      maxWidth: "unset !important",
      minWidth: "unset !important",
      minHeight: "unset !important",
      fontSize: size.md,
      fontWeight: fontWeightRegular,
      textTransform: "none",
      lineHeight: "inherit",
      padding: pxToRem(4),
      borderRadius: borderRadius.lg,
      color: `${dark.main} !important`,
      opacity: "1 !important",

      "& .material-icons, .material-icons-round": {
        marginBottom: "0 !important",
        marginRight: pxToRem(6),
      },

      "& svg": {
        marginBottom: "0 !important",
        marginRight: pxToRem(6),
      },
    },

    labelIcon: {
      paddingTop: pxToRem(4),
    },
  },
}

export default tab

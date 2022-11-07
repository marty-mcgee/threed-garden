// @mui material components
import { Theme } from "@mui/material/styles"

function timelineItem(theme: Theme, ownerState: any) {
  const { borders } = theme
  const { lastItem, isDark } = ownerState

  const { borderWidth, borderColor } = borders

  return {
    "&:after": {
      content: !lastItem && "''",
      position: "absolute",
      top: "2rem",
      left: "17px",
      height: "100%",
      opacity: isDark ? 0.1 : 1,
      borderRight: `${borderWidth[2]} solid ${borderColor}`,
    },
  }
}

export default timelineItem

// @mui material components
import { styled, Theme } from "@mui/material/styles"

// ThreeD Garden components
import MDButton from "~/components/MDButton"

export default styled(MDButton)(
  ({ theme, ownerState }: { theme?: Theme; ownerState: any }) => {
    const { borders, functions, typography, palette } = theme
    const { variant, paginationSize, active } = ownerState

    const { borderColor } = borders
    const { pxToRem } = functions
    const { fontWeightRegular, size: fontSize } = typography
    const { light } = palette

    // width, height, minWidth and minHeight values
    let sizeValue = pxToRem(36)

    if (paginationSize === "small") {
      sizeValue = pxToRem(30)
    } else if (paginationSize === "large") {
      sizeValue = pxToRem(46)
    }

    return {
      borderColor,
      margin: `0 ${pxToRem(2)}`,
      pointerEvents: active ? "none" : "auto",
      fontWeight: fontWeightRegular,
      fontSize: fontSize.sm,
      width: sizeValue,
      minWidth: sizeValue,
      height: sizeValue,
      minHeight: sizeValue,

      "&:hover, &:focus, &:active": {
        transform: "none",
        boxShadow:
          (variant !== "gradient" || variant !== "contained") &&
          "none !important",
        opacity: "1 !important",
      },

      "&:hover": {
        backgroundColor: light.main,
        borderColor,
      },
    }
  }
)

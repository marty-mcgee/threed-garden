/**
  The boxShadow() function helps you to create a box shadow for an element
 */

// ThreeD Garden Helper Functions
import rgba from "~/themes/theme-light/functions/rgba"
import pxToRem from "~/themes/theme-light/functions/pxToRem"

function boxShadow(
  offset: number[],
  radius: number[],
  color: string,
  opacity: number,
  inset: string = ""
): string {
  const [x, y] = offset
  const [blur, spread] = radius

  return `${inset} ${pxToRem(x)} ${pxToRem(y)} ${pxToRem(blur)} ${pxToRem(
    spread
  )} ${rgba(color, opacity)}`
}

export default boxShadow

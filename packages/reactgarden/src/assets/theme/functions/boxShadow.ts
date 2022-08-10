/**
  The boxShadow() function helps you to create a box shadow for an element
 */

// Company Juice Dashboard Helper Functions
import rgba from "assets/theme/functions/rgba"
import pxToRem from "assets/theme/functions/pxToRem"

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

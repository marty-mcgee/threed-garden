/**
  The rgba() function helps you to create a rgba color code, it uses the hexToRgb() function
  to convert the hex code into rgb for using it inside the rgba color format.
 */

// ThreeD Garden Helper Functions
import hexToRgb from '#/ui/themes/theme-light/functions/hexToRgb'

function rgba(color: string, opacity: number): string {
  return `rgba(${hexToRgb(color)}, ${opacity})`
}

export default rgba

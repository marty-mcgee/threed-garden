/**
  The linearGradient() function helps you to create a linear gradient color background
 */

function linearGradient(
  color: string,
  colorState: string,
  angle: number = 195
): string {
  return `linear-gradient(${angle}deg, ${color}, ${colorState})`
}

export default linearGradient

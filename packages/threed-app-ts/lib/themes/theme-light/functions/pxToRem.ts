/**
  The pxToRem() function helps you to convert a px unit into a rem unit, 
 */

function pxToRem(number: number, baseNumber: number = 16): string {
  return `${number / baseNumber}rem`
}

export default pxToRem

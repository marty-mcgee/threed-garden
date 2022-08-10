/**
 * The base border styles for the Company Juice DashboardUI Dashboard PRO Material.
 * You can add new border width, border color or border radius using this file.
 * You can customized the borders value for the entire Company Juice DashboardUI Dashboard PRO Material using thie file.
 */

// Company Juice Dashboard Base Styles
import colors from "themes/theme-dark/base/colors"

// Company Juice Dashboard Helper Functions
import pxToRem from "themes/theme-dark/functions/pxToRem"
import rgba from "themes/theme-dark/functions/rgba"

const { white } = colors

// types
interface Types {
  borderColor: string
  borderWidth: {
    0: number
    1: string
    2: string
    3: string
    4: string
    5: string
  }
  borderRadius: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
    xxl: string
    section: string
  }
}

const borders: Types = {
  borderColor: rgba(white.main, 0.4),

  borderWidth: {
    0: 0,
    1: pxToRem(1),
    2: pxToRem(2),
    3: pxToRem(3),
    4: pxToRem(4),
    5: pxToRem(5),
  },

  borderRadius: {
    xs: pxToRem(1.6),
    sm: pxToRem(2),
    md: pxToRem(6),
    lg: pxToRem(8),
    xl: pxToRem(12),
    xxl: pxToRem(16),
    section: pxToRem(160),
  },
}

export default borders

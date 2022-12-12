// ThreeD Garden Base Styles
import breakpoints from '~/ui/themes/theme-light/base/breakpoints'

// ThreeD Garden Helper Functions
import pxToRem from '~/ui/themes/theme-light/functions/pxToRem'

// types
type Types = any

const {
  values: { sm, md, lg, xl, xxl },
} = breakpoints

const SM = `@media (min-width: ${sm}px)`
const MD = `@media (min-width: ${md}px)`
const LG = `@media (min-width: ${lg}px)`
const XL = `@media (min-width: ${xl}px)`
const XXL = `@media (min-width: ${xxl}px)`

const sharedClasses = {
  paddingRight: `${pxToRem(24)} !important`,
  paddingLeft: `${pxToRem(24)} !important`,
  marginRight: 'auto !important',
  marginLeft: 'auto !important',
  width: '100% !important',
  position: 'relative',
}

const container: Types = {
  [SM]: {
    '.MuiContainer-root': {
      ...sharedClasses,
      maxWidth: '540px !important',
    },
  },
  [MD]: {
    '.MuiContainer-root': {
      ...sharedClasses,
      maxWidth: '720px !important',
    },
  },
  [LG]: {
    '.MuiContainer-root': {
      ...sharedClasses,
      maxWidth: '960px !important',
    },
  },
  [XL]: {
    '.MuiContainer-root': {
      ...sharedClasses,
      maxWidth: '1140px !important',
    },
  },
  [XXL]: {
    '.MuiContainer-root': {
      ...sharedClasses,
      maxWidth: '1320px !important',
    },
  },
}

export default container

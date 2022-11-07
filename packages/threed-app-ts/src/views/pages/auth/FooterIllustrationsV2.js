// ** React Imports
import { Fragment } from 'react'

// ** MUI Components
import useMediaQuery from '@mui/material/useMediaQuery'
import { styled, useTheme } from '@mui/material/styles'

// Styled Components
const MaskImg = styled('img')(() => ({
  bottom: 0,
  zIndex: -1,
  width: '100%',
  position: 'absolute'
}))

const TreeImg = styled('img')(({ theme }) => ({
  left: '3.0rem',
  bottom: '3.0rem',
  height: '14.0rem',
  position: 'absolute',
  [theme.breakpoints.down('lg')]: {
    left: 0,
    bottom: 0
  }
}))

const TreeImg2 = styled('img')(({ theme }) => ({
  right: '-3.0rem',
  bottom: '6.0rem',
  height: '16.0rem',
  position: 'absolute',
  [theme.breakpoints.down('lg')]: {
    right: '-4.0rem',
    bottom: '3.0rem',
  }
}))

const FooterIllustrationsV2 = props => {
  // ** Props
  const { image } = props

  // ** Hook
  const theme = useTheme()

  // ** Vars
  const hidden = useMediaQuery(theme.breakpoints.down('md'))
  if (!hidden) {
    return (
      <>
        {image || <TreeImg alt='tree' src='/images/pages/tree.png' />}
        <TreeImg2 alt='tree' src='/images/pages/tree-purple2.png' />
        <MaskImg alt='mask' src={`/images/pages/auth-v2-mask-${theme.palette.mode}.png`} />
      </>
    )
  } else {
    return null
  }
}

export default FooterIllustrationsV2

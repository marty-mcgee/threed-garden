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
  left: '2.125rem',
  bottom: '2.688rem',
  position: 'absolute',
  [theme.breakpoints.down('lg')]: {
    left: 0,
    bottom: 0
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
      <Fragment>
        {image || <TreeImg alt='tree' src='/images/pages/tree.png' />}
        <MaskImg alt='mask' src={`/images/pages/auth-v2-mask-${theme.palette.mode}.png`} />
      </Fragment>
    )
  } else {
    return null
  }
}

export default FooterIllustrationsV2

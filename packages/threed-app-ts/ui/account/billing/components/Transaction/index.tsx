import { ReactNode } from 'react'

// @mui material components
import Icon from '@mui/material/Icon'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'
import MDTypography from '#/lib/mui/MDTypography'
import MDButton from '#/lib/mui/MDButton'

// Declaring props types for Transaction
interface Props {
  color: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' | 'light' | 'dark'
  icon: ReactNode
  name: string
  description: string
  value: string
}

function Transaction({ color, icon, name, description, value }: Props): JSX.Element {
  return (
    <MDBox
      key={name}
      component='li'
      py={1}
      pr={2}
      mb={1}
    >
      <MDBox
        display='flex'
        justifyContent='space-between'
        alignItems='center'
      >
        <MDBox
          display='flex'
          alignItems='center'
        >
          <MDBox mr={2}>
            <MDButton
              variant='outlined'
              color={color}
              iconOnly
              circular
            >
              <Icon sx={{ fontWeight: 'bold' }}>{icon}</Icon>
            </MDButton>
          </MDBox>
          <MDBox
            display='flex'
            flexDirection='column'
          >
            <MDTypography
              variant='button'
              fontWeight='medium'
              gutterBottom
            >
              {name}
            </MDTypography>
            <MDTypography
              variant='caption'
              color='text'
              fontWeight='regular'
            >
              {description}
            </MDTypography>
          </MDBox>
        </MDBox>
        <MDTypography
          variant='button'
          color={color}
          fontWeight='medium'
          textGradient
        >
          {value}
        </MDTypography>
      </MDBox>
    </MDBox>
  )
}

export default Transaction

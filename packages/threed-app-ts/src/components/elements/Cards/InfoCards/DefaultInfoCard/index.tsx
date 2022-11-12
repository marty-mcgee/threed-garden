import { ReactNode } from 'react'

// @mui material components
import Card from '@mui/material/Card'
import Divider from '@mui/material/Divider'
import Icon from '@mui/material/Icon'

// ThreeD Garden components
import MDBox from '~/components/mui/MDBox'
import MDTypography from '~/components/mui/MDTypography'

// Declaring props types for DefaultInfoCard
interface Props {
  color?: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' | 'dark'
  icon: ReactNode
  title: string
  description?: string
  value?: string | number
  [key: string]: any
}

function DefaultInfoCard({ color, icon, title, description, value }: Props): JSX.Element {
  return (
    <Card>
      <MDBox
        p={2}
        mx={3}
        display='flex'
        justifyContent='center'
      >
        <MDBox
          display='grid'
          justifyContent='center'
          alignItems='center'
          bgColor={color}
          color='white'
          width='4rem'
          height='4rem'
          shadow='md'
          borderRadius='lg'
          variant='gradient'
        >
          <Icon>{icon}</Icon>
        </MDBox>
      </MDBox>
      <MDBox
        pb={2}
        px={2}
        textAlign='center'
        lineHeight={1.25}
      >
        <MDTypography
          variant='h6'
          fontWeight='medium'
          textTransform='capitalize'
        >
          {title}
        </MDTypography>
        {description && (
          <MDTypography
            variant='caption'
            color='text'
            fontWeight='regular'
          >
            {description}
          </MDTypography>
        )}
        {description && !value ? null : <Divider />}
        {value && (
          <MDTypography
            variant='h5'
            fontWeight='medium'
          >
            {value}
          </MDTypography>
        )}
      </MDBox>
    </Card>
  )
}

// Declaring default props for DefaultInfoCard
DefaultInfoCard.defaultProps = {
  color: 'info',
  value: '',
  description: '',
}

export default DefaultInfoCard

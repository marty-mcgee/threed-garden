import { ReactNode } from 'react'

// @mui material components
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'
import MDTypography from '#/lib/mui/MDTypography'

// ThreeD Garden contexts
import { useMaterialUIController } from '#/lib/contexts/MaterialUIContext'

// Declaring prop types for DefaultStatisticsCard
interface Props {
  title: string
  count: string | number
  percentage?: {
    color: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' | 'dark' | 'white'
    value: string | number
    label: string
  }
  dropdown?: {
    action: (...args: any) => void
    menu: ReactNode
    value: string
  }
  [key: string]: any
}

function DefaultStatisticsCard({ title, count, percentage, dropdown }: Props): JSX.Element {
  const [controller] = useMaterialUIController()
  const { darkMode } = controller

  return (
    <Card>
      <MDBox p={2}>
        <Grid container>
          <Grid
            item
            xs={7}
          >
            <MDBox
              mb={0.5}
              lineHeight={1}
            >
              <MDTypography
                variant='button'
                fontWeight='medium'
                color='text'
                textTransform='capitalize'
              >
                {title}
              </MDTypography>
            </MDBox>
            <MDBox lineHeight={1}>
              <MDTypography
                variant='h5'
                fontWeight='bold'
              >
                {count}
              </MDTypography>
              <MDTypography
                variant='button'
                fontWeight='bold'
                color={percentage.color}
              >
                {percentage.value}&nbsp;
                <MDTypography
                  variant='button'
                  fontWeight='regular'
                  color={darkMode ? 'text' : 'secondary'}
                >
                  {percentage.label}
                </MDTypography>
              </MDTypography>
            </MDBox>
          </Grid>
          <Grid
            item
            xs={5}
          >
            {dropdown && (
              <MDBox
                width='100%'
                textAlign='right'
                lineHeight={1}
              >
                <MDTypography
                  variant='caption'
                  color='secondary'
                  fontWeight='regular'
                  sx={{ cursor: 'pointer' }}
                  onClick={dropdown.action}
                >
                  {dropdown.value}
                </MDTypography>
                {dropdown.menu}
              </MDBox>
            )}
          </Grid>
        </Grid>
      </MDBox>
    </Card>
  )
}

// Setting default values for the props of DefaultStatisticsCard
DefaultStatisticsCard.defaultProps = {
  percentage: {
    color: 'success',
    value: '',
    label: '',
  },
  dropdown: false,
}

export default DefaultStatisticsCard

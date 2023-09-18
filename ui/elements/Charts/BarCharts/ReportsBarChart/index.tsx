import { useMemo, ReactNode } from 'react'

// @mui material components
import Card from '@mui/material/Card'
import Divider from '@mui/material/Divider'
import Icon from '@mui/material/Icon'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'
import MDTypography from '#/lib/mui/MDTypography'

// ReportsBarChart configurations
import configs from '~/ui/elements/Charts/BarCharts/ReportsBarChart/config'

// react-chartjs-2 components
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

// Declaring props types for ReportsBarChart
interface Props {
  color?: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' | 'dark'
  title: string
  description?: string | ReactNode
  date: string
  chart: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
    }
  }
  [key: string]: any
}

function ReportsBarChart({ color, title, description, date, chart }: Props): JSX.Element {
  const { data, options } = configs(chart.labels || [], chart.datasets || {})

  return (
    <Card sx={{ height: '100%' }}>
      <MDBox padding='1rem'>
        {useMemo(
          () => (
            <MDBox
              variant='gradient'
              bgColor={color}
              borderRadius='lg'
              coloredShadow={color}
              py={2}
              pr={0.5}
              mt={-5}
              height='12.5rem'
            >
              <Bar data={data} />
              {/* options={options} */}
            </MDBox>
          ),
          [chart, color]
        )}
        <MDBox
          pt={3}
          pb={1}
          px={1}
        >
          <MDTypography
            variant='h6'
            textTransform='capitalize'
          >
            {title}
          </MDTypography>
          <MDTypography
            component='div'
            variant='button'
            color='text'
            fontWeight='light'
          >
            {description}
          </MDTypography>
          <Divider />
          <MDBox
            display='flex'
            alignItems='center'
          >
            <MDTypography
              variant='button'
              color='text'
              lineHeight={1}
              sx={{ mt: 0.15, mr: 0.5 }}
            >
              <Icon>schedule</Icon>
            </MDTypography>
            <MDTypography
              variant='button'
              color='text'
              fontWeight='light'
            >
              {date}
            </MDTypography>
          </MDBox>
        </MDBox>
      </MDBox>
    </Card>
  )
}

// Setting default values for the props of ReportsBarChart
ReportsBarChart.defaultProps = {
  color: 'dark',
  description: '',
}

export default ReportsBarChart

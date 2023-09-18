import { useMemo, ReactNode } from 'react'

// @mui material components
import Card from '@mui/material/Card'
import Icon from '@mui/material/Icon'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'
import MDTypography from '#/lib/mui/MDTypography'

// DefaultDoughnutChart configurations
import configs from '~/ui/elements/Charts/DoughnutCharts/DefaultDoughnutChart/config'

// react-chartjs-2 components
import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  // CategoryScale,
  // LinearScale,
  // PointElement,
  // LineElement,
  // BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  ArcElement,
  // CategoryScale,
  // LinearScale,
  // PointElement,
  // LineElement,
  // BarElement,
  Title,
  Tooltip,
  Legend
)

// Declaring props types for DefaultDoughnutChart
interface Props {
  icon?: {
    color?: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' | 'light' | 'dark'
    component: ReactNode
  }
  title?: string
  description?: string | ReactNode
  height?: string | number
  chart: {
    labels: string[]
    datasets: {
      label: string
      backgroundColors: string[]
      data: number[]
    }
    cutout?: number
  }
  [key: string]: any
}

function DefaultDoughnutChart({ icon, title, description, height, chart }: Props): JSX.Element {
  const { data, options } = configs(chart.labels || [], chart.datasets || {}, chart.cutout)

  const renderChart = (
    <MDBox
      py={2}
      pr={2}
      pl={icon.component ? 1 : 2}
    >
      {title || description ? (
        <MDBox
          display='flex'
          px={description ? 1 : 0}
          pt={description ? 1 : 0}
        >
          {icon.component && (
            <MDBox
              width='4rem'
              height='4rem'
              bgColor={icon.color || 'info'}
              variant='gradient'
              coloredShadow={icon.color || 'info'}
              borderRadius='xl'
              display='flex'
              justifyContent='center'
              alignItems='center'
              color='white'
              mt={-5}
              mr={2}
            >
              <Icon fontSize='medium'>{icon.component}</Icon>
            </MDBox>
          )}
          <MDBox mt={icon.component ? -2 : 0}>
            {title && <MDTypography variant='h6'>{title}</MDTypography>}
            <MDBox mb={2}>
              <MDTypography
                component='div'
                variant='button'
                color='text'
              >
                {description}
              </MDTypography>
            </MDBox>
          </MDBox>
        </MDBox>
      ) : null}
      {useMemo(
        () => (
          <MDBox height={height}>
            <Doughnut data={data} />
            {/* options={options} */}
          </MDBox>
        ),
        [chart, height]
      )}
    </MDBox>
  )

  return title || description ? <Card>{renderChart}</Card> : renderChart
}

// Declaring default props DefaultDoughnutChart
DefaultDoughnutChart.defaultProps = {
  icon: { color: 'info', component: '' },
  title: '',
  description: '',
  height: '19.125rem',
}

export default DefaultDoughnutChart

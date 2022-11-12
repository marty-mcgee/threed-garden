import { useRef, useEffect, useState, useMemo, ReactNode } from 'react'

// @mui material components
import Card from '@mui/material/Card'
import Icon from '@mui/material/Icon'

// ThreeD Garden components
import MDBox from '~/components/mui/MDBox'
import MDTypography from '~/components/mui/MDTypography'

// ThreeD Garden Helper Functions
import gradientChartLine from '~/themes/theme-light/functions/gradientChartLine'

// GradientLineChart configurations
import configs from '~/components/elements/Charts/LineCharts/GradientLineChart/config'

// ThreeD Garden Base Styles
import colors from '~/themes/theme-light/base/colors'

// react-chartjs-2 components
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

// Declaring props types for GradientLineChart
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
      color: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' | 'light' | 'dark'
      data: number[]
    }[]
  }
  [key: string]: any
}

function GradientLineChart({ icon, title, description, height, chart }: Props): JSX.Element {
  const chartRef = useRef(null)
  const defaultChartData = {
    data: {
      labels: ['HEY HEY HEY'],
      datasets: [{ label: 'HEY', color: 'primary', data: [0] }],
    },
    options: {},
  }
  const [chartData, setChartData] = useState(configs(defaultChartData.data.labels, defaultChartData.data.datasets)) // configs({}, [])
  const { data, options }: any = chartData

  useEffect(() => {
    const chartDatasets = chart.datasets
      ? chart.datasets.map((dataset) => ({
          ...dataset,
          tension: 0,
          pointRadius: 0,
          borderWidth: 4,
          borderColor: colors[dataset.color] ? colors[dataset.color || 'dark'].main : colors.dark.main,
          fill: true,
          maxBarThickness: 6,
          backgroundColor: gradientChartLine(
            chartRef.current.children[0],
            colors[dataset.color] ? colors[dataset.color || 'dark'].main : colors.dark.main
          ),
        }))
      : []

    setChartData(configs(chart.labels || [], chartDatasets))
  }, [chart])

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
          <MDBox
            ref={chartRef}
            sx={{ height }}
          >
            <Line data={data} />
            {/* options={options} */}
          </MDBox>
        ),
        [chartData, height]
      )}
    </MDBox>
  )

  return title || description ? <Card>{renderChart}</Card> : renderChart
}

// Declaring default props for GradientLineChart
GradientLineChart.defaultProps = {
  icon: { color: 'info', component: '' },
  title: '',
  description: '',
  height: '19.125rem',
}

export default GradientLineChart

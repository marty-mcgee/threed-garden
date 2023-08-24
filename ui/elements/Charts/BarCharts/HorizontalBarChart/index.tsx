import { ReactNode, useMemo } from 'react'

// @mui material components
import Card from '@mui/material/Card'
import Icon from '@mui/material/Icon'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'
import MDTypography from '#/lib/mui/MDTypography'

// HorizontalBarChart configurations
import configs from '~/components/elements/Charts/BarCharts/HorizontalBarChart/config'

// ThreeD Garden Base Styles
import colors from '#/ui/themes/theme-light/base/colors'

// react-chartjs-2 components
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

// Declaring props types for HorizontalBarChart
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

function HorizontalBarChart({ icon, title, description, height, chart }: Props): JSX.Element {
  const chartDatasets = chart.datasets
    ? chart.datasets.map((dataset) => ({
        ...dataset,
        weight: 5,
        borderWidth: 0,
        borderRadius: 4,
        backgroundColor: colors[dataset.color] ? colors[dataset.color || 'dark'].main : colors.dark.main,
        fill: false,
        maxBarThickness: 35,
      }))
    : []

  const { data, options } = configs(chart.labels || [], chartDatasets)

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
            <Bar data={data} />
            {/* options={options} */}
          </MDBox>
        ),
        [chart, height]
      )}
    </MDBox>
  )

  return title || description ? <Card>{renderChart}</Card> : renderChart
}

// Declaring default props HorizontalBarChart
HorizontalBarChart.defaultProps = {
  icon: { color: 'info', component: '' },
  title: '',
  description: '',
  height: '19.125rem',
}

export default HorizontalBarChart

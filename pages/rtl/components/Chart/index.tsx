// @ts-nocheck

import { useRef, useEffect, useState, useMemo, ReactNode } from 'react'

// @mui material components
import Card from '@mui/material/Card'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'
import MDTypography from '#/lib/mui/MDTypography'

// ThreeD Garden Helper Functions
import gradientChartLine from '#/ui/themes/theme-light/functions/gradientChartLine'

// Chart configurations
import configs from '#/pages/widgets/components/Chart/config'

// ThreeD Garden Base Styles
import colors from '#/ui/themes/theme-light/base/colors'

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

// Declaring props types for Chart
interface Props {
  title: string
  count: number | ReactNode
  percentage: {
    color: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' | 'dark'
    label: string | ReactNode
  }
  chart: {
    labels: string[]
    datasets: {
      label: string
      color: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' | 'light' | 'dark'
      data: number[]
    }[]
  }
}

function Chart({ title, count, percentage, chart }: Props): JSX.Element {
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
    const chartDatasets = chart.datasets.map((dataset) => ({
      ...dataset,
      tension: 0.4,
      pointRadius: 0,
      borderWidth: 2,
      borderColor: colors[dataset.color].main,
      fill: true,
      maxBarThickness: 6,
      backgroundColor: gradientChartLine(chartRef.current.children[0], colors[dataset.color].main, 0.02),
    }))

    setChartData(configs(chart.labels, chartDatasets))
  }, [chart])

  return (
    <Card>
      <MDBox
        p={2}
        lineHeight={1}
      >
        <MDTypography
          variant='button'
          textTransform='capitalize'
          fontWeight='medium'
          color='text'
        >
          {title}
        </MDTypography>
        <MDTypography
          variant='h5'
          fontWeight='bold'
          color='dark'
        >
          {count}&nbsp;
          <MDTypography
            variant='button'
            fontWeight='bold'
            color={percentage.color}
          >
            {percentage.label}
          </MDTypography>
        </MDTypography>
      </MDBox>
      {useMemo(
        () => (
          <MDBox
            ref={chartRef}
            sx={{ height: '5.375rem' }}
          >
            <Line data={data} />
            {/* options={options} */}
          </MDBox>
        ),
        [chartData]
      )}
    </Card>
  )
}

export default Chart

// ** MUI Imports
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import { useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

// ** Custom Components Imports
import PageHeader from '#/ui/components/page-header'

// ** Styled Component
import DatePickerWrapper from '#/ui/styles/react-datepicker'

// ** Demo Components Imports
import ChartjsBarChart from '#/ui/charts/chartjs/ChartjsBarChart'
import ChartjsLineChart from '#/ui/charts/chartjs/ChartjsLineChart'
import ChartjsAreaChart from '#/ui/charts/chartjs/ChartjsAreaChart'
import ChartjsRadarChart from '#/ui/charts/chartjs/ChartjsRadarChart'
import ChartjsBubbleChart from '#/ui/charts/chartjs/ChartjsBubbleChart'
import ChartjsScatterChart from '#/ui/charts/chartjs/ChartjsScatterChart'
import ChartjsPolarAreaChart from '#/ui/charts/chartjs/ChartjsPolarAreaChart'
import ChartjsHorizontalBarChart from '#/ui/charts/chartjs/ChartjsHorizontalBarChart'

// ** Third Party Styles Imports
import 'chart.js/auto'
// import 'react-datepicker/dist/react-datepicker.css'

const ChartJS = () => {
  // ** Hook
  const theme = useTheme()

  // Vars
  const whiteColor = '#fff'
  const yellowColor = '#ffe802'
  const primaryColor = '#836af9'
  const areaChartBlue = '#2c9aff'
  const barChartYellow = '#ffcf5c'
  const polarChartGrey = '#4f5d70'
  const polarChartInfo = '#299aff'
  const lineChartYellow = '#d4e157'
  const polarChartGreen = '#28dac6'
  const lineChartPrimary = '#9e69fd'
  const lineChartWarning = '#ff9800'
  const horizontalBarInfo = '#26c6da'
  const polarChartWarning = '#ff8131'
  const scatterChartGreen = '#28c76f'
  const warningColorShade = '#ffbd1f'
  const areaChartBlueLight = '#84d0ff'
  const areaChartGreyLight = '#edf1f4'
  const scatterChartWarning = '#ff9f43'
  const labelColor = theme.palette.text.primary
  const borderColor = theme.palette.action.focus
  const gridLineColor = theme.palette.action.focus

  return (
    <DatePickerWrapper>
      <Grid container spacing={6} className='match-height'>
        <PageHeader
          title={
            <Typography variant='h5'>
              <Link href='https://github.com/reactchartjs/react-chartjs-2' target='_blank'>
                React ChartJS 2
              </Link>
            </Typography>
          }
          subtitle={<Typography variant='body2'>React wrapper for Chart.js</Typography>}
        />
        <Grid item xs={12}>
          <ChartjsLineChart
            white={whiteColor}
            labelColor={labelColor}
            success={lineChartYellow}
            borderColor={borderColor}
            primary={lineChartPrimary}
            warning={lineChartWarning}
            gridLineColor={gridLineColor}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartjsRadarChart labelColor={labelColor} gridLineColor={gridLineColor} />
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartjsPolarAreaChart
            yellow={yellowColor}
            info={polarChartInfo}
            grey={polarChartGrey}
            primary={primaryColor}
            green={polarChartGreen}
            labelColor={labelColor}
            warning={polarChartWarning}
          />
        </Grid>
        <Grid item xs={12}>
          <ChartjsBubbleChart
            yellow={yellowColor}
            primary={primaryColor}
            labelColor={labelColor}
            borderColor={borderColor}
            gridLineColor={gridLineColor}
          />
        </Grid>
        <Grid item xs={12}>
          <ChartjsScatterChart
            primary={primaryColor}
            labelColor={labelColor}
            green={scatterChartGreen}
            borderColor={borderColor}
            warning={scatterChartWarning}
            gridLineColor={gridLineColor}
          />
        </Grid>
        <Grid item xs={12}>
          <ChartjsAreaChart
            white={whiteColor}
            blue={areaChartBlue}
            labelColor={labelColor}
            borderColor={borderColor}
            blueLight={areaChartBlueLight}
            greyLight={areaChartGreyLight}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartjsBarChart
            yellow={barChartYellow}
            labelColor={labelColor}
            borderColor={borderColor}
            gridLineColor={gridLineColor}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartjsHorizontalBarChart
            labelColor={labelColor}
            info={horizontalBarInfo}
            borderColor={borderColor}
            warning={warningColorShade}
            gridLineColor={gridLineColor}
          />
        </Grid>
      </Grid>
    </DatePickerWrapper>
  )
}

export default ChartJS

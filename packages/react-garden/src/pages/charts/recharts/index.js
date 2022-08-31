// ** MUI Imports
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'

// ** Custom Components Imports
import PageHeader from '~/@core/components/page-header'

// ** Hooks
import { useSettings } from '~/@core/hooks/useSettings'

// ** Styled Components
import RechartsWrapper from '~/@core/styles/libs/recharts'
import DatePickerWrapper from '~/@core/styles/libs/react-datepicker'

// ** Demo Components Imports
import RechartsBarChart from '~/views/charts/recharts/RechartsBarChart'
import RechartsPieChart from '~/views/charts/recharts/RechartsPieChart'
import RechartsLineChart from '~/views/charts/recharts/RechartsLineChart'
import RechartsAreaChart from '~/views/charts/recharts/RechartsAreaChart'
import RechartsRadarChart from '~/views/charts/recharts/RechartsRadarChart'
import RechartsScatterChart from '~/views/charts/recharts/RechartsScatterChart'

// ** Third Party Styles Imports
import 'react-datepicker/dist/react-datepicker.css'

const Recharts = () => {
  // ** Hooks
  const { settings } = useSettings()

  return (
    <RechartsWrapper>
      <DatePickerWrapper>
        <Grid container spacing={6}>
          <PageHeader
            title={
              <Typography variant='h5'>
                <Link href='https://github.com/recharts/recharts' target='_blank'>
                  Recharts
                </Link>
              </Typography>
            }
            subtitle={<Typography variant='body2'>Redefined chart library built with React and D3</Typography>}
          />
          <Grid item xs={12}>
            <RechartsLineChart direction={settings.direction} />
          </Grid>
          <Grid item xs={12}>
            <RechartsAreaChart direction={settings.direction} />
          </Grid>
          <Grid item xs={12}>
            <RechartsScatterChart direction={settings.direction} />
          </Grid>
          <Grid item xs={12}>
            <RechartsBarChart direction={settings.direction} />
          </Grid>
          <Grid item xs={12} md={6}>
            <RechartsRadarChart />
          </Grid>
          <Grid item xs={12} md={6}>
            <RechartsPieChart />
          </Grid>
        </Grid>
      </DatePickerWrapper>
    </RechartsWrapper>
  )
}

export default Recharts

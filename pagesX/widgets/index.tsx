import { useState } from 'react'

// @mui material components
import Grid from '@mui/material/Grid'
import Icon from '@mui/material/Icon'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'
import MDTypography from '#/lib/mui/MDTypography'

// ThreeD Garden examples components
import DashboardLayout from '#/ui/elements/LayoutContainers/DashboardLayout'
import DashboardNavbar from '#/ui/elements/Navbars/DashboardNavbar'
import Footer from '#/ui/elements/Footer'
import MiniStatisticsCard from '#/ui/elements/Cards/StatisticsCards/MiniStatisticsCard'
import ProgressLineChart from '#/ui/elements/Charts/LineCharts/ProgressLineChart'
import DefaultInfoCard from '#/ui/elements/Cards/InfoCards/DefaultInfoCard'
import MasterCard from '#/ui/elements/Cards/MasterCard'
import MiniInfoCard from '#/ui/elements/Cards/InfoCards/MiniInfoCard'
import ControllerCard from '#/ui/elements/Cards/ControllerCard'
// import Calendar from "~/ui/elements/Calendar"
import CategoriesList from '#/ui/elements/Lists/CategoriesList'

// Widgets page components
import Steps from '#/pagesX/widgets/components/Steps'
import FullBody from '#/pagesX/widgets/components/FullBody'
import MediaPlayer from '#/pagesX/widgets/components/MediaPlayer'
import OrdersOverview from '#/pagesX/widgets/components/OrdersOverview'
import UpcomingEvents from '#/pagesX/widgets/components/UpcomingEvents'
import Chart from '#/pagesX/widgets/components/Chart'

// Data
import progressLineChartData from '#/lib/api/@fake-db/pages/widgets/data/progressLineChartData'
import categoriesListData from '#/lib/api/@fake-db/pages/widgets/data/categoriesListData'
import caloriesChartData from '#/lib/api/@fake-db/pages/widgets/data/caloriesChartData'

function Widgets(): JSX.Element {
  const [lights, setLights] = useState<boolean>(false)

  const handleSetLights = () => setLights(!lights)

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox mx={1}>
        <Grid
          container
          spacing={2}
        >
          {/* <Grid item xs={12} lg={5}>
            {useMemo(
              () => (
                <Calendar
                  header={{ title: "calendar", date: "August 2022" }}
                  headerToolbar={false}
                  initialView="dayGridMonth"
                  initialDate="2022-08-10"
                  events={calendarEventsData}
                  selectable
                  editable
                />
              ),
              [calendarEventsData]
            )}
          </Grid> */}
          <Grid
            item
            xs={12}
            lg={3}
          >
            <MDBox mb={3}>
              <CategoriesList
                title='categories'
                categories={categoriesListData}
              />
            </MDBox>
            <MediaPlayer />
          </Grid>
          <Grid
            item
            xs={12}
            lg={4}
          >
            <OrdersOverview />
          </Grid>
        </Grid>
        <MDBox my={2}>
          <Grid
            container
            spacing={2}
          >
            <Grid
              item
              xs={12}
              sm={6}
              lg={4}
            >
              <UpcomingEvents />
            </Grid>
            <Grid
              item
              xs={12}
              lg={8}
            >
              <ProgressLineChart
                icon='date_range'
                title='Sprints'
                count={48}
                progress={88}
                height='13.375rem'
                chart={progressLineChartData}
              />
            </Grid>
          </Grid>
        </MDBox>
        <MDBox my={2}>
          <Grid
            container
            spacing={2}
          >
            <Grid
              item
              xs={12}
              md={6}
              lg={3}
            >
              <MDBox mb={3}>
                <MiniStatisticsCard
                  title={{ text: 'battery health' }}
                  count='99 %'
                  icon={{ color: 'info', component: 'battery_charging_full' }}
                  direction='left'
                />
              </MDBox>
              <MiniStatisticsCard
                title={{ text: 'music volume' }}
                count='15/100'
                icon={{ color: 'info', component: 'volume_down' }}
                direction='left'
              />
            </Grid>
            <Grid
              item
              xs={12}
              sm={3}
              lg={5}
              display='flex'
              flexDirection={{ xs: 'column', sm: 'row' }}
            >
              <MDBox
                width='100%'
                mr={{ xs: 0, sm: 3 }}
                mb={{ xs: 3, sm: 0 }}
              >
                <DefaultInfoCard
                  icon='account_balance'
                  title='salary'
                  description='Direct Deposit'
                  value='$4000'
                />
              </MDBox>
              <MDBox width='100%'>
                <DefaultInfoCard
                  icon='paypal'
                  title='paypal'
                  description='Freelance Payment'
                  value='$455.00'
                />
              </MDBox>
            </Grid>
            <Grid
              item
              xs={12}
              lg={4}
            >
              <MasterCard
                number={4562112245947852}
                holder='Garden Master'
                expires='07/27'
              />
            </Grid>
          </Grid>
        </MDBox>
        <MDBox my={2}>
          <Grid
            container
            spacing={2}
          >
            <Grid
              item
              xs={12}
              md={6}
              lg={3}
            >
              <FullBody />
            </Grid>
            <Grid
              item
              xs={12}
              md={6}
              lg={2}
            >
              <ControllerCard
                state={lights}
                icon={
                  <Icon
                    className={lights ? 'text-white' : 'text-dark'}
                    fontSize='large'
                  >
                    lightbulb
                  </Icon>
                }
                title='Lights'
                onChange={handleSetLights}
              />
            </Grid>
            <Grid
              item
              xs={12}
              lg={3}
            >
              <Chart
                title='calories saved'
                count={970}
                percentage={{ color: 'success', label: '+5%' }}
                chart={caloriesChartData}
              />
            </Grid>
            <Grid
              item
              xs={12}
              md={6}
              lg={2}
            >
              <MiniInfoCard
                icon='shortcut'
                title={
                  <>
                    754&nbsp;
                    <MDTypography
                      variant='button'
                      color='secondary'
                      fontWeight='medium'
                    >
                      m
                    </MDTypography>
                  </>
                }
                description='New York City'
              />
            </Grid>
            <Grid
              item
              xs={12}
              md={6}
              lg={2}
            >
              <Steps />
            </Grid>
          </Grid>
        </MDBox>
      </MDBox>
      <Footer />
    </DashboardLayout>
  )
}

export default Widgets

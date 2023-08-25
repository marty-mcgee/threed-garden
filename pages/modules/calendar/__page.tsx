'use client'

// @mui material components
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'

// ThreeD Garden examples components
import DashboardLayout from '#/ui/elements/LayoutContainers/DashboardLayout'
import DashboardNavbar from '#/ui/elements/Navbars/DashboardNavbar'
import Footer from '#/ui/elements/Footer'
// import EventCalendar from "~/ui/elements/Calendar"

// Calendar application components
import Header from '#/page/modules/calendar/components/Header'
import NextEvents from '#/page/modules/calendar/components/NextEvents'
import ProductivityChart from '#/page/modules/calendar/components/ProductivityChart'

// JSX
function Calendar() {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={3}>
        <MDBox display='flex' justifyContent='flex-end' mt={1} mb={4} mx={2}>
          <Header />
        </MDBox>
        <Grid container spacing={2}>
          {/* <Grid item xs={12} xl={9} sx={{ height: "max-content" }}>
            {useMemo(
              () => (
                <EventCalendar
                  initialView="dayGridMonth"
                  initialDate="2022-08-01"
                  events={calendarEventsData}
                  selectable
                  editable
                />
              ),
              [calendarEventsData]
            )}
          </Grid> */}
          <Grid item xs={12} xl={3}>
            <MDBox mb={3}>
              <NextEvents />
            </MDBox>
            <MDBox mb={3}>
              <ProductivityChart />
            </MDBox>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  )
}

export default Calendar

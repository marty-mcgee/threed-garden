import { useMemo } from "react"

// @mui material components
import Grid from "@mui/material/Grid"

// ThreeD Garden components
import MDBox from "~/components/mui/MDBox"

// ThreeD Garden examples components
import DashboardLayout from "~/components/examples/LayoutContainers/DashboardLayout"
import DashboardNavbar from "~/components/examples/Navbars/DashboardNavbar"
import Footer from "~/components/examples/Footer"
import EventCalendar from "~/components/examples/Calendar"

// Calendar application components
import Header from "~/pages/layouts/applications/calendar/components/Header"
import NextEvents from "~/pages/layouts/applications/calendar/components/NextEvents"
import ProductivityChart from "~/pages/layouts/applications/calendar/components/ProductivityChart"

// Data
import calendarEventsData from "~/pages/layouts/applications/calendar/data/calendarEventsData"

function Calendar(): JSX.Element {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={3}>
        <MDBox display="flex" justifyContent="flex-end" mt={1} mb={4} mx={2}>
          <Header />
        </MDBox>
        <Grid container spacing={3}>
          <Grid item xs={12} xl={9} sx={{ height: "max-content" }}>
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
          </Grid>
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

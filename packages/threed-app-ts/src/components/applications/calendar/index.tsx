import { useMemo } from "react"

// @mui material components
import Grid from "@mui/material/Grid"

// ThreeD Garden components
import MDBox from "~/components/mui/MDBox"

// ThreeD Garden examples components
import DashboardLayout from "~/components/elements/LayoutContainers/DashboardLayout"
import DashboardNavbar from "~/components/elements/Navbars/DashboardNavbar"
import Footer from "~/components/elements/Footer"
// import EventCalendar from "~/components/elements/Calendar"

// Calendar application components
import Header from "~/components/applications/calendar/components/Header"
import NextEvents from "~/components/applications/calendar/components/NextEvents"
import ProductivityChart from "~/components/applications/calendar/components/ProductivityChart"

// Data
import calendarEventsData from "~/components/applications/calendar/data/calendarEventsData"

function Calendar(): JSX.Element {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={3}>
        <MDBox display="flex" justifyContent="flex-end" mt={1} mb={4} mx={2}>
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

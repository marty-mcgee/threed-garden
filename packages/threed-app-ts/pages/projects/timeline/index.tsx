// @mui material components
import Grid from '@mui/material/Grid'

// ThreeD Garden UI Dashboard PRO React components
import MDBox from '#/lib/mui/MDBox'

// ThreeD Garden UI Dashboard PRO React example components
import DashboardLayout from '#/lib/components/elements/LayoutContainers/DashboardLayout'
import DashboardNavbar from '#/lib/components/elements/Navbars/DashboardNavbar'
import Footer from '#/lib/components/elements/Footer'
import TimelineList from '#/lib/components/elements/Timeline/TimelineList'
import TimelineItem from '#/lib/components/elements/Timeline/TimelineItem'

// Data
import timelineData from 'api/@fake-db/pages/projects/timeline/data/timelineData'

function Timeline(): JSX.Element {
  const renderTimelineItems = timelineData.map(({ color, icon, title, dateTime, description, lastItem }) => (
    <TimelineItem
      key={title + color}
      color={color}
      icon={icon}
      title={title}
      dateTime={dateTime}
      description={description}
      lastItem={lastItem}
    />
  ))

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox mx={1}>
        <Grid
          container
          spacing={2}
        >
          <Grid
            item
            xs={12}
            lg={6}
          >
            <TimelineList title='Timeline with dotted line'>{renderTimelineItems}</TimelineList>
          </Grid>
          <Grid
            item
            xs={12}
            lg={6}
          >
            <TimelineList
              title='Timeline with dotted line'
              dark
            >
              {renderTimelineItems}
            </TimelineList>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  )
}

export default Timeline

// @mui material components
import Card from '@mui/material/Card'

// ThreeD Garden components
import MDBox from '~/components/mui/MDBox'
import MDTypography from '~/components/mui/MDTypography'

// ThreeD Garden examples components
import DefaultItem from '~/components/elements/Items/DefaultItem'

function UpcomingEvents(): JSX.Element {
  return (
    <Card sx={{ height: '100%' }}>
      <MDBox
        pt={2}
        px={2}
        lineHeight={1}
      >
        <MDTypography
          variant='h6'
          fontWeight='medium'
        >
          Events
        </MDTypography>
        <MDTypography
          variant='button'
          color='text'
          fontWeight='regular'
        >
          Filter: Current, Upcoming
        </MDTypography>
      </MDBox>
      <MDBox p={2}>
        <DefaultItem
          color='dark'
          icon='savings'
          title='Cyber Week'
          description='27 August 2022 @ 12:30 PM'
        />
        <MDBox mt={2.5}>
          <DefaultItem
            color='dark'
            icon='notifications_active'
            title='Meeting with Marty'
            description='24 August 2022 @ 10:00 AM'
          />
        </MDBox>
        <MDBox mt={2.5}>
          <DefaultItem
            color='dark'
            icon='task'
            title='Task Planning'
            description='24 August 2022 @ 12:30 PM'
          />
        </MDBox>
      </MDBox>
    </Card>
  )
}

export default UpcomingEvents

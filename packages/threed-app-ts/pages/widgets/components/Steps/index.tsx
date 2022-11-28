// @mui material components
import Card from '@mui/material/Card'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'
import MDTypography from '#/lib/mui/MDTypography'
import MDBadge from '#/lib/mui/MDBadge'

function Steps(): JSX.Element {
  return (
    <Card>
      <MDBox p={3}>
        <MDTypography
          variant='body2'
          color='text'
        >
          Steps
        </MDTypography>
        <MDBox
          mt={2}
          mb={1}
          lineHeight={0}
        >
          <MDTypography
            variant='h3'
            fontWeight='bold'
          >
            11.4K
          </MDTypography>
        </MDBox>
        <MDBadge
          variant='contained'
          color='success'
          badgeContent='+4.3%'
          container
        />
      </MDBox>
    </Card>
  )
}

export default Steps

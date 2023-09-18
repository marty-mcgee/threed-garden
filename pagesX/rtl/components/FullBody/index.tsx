// @mui material components
import Card from '@mui/material/Card'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'
import MDTypography from '#/lib/mui/MDTypography'
import MDBadge from '#/lib/mui/MDBadge'

function FullBody(): JSX.Element {
  return (
    <Card sx={{ height: '100%' }}>
      <MDBox
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        pt={3}
        mb={2}
        px={3}
      >
        <MDTypography
          variant='body2'
          color='text'
        >
          جسم كامل
        </MDTypography>
        <MDBadge
          variant='contained'
          color='info'
          badgeContent='معتدل'
          container
        />
      </MDBox>
      <MDBox
        pb={3}
        px={3}
      >
        <MDTypography
          variant='body2'
          color='text'
        >
          ما يهم هو الأشخاص الذين أوقدوه. والناس الذين يشبهونهم مستاءون منه.
        </MDTypography>
      </MDBox>
    </Card>
  )
}

export default FullBody

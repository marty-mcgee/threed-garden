// ** Next Imports

// ** React Imports
import { useContext } from 'react'

// ** Context Imports
import { AbilityContext } from '#/app/layouts/acl/Can'

// ** MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

// ** ThreeDGarden Imports
import ThreeDGarden from '#/lib/threed/ThreeDGarden'
// const ThreeDGarden = dynamic(() => import('#/lib/threed/ThreeDGarden'), {
//   ssr: false,
// })

const ParticipatePage = () => {
  // ** Hooks
  const ability = useContext(AbilityContext)

  return (
    <Grid
      container
      spacing={2}
    >
      {/* [MM] HEY HEY HEY */}
      <ThreeDGarden />
      {/* [MM] HEY HEY HEY */}

      <Grid
        item
        md={6}
        xs={12}
      >
        <Card>
          <CardHeader title='Public Content' />
          <CardContent>
            <Typography sx={{ mb: 4 }}>No user role 'ability' is required to view this card</Typography>
            <Typography sx={{ color: 'primary.main' }}>This card is visible to both 'user' and 'admin'</Typography>
          </CardContent>
        </Card>
      </Grid>
      {ability?.can('read', 'analytics') && (
        <Grid
          item
          md={6}
          xs={12}
        >
          <Card>
            <CardHeader title='Restricted Content' />
            <CardContent>
              <Typography sx={{ mb: 4 }}>User with "analytics: read" ability can view this card</Typography>
              <Typography sx={{ color: 'error.main' }}>This card is visible to 'admin' only</Typography>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  )
}
ParticipatePage.acl = {
  action: 'read',
  subject: 'participate-page',
}

export default ParticipatePage

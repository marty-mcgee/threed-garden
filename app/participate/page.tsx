// 'use client'
// 'use server'
// ^ this file needs NO pragma

// ==========================================================
// RESOURCES
// ==========================================================

// ** AUTH GUARD
import { auth } from 'auth'
import { SessionProvider } from 'next-auth/react'
// import { useSession } from 'next-auth/react'

// ** NEXT Imports
// import type { NextPage } from 'next'
import type { TNextPageWithProps } from '#/lib/types/TAppProps'
// ??? ProgressEvent error
// import dynamic from 'next/dynamic'

// ** MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

// ** MAIN COMPONENTS
// ** ThreeDGarden Imports
import ThreeDGarden from '#/lib/threed/ThreeDGarden'

// ** Helper Components
import Spinner from '#/ui/components/spinner'
// ** HELPFUL UTIL: COLORFUL CONSOLE MESSAGES (ccm)
import ccm from '#/lib/utils/console-colors'

const ParticipatePage: TNextPageWithProps = async () => {
// const ParticipatePage: TNextPageWithProps = () => {

  const session = await auth()
  // const { data: session, status } = useSession()
  // filter out sensitive data before passing to client.
  if (session) {
    // console.debug('%c Participate page: session', ccm.greenAlert, session)
    // if (session?.user) {
    //   session.user = {
    //     name: session.user.name,
    //     email: session.user.email,
    //     image: session.user.image,
    //   }
    // }
  }
  else {
    console.debug('%c Participate page: NO session', ccm.redAlert)
  }

  return (
    <Grid
      container
      spacing={1}
    >
      {/* [MM] HEY HEY HEY */}
      <SessionProvider session={session}>
        <ThreeDGarden />
      </SessionProvider>
      {/* [MM] HEY HEY HEY */}

      {/* {ability?.can('read', 'analytics') && ( */}
      <Grid
        item
        md={6}
        xs={12}
        // sx={{ display: 'none' }}
      >
        <Card>
          <CardHeader
            title='Public Content'
            sx={{paddingBottom: '0'}}
            // avatar={session?.user?.image}
          />
          <CardContent>
            <Typography sx={{ color: 'primary.main', paddingBottom: '8px' }}>This card is visible to both 'public' and 'authorized' users</Typography>
            { session?.user && (
            <Typography sx={{ color: 'secondary.main' }}>
              name: {session.user.name}<br/>
              email: {session.user.email ? 'hidden' : ''}<br/>
              <img src={session.user.image} width='8px' /><br/>
            </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
        <Grid
          item
          md={6}
          xs={12}
        >
          <Card>
            <CardHeader title='Restricted/User Content'
              sx={{paddingBottom: '0'}}
              // avatar={session.user.image}
            />
            <CardContent>
              <Typography sx={{ color: 'warning.main', paddingBottom: '8px' }}>This card is visible only to 'authorized' users</Typography>
              { session?.user && (
              <Typography sx={{ color: 'secondary.main' }}>
                name: {session.user.name}<br/>
                email: {session.user.email}<br/>
                <img src={session.user.image} width='8px' /><br/>
              </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
    </Grid>
    // )}
  )
}

export default ParticipatePage

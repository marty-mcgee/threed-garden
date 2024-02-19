// 'use client'
// 'use server'

// ==========================================================
// RESOURCES
// ==========================================================

// ??? ProgressEvent error
import dynamic from 'next/dynamic'

// ** AUTH GUARD
import { auth } from "auth"
import { SessionProvider } from "next-auth/react"

// ** Next Imports
// import type { NextPage } from 'next'
import type { TNextPageWithProps } from '#/lib/types/TAppProps'

// ** React Imports
// import { useContext } from 'react'
// ** Context Imports
// import { AbilityContext } from '#/lib/auth/acl/Can'

// ** MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

// ** ThreeDGarden Imports
import ThreeDGarden from '#/lib/threed/ThreeDGarden'

const ParticipatePage: TNextPageWithProps = async () => {

  const session = await auth()
  // console.debug('Participate page: session', session)
  // filter out sensitive data before passing to client.
  if (session?.user) {
    session.user = {
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      // project_id: 1,
    }
  }

  // ** Hooks
  // const ability = useContext(AbilityContext)

  return (
    <Grid
      container
      spacing={2}
    >

      {/* [MM] HEY HEY HEY */}
      {/* <SessionProvider session={session}> */}
        <ThreeDGarden />
        {/* <ThreeDGarden session={session} /> */}
      {/* </SessionProvider> */}
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
            <Typography sx={{ color: 'primary.main' }}>
              {/* <SessionData session={session} /> */}
              {session?.user?.name}<br/>
              {session?.user?.email}<br/>
              {session?.user?.image}<br/>
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      {/* {ability?.can('read', 'analytics') && ( */}
        <Grid
          item
          md={6}
          xs={12}
        >
          <Card>
            <CardHeader title='Restricted/User Content' />
            <CardContent>
              <Typography sx={{ mb: 4 }}>User with "analytics: read" ability can view this card</Typography>
              <Typography sx={{ color: 'warning.main' }}>This card is visible to 'admin' only</Typography>
              <Typography sx={{ color: 'warning.main' }}>
                {/* <SessionData session={session} /> */}
                {session?.user?.name}<br/>
                {session?.user?.email}<br/>
                {session?.user?.image}<br/>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      {/* )} */}
    </Grid>
  )
}
ParticipatePage.acl = {
  action: 'read',
  subject: 'participate-page',
}

// export default ParticipatePage
const ParticipatePageUseClient = dynamic(() => Promise.resolve(ParticipatePage), {
  ssr: false
})
export default ParticipatePageUseClient

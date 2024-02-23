// 'use client'
// 'use server'
// ^ this file needs NO pragma

// ==========================================================
// RESOURCES
// ==========================================================

// ??? ProgressEvent error
import dynamic from 'next/dynamic'

// ** AUTH GUARD
import { auth } from "auth"
// import { SessionProvider } from "next-auth/react"
// import { useSession } from 'next-auth/react'

// ** Next Imports
// import type { NextPage } from 'next'
import type { TNextPageWithProps } from '#/lib/types/TAppProps'

// ** React Imports
// import { useContext } from 'react'
import { Suspense } from 'react'
// ** Helper Components
import Spinner from '#/ui/components/spinner'

// ** MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

// ** ThreeDGarden Imports
import ThreeDGarden from '#/lib/threed/ThreeDGarden'

// ** HELPFUL UTIL: COLORFUL CONSOLE MESSAGES (ccm)
import ccm from '#/lib/utils/console-colors'

const ParticipatePage: TNextPageWithProps = async () => {
// const ParticipatePage: TNextPageWithProps = () => {

  const session = await auth()
  // const { data: session, status } = useSession()
  // filter out sensitive data before passing to client.
  if (session) {
    // console.debug('Participate page: session', session, status)
    // if (session?.user) {
    //   session.user = {
    //     name: session.user.name,
    //     email: session.user.email,
    //     image: session.user.image,
    //   }
    // }
  }

  // const { data, loading, error } = useQuery(queries.GetProjects)
  // if (data) {
  //   console.debug('%cQUERY: GetProjects', ccm.orange, data, loading, error)
  // }

  return (
    <Grid
      container
      spacing={1}
    >

      {/* [MM] HEY HEY HEY */}
      {/* <SessionProvider session={session}> */}
      {/* <ApolloProvider client={client}> */}
      {/* <Suspense fallback={null}> */}
      {/* <Suspense fallback={<Spinner />}> */}
        <ThreeDGarden />
        {/* <ThreeDGarden threedData={data} /> */}
        {/* <ThreeDGarden session={session} stores={stores} /> */}
      {/* </Suspense> */}
      {/* </ApolloProvider> */}
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
            <Typography sx={{ color: 'info.main' }}>This card is visible to both 'public users' and 'authorized users'</Typography>
            <Typography sx={{ color: 'info.main' }}>
              {/* <SessionData session={session} /> */}
              {session?.user?.name}<br/>
              {session?.user?.email}<br/>
              {session?.user?.image}<br/>
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      {/* {ability?.can('read', 'analytics') && ( */}
      { session?.user && (
        <Grid
          item
          md={6}
          xs={12}
        >
          <Card>
            <CardHeader title='Restricted/User Content' />
            <CardContent>
              <Typography sx={{ mb: 4 }}>User with "analytics: read" ability can view this card</Typography>
              <Typography sx={{ color: 'primary.main' }}>This card is visible to 'authorized users' only</Typography>
              <Typography sx={{ color: 'primary.main' }}>
                {/* <SessionData session={session} /> */}
                {session?.user?.name}<br/>
                {session?.user?.email}<br/>
                {session?.user?.image}<br/>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      )}
      {/* )} */}
    </Grid>
  )
}
ParticipatePage.acl = {
  action: 'read',
  subject: 'participate-page',
}

// export async function getStaticProps() {
//   // const client = createApolloClient();
//   // const { data, loading, error } = useSuspenseQuery(queries.GetProjects)
//   const { data, loading, error } = useQuery(queries.GetProjects)
//   if (data) {
//     console.debug('%cQUERY: GetProjects', ccm.orange, data, loading, error)
//   }

//   return {
//     props: {
//       projects: data
//     },
//   };
// }

// export default ParticipatePage
const ParticipatePageUseClient = dynamic(() => Promise.resolve(ParticipatePage), {
  ssr: false
})
export default ParticipatePageUseClient

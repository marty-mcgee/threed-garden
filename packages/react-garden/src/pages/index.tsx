// ** React Imports
import { useEffect } from 'react'

// ** Next Imports
import type { NextPage } from 'next'
import { useRouter } from 'next/router'

// ** MUI Components
import Typography from '@mui/material/Typography'

// ** Spinner Import
import Spinner from 'src/@core/components/spinner'

// ** Hook Imports
import { useAuth } from 'src/hooks/useAuth'

/**
 *  Set Home URL based on User Roles
 */
export const getHomeRoute = (role: any) => {
  if (role === 'client') return '/acl'
  else return '/participate'
}

const Home: NextPage = () => {
  // ** Hooks
  const auth = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (auth.user && auth.user.role) {
      const homeRoute = getHomeRoute(auth.user.role)

      // Redirect user to Home URL
      router.replace(homeRoute)
    }
    else {
      console.debug("user NOT AUTHORIZED")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Spinner />

      <Typography component="h1" variant="h5" gutterBottom>
        ThreeD Garden for FarmBot + ThreeJS
      </Typography>
      <Typography component="h2" variant="h6" gutterBottom>
        MUI v5 + Next.js with TypeScript
      </Typography>
    </>
  )
}

export default Home

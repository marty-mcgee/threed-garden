import { useEffect, ReactNode } from 'react'

// nextjs components
// import { useLocation } from "react-router-dom"
import { useRouter, usePathname } from 'next/navigation'

import DashboardNavbar from '~/ui/layouts/Navbars/DashboardNavbar'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'

// ThreeD Garden Material UI context as Controller
import { useMaterialUIController, setLayout } from '#/lib/contexts'

function DashboardLayout({ children, stickyNavbar }: { children: ReactNode; stickyNavbar?: boolean }): JSX.Element {
  const [controller, dispatch] = useMaterialUIController()
  const { miniSidenav } = controller
  // const { pathname } = useLocation()
  // const { pathname } = useRouter()
  const router = useRouter()
  const pathname = usePathname()
  const route = pathname.split('/').slice(1)

  useEffect(() => {
    setLayout(dispatch, 'dashboard')
  // }, [pathname])
  }, [router])

  return (
    <MDBox
      sx={({ breakpoints, transitions, functions: { pxToRem } }) => ({
        // p: 10,
        mr: 1,
        my: 0,
        position: 'relative',

        [breakpoints.up('xl')]: {
          marginLeft: miniSidenav ? pxToRem(80) : pxToRem(240),
          transition: transitions.create(['margin-left', 'margin-right'], {
            easing: transitions.easing.easeInOut,
            duration: transitions.duration.standard,
          }),
        },
        [breakpoints.down('xl')]: {
          marginLeft: miniSidenav ? pxToRem(80) : pxToRem(240),
          transition: transitions.create(['margin-left', 'margin-right'], {
            easing: transitions.easing.easeInOut,
            duration: transitions.duration.standard,
          }),
        },
      })}
    >
      <DashboardNavbar></DashboardNavbar>
      {children}
    </MDBox>
  )
}

export default DashboardLayout
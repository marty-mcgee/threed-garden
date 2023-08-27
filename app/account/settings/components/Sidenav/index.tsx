// ==============================================================
// TITLE: Sidenav

'use client'

// ==============================================================
// RESOURCES (to import)

// ** Next
import type { NextPage } from 'next'

// @mui material components
// import type { Theme } from '@mui/styles'
import { styled, useTheme } from '@mui/material/styles'
// @mui material components
import Card from '@mui/material/Card'
import Icon from '@mui/material/Icon'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'
import MDTypography from '#/lib/mui/MDTypography'

// ThreeD Garden context
import { useMaterialUIController } from '#/lib/contexts'

// function Sidenav(): JSX.Element {
const Sidenav: NextPage = (): JSX.Element => {

  const [controller] = useMaterialUIController()
  const { darkMode } = controller

  const sidenavItems = [
    { icon: 'person', label: 'profile', href: 'profile' },
    { icon: 'receipt_long', label: 'basic info', href: 'basic-info' },
    { icon: 'lock', label: 'change password', href: 'change-password' },
    { icon: 'security', label: '2FA', href: '2fa' },
    { icon: 'badge', label: 'accounts', href: 'accounts' },
    { icon: 'campaign', label: 'notifications', href: 'notifications' },
    { icon: 'settings_applications', label: 'sessions', href: 'sessions' },
    { icon: 'delete', label: 'delete account', href: 'delete-account' },
  ]

  const renderSidenavItems = sidenavItems.map(({ icon, label, href }, key) => {
    const itemKey = `item-${key}`

    return (
      <MDBox
        key={itemKey}
        component='li'
        pt={key === 0 ? 0 : 1}
      >
        <MDTypography
          component='a'
          href={`#${href}`}
          variant='button'
          fontWeight='regular'
          textTransform='capitalize'
          // sx={({ borders: { theme.borders.borderRadius }, functions: { theme.functions.pxToRem }, palette: { theme.palette.light }, transitions: { theme.transitions } }) => ({
          //   display: 'flex',
          //   alignItems: 'center',
          //   borderRadius: borderRadius.md,
          //   padding: `${pxToRem(10)} ${pxToRem(16)}`,
          //   transition: transitions.create('background-color', {
          //     easing: transitions.easing.easeInOut,
          //     duration: transitions.duration.shorter,
          //   }),

          //   '&:hover': {
          //     backgroundColor: light.main,
          //   },
          // })}
        >
          <MDBox
            mr={1.5}
            lineHeight={1}
            color={darkMode ? 'white' : 'dark'}
          >
            <Icon fontSize='small'>{icon}</Icon>
          </MDBox>
          {label}
        </MDTypography>
      </MDBox>
    )
  })

  return (
    <Card
    // borderRadius: 1,
    // sx={ ({ borders: { borderRadius } }: Theme ) => ({ borderRadius: borderRadius.md }) }
    >
      <MDBox
        component='ul'
        display='flex'
        flexDirection='column'
        p={2}
        m={0}
        sx={{ listStyle: 'none' }}
      >
        {renderSidenavItems}
      </MDBox>
    </Card>
  )
}

export default Sidenav

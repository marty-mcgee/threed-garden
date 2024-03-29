// ** Next Import
import { useRouter } from 'next/navigation'
// import Link from 'next/link' // useRouter instead
import Image from 'next/image'

// ** MUI Imports
import { styled, useTheme } from '@mui/material/styles'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

// ** Icons
import Close from 'mdi-material-ui/Close'
import CircleOutline from 'mdi-material-ui/Menu'
import RecordCircleOutline from 'mdi-material-ui/MenuOpen'

// ** Configs
import appConfig from '#/lib/config/appConfig'

// ** Assets: Images
import appLogo from '#/lib/assets/images/logos/logo-threedgarden-alt.png'

// ** Styled Components
const MenuHeaderWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingRight: theme.spacing(1),
  transition: 'padding .25s ease-in-out',
  minHeight: theme.mixins.toolbar.minHeight,
}))

const HeaderTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  lineHeight: 'normal',
  textTransform: 'uppercase',
  color: theme.palette.text.primary,
  transition: 'opacity .25s ease-in-out, margin .25s ease-in-out',
}))

const StyledLink = styled('a')({
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
})

const AppBarHeader = (props) => {

  // useRouter for Internal Links
  const router = useRouter()

  // ** Props
  const {
    hidden,
    navHover,
    settings,
    saveSettings,
    collapsedNavWidth,
    toggleNavVisibility,
    navBorderWidth,
    menuLockedIcon: userMenuLockedIcon,
    menuUnlockedIcon: userMenuUnlockedIcon,
    verticalNavMenuBranding: userVerticalNavMenuBranding,
  } = props

  // ** Hooks & Vars
  // const theme = useTheme()
  const { navCollapsed } = settings
  const menuCollapsedStyles = navCollapsed && !navHover ? { opacity: 0.5 } : { opacity: 1.0 }

  const menuHeaderPaddingLeft = () => {
    if (navCollapsed && !navHover) {
      if (userVerticalNavMenuBranding) {
        return 0
      } else {
        return (collapsedNavWidth - navBorderWidth - 30) / 14
      }
    } else {
      return (collapsedNavWidth - navBorderWidth - 30) / 14
      // return 6
    }
    // return 0
  }

  const MenuLockedIcon = () =>
    userMenuLockedIcon || (
      <RecordCircleOutline
        sx={{
          // mr: '0.95rem',
          color: 'green',
          fontSize: '1.25rem',
          pointerEvents: 'none',
          ...menuCollapsedStyles,
          transition: 'opacity .25s ease-in-out',
        }}
      />
    )

  const MenuUnlockedIcon = () =>
    userMenuUnlockedIcon || (
      <RecordCircleOutline
        sx={{
          // mr: '1rem',
          color: 'darkgrey',
          fontSize: '1.25rem',
          pointerEvents: 'none',
          ...menuCollapsedStyles,
          transition: 'opacity .25s ease-in-out',
        }}
      />
    )

  return (
    <MenuHeaderWrapper
      className='nav-header'
      // sx={{
      //   pl: menuHeaderPaddingLeft()
      // }}
    >
      {userVerticalNavMenuBranding ? (
        userVerticalNavMenuBranding(props)
      ) : (
        <>
          {/* <StyledLink href='/'> */}
            <Image
              src={appLogo}
              width={48}
              height={48}
              alt={appConfig.title}
              // onClick={() => router.push('/home')}
              // onClick={() => router.push('/dashboard')}
              onClick={() => router.push('/')}
            />
          {/* </StyledLink> */}
          <IconButton
            disableRipple
            disableFocusRipple
            onClick={() => saveSettings({ ...settings, navCollapsed: !navCollapsed })}>
            <HeaderTitle
              variant='h6'
              sx={{
                ...menuCollapsedStyles,
                ...(navCollapsed && !navHover ? { ml: 0.5 } : { ml: 0.5 }),
              }}
            >
              {appConfig.title}
            </HeaderTitle>
          </IconButton>
        </>
      )}

      {/* {hidden ? (
        <IconButton
          disableRipple
          disableFocusRipple
          onClick={toggleNavVisibility}
          sx={{ backgroundColor: 'transparent !important' }}>
          {navCollapsed ? MenuUnlockedIcon() : MenuLockedIcon()}
        </IconButton>
      ) : ( */}
        <IconButton
          disableRipple
          disableFocusRipple
          onClick={() => saveSettings({ ...settings, navCollapsed: !navCollapsed })}
          sx={{ backgroundColor: 'transparent !important', color: 'text.primary' }}>
          {navCollapsed ? MenuUnlockedIcon() : MenuLockedIcon()}
        </IconButton>
      {/* )} */}
    </MenuHeaderWrapper>
  )
}

export default AppBarHeader

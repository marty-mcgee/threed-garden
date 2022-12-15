// ** Next Import
import Link from 'next/link'
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
import themeConfig from '#/lib/config/themeConfig'

// images
import brandDark from '#/lib/assets/images/logos/logo-threedgarden-alt.png'

// ** Styled Components
const MenuHeaderWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingRight: theme.spacing(0.0),
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

const VerticalNavHeader = (props) => {
  // ** Props
  const {
    hidden,
    navHover,
    settings,
    saveSettings,
    collapsedNavWidth,
    toggleNavVisibility,
    navigationBorderWidth,
    menuLockedIcon: userMenuLockedIcon,
    menuUnlockedIcon: userMenuUnlockedIcon,
    verticalNavMenuBranding: userVerticalNavMenuBranding,
  } = props

  // ** Hooks & Vars
  const theme = useTheme()
  const { navCollapsed } = settings
  const menuCollapsedStyles = navCollapsed && !navHover ? { opacity: 0 } : { opacity: 1 }

  const menuHeaderPaddingLeft = () => {
    if (navCollapsed && !navHover) {
      if (userVerticalNavMenuBranding) {
        return 0
      } else {
        return (collapsedNavWidth - navigationBorderWidth - 30) / 14
      }
    } else {
      return (collapsedNavWidth - navigationBorderWidth - 30) / 14
      // return 6
    }
    // return 0
  }

  const MenuLockedIcon = () =>
    userMenuLockedIcon || (
      <RecordCircleOutline
        sx={{
          // mr: '0.95rem',
          fontSize: '1.25rem',
          pointerEvents: 'none',
          ...menuCollapsedStyles,
          transition: 'opacity .25s ease-in-out',
        }}
      />
    )

  const MenuUnlockedIcon = () =>
    userMenuUnlockedIcon || (
      <CircleOutline
        sx={{
          // mr: '1rem',
          fontSize: '1.25rem',
          pointerEvents: 'none',
          ...menuCollapsedStyles,
          transition: 'opacity .25s ease-in-out',
        }}
      />
    )

  return (
    <MenuHeaderWrapper className='nav-header' sx={{ pl: menuHeaderPaddingLeft() }}>
      {userVerticalNavMenuBranding ? (
        userVerticalNavMenuBranding(props)
      ) : (
        <>
          <StyledLink href='/' passHref>
            <Image src={brandDark.src} alt={themeConfig.templateName} width={48} height={48} />
          </StyledLink>
          <IconButton
            disableRipple
            disableFocusRipple
            onClick={() => saveSettings({ ...settings, navCollapsed: !navCollapsed })}>
            <HeaderTitle
              variant='h6'
              sx={{
                // ...menuCollapsedStyles,
                ...(navCollapsed && !navHover ? { ml: 1 } : { ml: 1 }),
              }}>
              {themeConfig.templateName}
            </HeaderTitle>
          </IconButton>
        </>
      )}

      {hidden ? (
        <IconButton
          disableRipple
          disableFocusRipple
          onClick={toggleNavVisibility}
          sx={{ backgroundColor: 'transparent !important' }}>
          {/* <Close fontSize='small' /> */}
          {navCollapsed ? MenuUnlockedIcon() : MenuLockedIcon()}
        </IconButton>
      ) : (
        <IconButton
          disableRipple
          disableFocusRipple
          onClick={() => saveSettings({ ...settings, navCollapsed: !navCollapsed })}
          sx={{ backgroundColor: 'transparent !important', color: 'text.primary' }}>
          {navCollapsed ? MenuUnlockedIcon() : MenuLockedIcon()}
        </IconButton>
      )}
    </MenuHeaderWrapper>
  )
}

export default VerticalNavHeader

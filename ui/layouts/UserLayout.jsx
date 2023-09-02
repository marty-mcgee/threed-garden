// ==============================================================
// RESOURCES

import useMediaQuery from '@mui/material/useMediaQuery'

// ** Main Layout
// !Do not remove this Layout import
import MainLayout from '#/ui/layouts/MainLayout'

// ** Navigation
import VerticalNavItems from '#/ui/routes/navigation/vertical'
import HorizontalNavItems from '#/ui/routes/navigation/horizontal'
// Uncomment the below line (according to the layout type) when using server-side menu
// import ServerSideVerticalNavItems from './vertical/ServerSideNavItems'
// import ServerSideHorizontalNavItems from './horizontal/ServerSideNavItems'

// ** Components
import VerticalAppBarContent from './vertical/AppBarContent'
import HorizontalAppBarContent from './horizontal/AppBarContent'

// ** Hooks
import { useSettings } from '#/ui/hooks/useSettings'

// ** Utilities
import ccm from '#/lib/utils/console-colors'

// FC
const UserLayout = ({ children }) => {
  //
  // [MM] HEY HEY HEY UserLayout USER LAYOUT
  // console.debug('%c====================================', ccm.black)
  console.debug('🦁 <UserLayout>')
  // console.debug('🦁 const heyheyhey = ', { heyheyhey: 'HEY HEY HEY' })
  // console.debug('%c====================================', ccm.black)

  // ** Hooks
  const { settings, saveSettings } = useSettings()

  /**
   *  The below variable will hide the current layout menu at given screen size.
   *  The menu will be accessible from the Hamburger icon only (Vertical Overlay Menu).
   *  You can change the screen size from which you want to hide the current layout menu.
   *  Please refer useMediaQuery() hook: https://mui.com/material-ui/react-use-media-query/,
   *  to know more about what values can be passed to this hook.
   *  ! Do not change this value unless you know what you are doing. It can break the template.
   */
  const hidden = useMediaQuery((theme) => theme.breakpoints.down('lg'))

  return (
    <MainLayout
      hidden={hidden}
      settings={settings}
      saveSettings={saveSettings}
      {...(settings.layout === 'horizontal'
        ? {
            // HORIZONTAL --------

            // ** Navigation Items
            horizontalNavItems: HorizontalNavItems(),
            // Uncomment the below line when using server-side menu in horizontal layout and comment the above line
            // horizontalNavItems: ServerSideHorizontalNavItems(),

            // ** AppBar Content
            horizontalAppBarContent: () => (
              <HorizontalAppBarContent
                hidden={hidden}
                settings={settings}
                saveSettings={saveSettings}
              />
            ),
          }
        : {
            // VERTICAL ||||||||||

            // ** Navigation Items
            verticalNavItems: VerticalNavItems(),
            // Uncomment the below line when using server-side menu in vertical layout and comment the above line
            // verticalNavItems: ServerSideVerticalNavItems(),

            // ** AppBar Content
            verticalAppBarContent: (props) => (
              <VerticalAppBarContent
                hidden={hidden}
                settings={settings}
                saveSettings={saveSettings}
                toggleNavVisibility={props.toggleNavVisibility}
              />
            ),
          })}
    >
      {children}
    </MainLayout>
  )
}

export default UserLayout

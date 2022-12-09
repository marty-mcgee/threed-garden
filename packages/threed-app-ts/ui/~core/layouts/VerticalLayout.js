// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Fab from '@mui/material/Fab'
import { styled } from '@mui/material/styles'
import Box from '@mui/material/Box'

// ** Icons Imports
import ArrowUp from 'mdi-material-ui/ArrowUp'

// ** Theme Config Import
import themeConfig from '#/config/themeConfig'

// ** Components
import AppBar from './vertical/appBar'
import Customizer from '~/ui/~core/components/customizer'
import Navigation from './vertical/navigation'
import Footer from './shared-components/footer'
import ScrollToTop from '~/ui/~core/components/scroll-to-top'

// ** Styled Component
import DatePickerWrapper from '~/ui/~core/styles/libs/react-datepicker'

const VerticalLayoutWrapper = styled('div')({
  height: '100%',
  display: 'flex',
  // border: '1px solid pink',
  overflow: 'scroll',
})

const MainContentWrapper = styled(Box)({
  display: 'flex',
  flexGrow: 1,
  minWidth: 0,
  minHeight: 'calc(100vh - 64px - 0px)', // '100vh',
  maxHeight: '100vh', // 'calc(100vh - 64px)',
  flexDirection: 'column',
})

const ContentWrapper = styled('main')(({ theme }) => ({
  flexGrow: 1,
  width: '100%',
  padding: theme.spacing(2), // number * 0.25rem (6 = 1.5rem = 24px, 4 = 1.0rem = 16px, ...)
  transition: 'padding .25s ease-in-out',
  [theme.breakpoints.down('sm')]: {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1), // number * 0.25rem (6 = 1.5rem = 24px, 1 = 0.25rem = 4px, ...)
  },
}))

const VerticalLayout = (props) => {
  // ** Props
  const { hidden, settings, children, scrollToTop } = props

  // ** Vars
  const { skin, navHidden, contentWidth } = settings
  const { navigationSize, disableCustomizer, collapsedNavigationSize } = themeConfig
  const navWidth = navigationSize
  const navigationBorderWidth = skin === 'bordered' ? 1 : 0
  const collapsedNavWidth = collapsedNavigationSize

  // ** States
  const [navHover, setNavHover] = useState(false)
  const [navVisible, setNavVisible] = useState(false)

  // ** Toggle Functions
  const toggleNavVisibility = () => setNavVisible(!navVisible)

  return (
    <div style={{ border: '0px solid green' }}>
      <div style={{ border: '0px solid pink' }}>
        <AppBar toggleNavVisibility={toggleNavVisibility} {...props} />
      </div>
      <VerticalLayoutWrapper className='layout-wrapper' style={{ border: '0px solid orange' }}>
        {/* LEFT NAVIGATION PANEL DRAWER */}
        {navHidden &&
        themeConfig.layout === 'vertical' &&
        !(navHidden && settings.lastLayout === 'horizontal') ? null : (
          <Navigation
            navWidth={navWidth}
            navHover={navHover}
            navVisible={navVisible}
            setNavHover={setNavHover}
            setNavVisible={setNavVisible}
            collapsedNavWidth={collapsedNavWidth}
            toggleNavVisibility={toggleNavVisibility}
            navigationBorderWidth={navigationBorderWidth}
            {...props}
          />
        )}

        {/* MAIN CONTENT */}
        <MainContentWrapper className='layout-content-wrapper' style={{ border: '0px solid blue' }}>
          <ContentWrapper
            className='layout-page-content'
            sx={{
              border: '0px dashed red',
              ...(contentWidth === 'boxed' && {
                mx: 'auto',
                '@media (min-width:1440px)': { maxWidth: 1440 },
                '@media (min-width:1200px)': { maxWidth: '100%' },
              }),
            }}>
            {children}
          </ContentWrapper>

          {/* FOOTER CONTENT */}
          <Footer {...props} />
        </MainContentWrapper>

        {/* SHOW/HIDE MODALS */}
        <DatePickerWrapper sx={{ zIndex: 11 }}>
          <Box id='react-datepicker-portal'></Box>
        </DatePickerWrapper>
      </VerticalLayoutWrapper>

      {disableCustomizer || hidden ? null : <Customizer />}

      {scrollToTop ? (
        scrollToTop(props)
      ) : (
        <ScrollToTop className='mui-fixed'>
          <Fab color='primary' size='small' aria-label='scroll back to top'>
            <ArrowUp />
          </Fab>
        </ScrollToTop>
      )}
    </div>
  )
}

export default VerticalLayout

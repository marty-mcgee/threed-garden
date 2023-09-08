// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Fab from '@mui/material/Fab'
import { styled } from '@mui/material/styles'
import Box from '@mui/material/Box'

// ** Icons Imports
import ArrowUp from 'mdi-material-ui/ArrowUp'

// ** Theme Config Import
import themeConfig from '#/lib/config/themeConfig'

// ** Components
import AppBar from './vertical/AppBar'
import Customizer from '#/ui/customizer'
import Navigation from './vertical/VerticalNav'
import Footer from './footer/Footer'
import ScrollToTop from '#/ui/components/scroll-to-top'

// ** Styled Component
import DatePickerWrapper from '#/ui/styles/react-datepicker'

const VerticalLayoutWrapper = styled('div')({
  height: '100%',
  // display: 'flex',
  // flexGrow: 1,
  border: '3px solid pink', // is working here
  overflow: 'scroll',
})

const MainContentWrapper = styled(Box)({
  border: '3px dashed blue', // is working here
  // display: 'flex',
  // flexGrow: 1,
  minWidth: 0,
  minHeight: 'calc(100vh - 64px - 0px)', // '100vh',
  // maxHeight: 'calc(100vh - 64px - 0px)', // '100vh',
  flexDirection: 'column',
})

const ContentWrapper = styled('main')(({ theme }) => ({
  border: '3px dashed green', // not working here
  // flexGrow: 1,
  // width: '100%',
  minHeight: 'calc(100vh - 64px - 0px)', // '100vh',
  // maxHeight: 'calc(100vh - 64px - 0px)', // '100vh',
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
  const navigationBorderWidth = skin === 'bordered' ? 1 : 7
  const collapsedNavWidth = collapsedNavigationSize

  // ** States
  const [navHover, setNavHover] = useState(false)
  const [navVisible, setNavVisible] = useState(false)

  // ** Toggle Functions
  const toggleNavVisibility = () => setNavVisible(!navVisible)

  return (
    <>
      <AppBar
        toggleNavVisibility={toggleNavVisibility}
        sx={{
          border: '3px dashed lightblue', // not working here
          // ...(contentWidth === 'boxed' && {
          //   mx: 'auto',
          //   '@media (min-width:1440px)': { maxWidth: 1440 },
          //   '@media (min-width:1200px)': { maxWidth: '100%' },
          // }),
        }}
        {...props}
      />

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
          sx={{
            border: '1px dashed orange', // not working here
            // ...(contentWidth === 'boxed' && {
            //   mx: 'auto',
            //   '@media (min-width:1440px)': { maxWidth: 1440 },
            //   '@media (min-width:1200px)': { maxWidth: '100%' },
            // }),
          }}
          {...props}
        />
      )}

      {/* MAIN CONTENT WRAPPER */}
      <VerticalLayoutWrapper className='layout-wrapper'>

        {/* MAIN CONTENT */}
        <MainContentWrapper className='layout-content-wrapper'>
          <ContentWrapper
            className='layout-page-content'
            sx={{
              display: 'flex',
              flexShrink: '0',
              padding: '0px',
              border: '2px dashed red', // is working here
              ...(contentWidth === 'boxed' && {
                mx: 'auto',
                '@media (min-width:1440px)': { maxWidth: 1440 },
                '@media (min-width:1200px)': { maxWidth: '100%' },
              }),
            }}
          >
            {children}
          </ContentWrapper>

          {/* FOOTER CONTENT */}
          <Footer
            sx={{
              border: '1px dashed yellow', // not working here
            }}
            {...props}
          />
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
          <Fab
            color='primary'
            size='small'
            aria-label='scroll back to top'
          >
            <ArrowUp />
          </Fab>
        </ScrollToTop>
      )}
    </>
  )
}

export default VerticalLayout

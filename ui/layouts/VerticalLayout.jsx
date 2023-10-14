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
  display: 'flex', // [MM] THIS IS IMPORTANT !!! flex :)
  flexDirection: 'row', // [MM] THIS IS IMPORTANT !!! flex :)
  // overflow: 'scroll',
  // minHeight: 'calc(100vh - 128px - 0px)', // '100vh',
  // border: '3px solid pink', // is working here
})

const MainContentWrapper = styled(Box)({
  border: '3px dashed #222222', // is working here
  // display: 'flex',
  // flexGrow: 1,
  // minWidth: 0,
  // minHeight: 'calc(100vh - 128px - 0px)', // '100vh',
  // maxHeight: 'calc(100vh - 128px - 0px)', // '100vh',
  // flexDirection: 'row|column',
})

const ContentWrapper = styled('main')(({ theme }) => ({
  // border: '3px dashed green', // not working here
  // flexGrow: 1,
  // width: '100%',
  minHeight: 'calc(100vh - 128px - 0px)', // '100vh',
  // maxHeight: 'calc(100vh - 128px - 0px)', // '100vh',

  // padding: theme.spacing(4), // number * 0.25rem (6 = 1.5rem = 24px, 4 = 1.0rem = 16px, ...)
  // transition: 'padding .25s ease-in-out',
  // [theme.breakpoints.down('sm')]: {
  //   paddingLeft: theme.spacing(1),
  //   paddingRight: theme.spacing(1), // number * 0.25rem (6 = 1.5rem = 24px, 1 = 0.25rem = 4px, ...)
  // },

}))

const VerticalLayout = (props) => {
  // ** Props
  const { hidden, settings, children, scrollToTop } = props

  // ** Vars
  const { skin, navHidden, contentWidth } = settings
  const { navigationSize, disableCustomizer, collapsedNavigationSize } = themeConfig
  const navWidth = navigationSize
  const navBorderWidth = skin === 'bordered' ? 1 : 0
  const collapsedNavWidth = collapsedNavigationSize

  // const totalNavWidthExpanded = navWidth + navBorderWidth
  // const totalNavWidthCollapsed = collapsedNavWidth + navBorderWidth
  // console.debug('totalNavWidthExpanded, totalNavWidthCollapsed', totalNavWidthExpanded, totalNavWidthCollapsed)
  // console.debug('contentWidth', contentWidth)

  // ** States
  const [navHover, setNavHover] = useState(false)
  const [navVisible, setNavVisible] = useState(false)

  // ** Toggle Functions
  const toggleNavVisibility = () => setNavVisible(!navVisible)

  return (
    <>
      <AppBar
        toggleNavVisibility={toggleNavVisibility}
        {...props}
      />

      {/* NAVIGATION + MAIN CONTENT WRAPPER */}
      <VerticalLayoutWrapper className='layout-wrapper'>

        {/* LEFT NAVIGATION PANEL DRAWER */}
        {navHidden &&
          themeConfig.layout === 'vertical' &&
          !(navHidden && settings.lastLayout === 'horizontal')
        ? null
        : (
          <Navigation
            navWidth={navWidth}
            navHover={navHover}
            navVisible={navVisible}
            setNavHover={setNavHover}
            setNavVisible={setNavVisible}
            collapsedNavWidth={collapsedNavWidth}
            toggleNavVisibility={toggleNavVisibility}
            navBorderWidth={navBorderWidth}
            {...props}
          />
        )}

        {/* MAIN CONTENT */}
        <MainContentWrapper
          className='layout-content-wrapper'
          sx={{
            width: '100vw',
          }}
        >
          <ContentWrapper
            className='layout-page-content'
            sx={{
              // border: '2px dashed orange', // is working here
              padding: 0,
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

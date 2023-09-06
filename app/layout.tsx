// ==============================================================
// RESOURCES
// ** FOR ENTIRE APP CONTEXTS

'use client'

// ** Next
// import { useRouter, usePathname } from 'next/navigation'

// ** React
import type { ReactNode } from 'react'
// import { useEffect } from 'react'

// ** Apollo Client -- State Management using Cache/Store (via GraphQL)
import { ApolloProvider } from '@apollo/client'
import { client } from '#/lib/api/graphql/client'

// ** Redux Store
import { Provider as ReduxProvider } from 'react-redux'
import { store as reduxStore } from '#/lib/stores/redux'

// ** Contexts for User Authorization + Settings
import { AuthProvider } from '#/lib/contexts/AuthContext'

// ** User Authorization Hook
import { useAuth } from '#/lib/auth/hooks/useAuth'

// ** User Authorization Guards/Boundaries (~CORE Components)
import AuthGuard from '#/ui/auth/AuthGuard'
// import GuestGuard from '#/ui/auth/GuestGuard'
// import AclGuard from '#/ui/auth/AclGuard'

// ** @Fake-DB (axios mock adapter)
import '#/lib/api/@fake-db'

// ** Contexts for Theme Settings + MUI Components
// import { MaterialUIControllerProvider, useMaterialUIController, setMiniSidenav, setOpenConfigurator } from '#/lib/contexts'
import { SettingsProvider, SettingsConsumer } from '#/lib/contexts/settingsContext'
import ThemeRegistry from '#/ui/theme/ThemeRegistry'

// ** Configs
import '#/lib/config/i18n' // NOT YET SUPPORTED IN NEXT 13
import { defaultACLObj } from '#/lib/config/acl'
// import themeConfig from '#/lib/config/themeConfig'

// ** Layouts
import BlankLayout from '#/ui/layouts/BlankLayout' // this is your default and login layout
import UserLayout from '#/ui/layouts/UserLayout' // this is your user-authorized (dashboard) layout

// ** Helper Components
import Spinner from '#/ui/components/spinner'

// ** CSS Styles
// import '#/ui/styles/globals.css'
// import stylesGlobal from '#/ui/styles/globals.module.css'
// import stylesDemo from '#/ui/styles/demo/demo.module.css'
// import '#/lib/threed/styles/index.css'
import '#/lib/threed/styles/garden.module.css'

// ** Colorful Console Messages: Utility
import ccm from '#/lib/utils/console-colors'

// ==============================================================
// IMPORTS COMPLETE
// console.debug('%c=======================================', ccm.black)
console.debug('%c🥕 ThreeDGarden<FC,R3F>: {layout.tsx}', ccm.green)
// console.debug('%c=======================================', ccm.black)

// ==============================================================
// MAIN APP

// provide basic React Provider context node with props.children
// const ThreeDAppProvider: FC<{ children?: ReactNode }> = (props) => {
const ThreeDAppProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  // const { children } = props
  return (
    <html lang="en">
      <head />
      <body>
        <main id="ThreeDAppProvider">
          {children}
        </main>
      </body>
    </html>
  )
}

// ==============================================================
// ** Security Guard

const AuthConsumer = ({ children, authGuard, guestGuard }: any) => {
  if (!guestGuard && !authGuard) {
    console.debug('%c📛 noGuard loading...', ccm.red)
    // console.debug('%c=======================================', ccm.black)
    return (
      <>{children}</>
    )
  }
  else if (authGuard) {
    console.debug('%c🔱 authGuard loading...', ccm.red)
    // console.debug('%c=======================================', ccm.black)
    return (
      // <AuthGuard fallback={<Spinner />}>
      <>{children}</>
      // </AuthGuard>
    )
  }
  else if (guestGuard) {
    console.debug('%c⚜ guestGuard loading...', ccm.red)
    // console.debug('%c=======================================', ccm.black)
    return (
      // <GuestGuard fallback={<Spinner />}>
      //   <>{children}</>
      // </GuestGuard>
      // <AuthGuard fallback={<Spinner />}>
        <>{children}</>
      // </AuthGuard>
    )
  }
  else {
    console.debug('%c🔱 authGuard loading (by default)...', ccm.red)
    // console.debug('%c=======================================', ccm.black)
    return (
      // <AuthGuard fallback={<Spinner />}>
        <>{children}</>
      // </AuthGuard>
    )
  }
}

// ==============================================================
// ** Construct App using Function Component (Functional Noun)

// const App = (props: any) => {
// const App: FC<AppPropsWithLayoutEmotion> = (props: AppPropsWithLayoutEmotion) => {
// const App: NextComponentType<AppContext, AppInitialProps, AppPropsWithLayoutEmotion> = (props: any) => {
// const App: NextComponentType<AppContext, AppInitialProps, AppPropsWithLayout> = (props: any) => {
const AppLayout = (props: any): JSX.Element => {
  // **

  // // destructure props for vars
  // // const { Component, emotionCache = clientSideEmotionCache, pageProps } = props
  const { Component, pageProps } = props
  // const Component = {
  //   getLayout: () => {},
  //   setConfig: () => {},
  //   authGuard: true,
  //   guestGuard: false,
  //   // acl: defaultACLObj
  //   acl: {
  //     action: 'manage',
  //     subject: 'all',
  //   },
  // }

  // Props.children
  const { children } = props
  // console.debug('🥕 PROPS: AppLayout.props.children', children)

  // ** Props.children.props
  // const props2 = children.props

  // ** Hooks
  const auth = useAuth()

  // const { authGuard, guestGuard, acl } = Component // getLayout, setConfig,
  const authGuard = Component?.authGuard ?? false
  const guestGuard = Component?.guestGuard ?? false
  // const acl = Component.acl ?? defaultACLObj

  // console.debug('%c🥕 auth', ccm.orange, auth)
  // console.debug('%c🥕 router', ccm.orange, router)
  // console.debug('%c🥕 children', ccm.orange, children)
  // console.debug('%c=======================================', ccm.black)

  console.debug('%c🥕 PROPS: AppLayout.props', ccm.orange, props)
  // console.debug('%c🥕 PROPS: AppLayout.Component', ccm.black, Component)
  // console.debug('%c🥕 PROPS: AppLayout.pageProps', ccm.black, pageProps)

  // ** PageComponent.Properties
  const getAppLayout = (props: any): JSX.Element => {
    //
    const { children } = props
    // console.debug('🥕 PROPS: getAppLayout.props', props)
    // console.debug('🥕 PROPS: getAppLayout.props.children', children)

    // const { props2 } = children

    // authorized: UserLayout
    if ((auth.user && auth.user.role) ||
      (  children.props.childProp.segment !== ''
      && children.props.childProp.segment !== 'auth'  )) {
      return (
        <UserLayout key='ThreeDAppLayout-UserLayout'>
          {children}
        </UserLayout>
      )
    }

    // default: BlankLayout
    else {
      return (
        <BlankLayout key='ThreeDAppLayout-BlankLayout'>
          {children}
        </BlankLayout>
      )
    }
  }

  // ** Return JSX
  return (
    <ThreeDAppProvider>
      <AuthProvider>
        <AuthConsumer authGuard={authGuard} guestGuard={guestGuard}>
          {/* <AclGuard aclAbilities={acl} guestGuard={guestGuard}> */}
            <ApolloProvider client={client}>
              <ReduxProvider store={reduxStore}>
                {/* <SettingsProvider { ...(setConfig ? { pageSettings: setConfig() } : { pageSettings: null }) }> */}
                <SettingsProvider { ...({ pageSettings: null }) }>
                  <SettingsConsumer>
                    {({ settings }) => (
                      <ThemeRegistry settings={settings}>
                        {/* {children} */}
                        {
                          getAppLayout(
                            // <EthApp {...props}>
                              // <Component {...pageProps} />
                              {children}
                            // </EthApp>
                          )
                        }
                      </ThemeRegistry>
                    )}
                  </SettingsConsumer>
                </SettingsProvider>
              </ReduxProvider>
            </ApolloProvider>
          {/* </AclGuard> */}
        </AuthConsumer>
      </AuthProvider>
    </ThreeDAppProvider>
  )
}

AppLayout.getLayout = 'HEY HEY HEY'
AppLayout.setConfig = 'true'
AppLayout.authGuard = false
AppLayout.guestGuard = true
AppLayout.acl = {}

export default AppLayout
